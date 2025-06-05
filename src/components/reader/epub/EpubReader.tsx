"use client";

import {
    processChapterContent,
    processContentInChunks,
} from "@/lib/epub/content-processor";
import {
    loadChapterById,
    parseEpub,
} from "@/lib/epub/parser";
import JSZip from "jszip";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ContentRenderer } from "./ContentRenderer";
import { LoadingOverlay } from "./LoadingOverlay";
import {
    EpubReaderProps,
    LoadChapterEvent,
    ParsedEpub,
} from "./types";

declare global {
    interface Window {
        restoreReaderPosition?: (position: number) => void;
    }
}

export function EpubReader({
    epubData,
    onPositionChange,
    initialPosition = 0,
    saveReadingPosition,
}: EpubReaderProps) {
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef<number>(initialPosition);
    const parsedEpubRef = useRef<ParsedEpub | null>(null);
    const zipRef = useRef<JSZip | null>(null);
    const scrollTimeoutRef = useRef<
        ReturnType<typeof setTimeout> | undefined
    >(undefined);
    const hasRestoredPositionRef = useRef(false);
    const lastReportedPositionRef =
        useRef<number>(initialPosition);
    const positionUpdateIntervalRef = useRef<ReturnType<
        typeof setInterval
    > | null>(null);

    // Memoize the epubData to prevent unnecessary re-renders
    const memoizedEpubData = useMemo(
        () => epubData,
        [epubData]
    );

    // Set up periodic position update to ensure reading progress is saved
    useEffect(() => {
        if (isLoading) return;

        // Clear any existing interval
        if (positionUpdateIntervalRef.current) {
            clearInterval(
                positionUpdateIntervalRef.current
            );
        }

        // Set up interval to check if position has changed
        positionUpdateIntervalRef.current = setInterval(
            () => {
                const currentPosition = positionRef.current;

                // Only update if position has changed by at least 1%
                if (
                    Math.abs(
                        currentPosition -
                            lastReportedPositionRef.current
                    ) >= 1
                ) {
                    // Update the last reported position
                    lastReportedPositionRef.current =
                        currentPosition;

                    // Report position change
                    if (onPositionChange) {
                        onPositionChange(currentPosition);
                    }
                }
            },
            3000
        ); // Check every 3 seconds

        return () => {
            if (positionUpdateIntervalRef.current) {
                clearInterval(
                    positionUpdateIntervalRef.current
                );
            }
        };
    }, [isLoading, onPositionChange]);

    // Set up scroll event listener
    useEffect(() => {
        if (!containerRef.current || isLoading) return;

        // Handle scroll events with debounce
        const handleScroll = () => {
            const container = containerRef.current;
            if (!container) return;

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Update position immediately for responsive UI
            const scrollHeight =
                container.scrollHeight -
                container.clientHeight;
            const scrollPosition = container.scrollTop;
            const percentage = Math.round(
                (scrollPosition / scrollHeight) * 100
            );

            // Update position ref immediately
            positionRef.current = percentage;

            // Debounce the callback to avoid too many updates to parent components
            scrollTimeoutRef.current = setTimeout(() => {
                // Report position change if callback provided
                if (onPositionChange) {
                    onPositionChange(percentage);
                }
            }, 200);
        };

        const container = containerRef.current;
        container.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        // Listen for custom position change events from ContentRenderer
        const handlePositionChange = (event: Event) => {
            const customEvent = event as CustomEvent<{
                position: number;
            }>;
            const position = customEvent.detail.position;

            // Update position ref
            positionRef.current = position;

            // Report position change if callback provided
            if (onPositionChange) {
                onPositionChange(position);
            }
        };

        document.addEventListener(
            "reader-position-change",
            handlePositionChange
        );

        return () => {
            container.removeEventListener(
                "scroll",
                handleScroll
            );
            document.removeEventListener(
                "reader-position-change",
                handlePositionChange
            );
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [isLoading, onPositionChange]);

    // Add a direct method to restore position
    useEffect(() => {
        // Define the global position restoration function
        window.restoreReaderPosition = (
            position: number
        ) => {
            console.log(
                `Restoring position to ${position}%`
            );

            // Find the reader content element
            const readerContent = document.getElementById(
                "reader-content"
            );
            if (!readerContent) return;

            // Calculate scroll position
            const scrollHeight =
                readerContent.scrollHeight -
                readerContent.clientHeight;
            const targetPosition =
                (position / 100) * scrollHeight;

            console.log(
                `Scroll height: ${scrollHeight}, target position: ${targetPosition}`
            );

            // Force scroll to position
            readerContent.scrollTo(0, targetPosition);

            // Update progress bar
            const progressBar =
                document.getElementById("progress-bar");
            if (progressBar) {
                progressBar.style.width = `${position}%`;
            }
        };

        return () => {
            window.restoreReaderPosition = undefined;
        };
    }, []);

    // Try to restore position after content is loaded
    useEffect(() => {
        if (
            !isLoading &&
            initialPosition > 0 &&
            !hasRestoredPositionRef.current
        ) {
            console.log(
                `Attempting to restore position to ${initialPosition}%`
            );

            // Wait for content to be fully rendered
            const timer = setTimeout(() => {
                if (window.restoreReaderPosition) {
                    window.restoreReaderPosition(
                        initialPosition
                    );
                    hasRestoredPositionRef.current = true;
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [isLoading, initialPosition]);

    // Handle dynamic chapter loading events
    useEffect(() => {
        if (
            isLoading ||
            !parsedEpubRef.current ||
            !zipRef.current
        )
            return;

        // Listen for load chapter requests
        const handleLoadChapter = async (event: Event) => {
            const customEvent =
                event as CustomEvent<LoadChapterEvent>;
            const { chapterId, direction } =
                customEvent.detail;

            const parsedEpub = parsedEpubRef.current;
            if (!parsedEpub) return;

            await loadDynamicChapter(chapterId, direction);
        };

        // Load a dynamic chapter
        const loadDynamicChapter = async (
            chapterId: string,
            direction: "next" | "prev"
        ) => {
            try {
                const parsedEpub = parsedEpubRef.current;
                const zip = zipRef.current;

                if (
                    !parsedEpub ||
                    !zip ||
                    !parsedEpub.manifestMap
                ) {
                    console.error(
                        "Missing data for dynamic loading"
                    );
                    return;
                }

                // Get base path from the first chapter if available
                let basePathPrefix = "";
                if (parsedEpub.chapters.length > 0) {
                    const firstChapterHref =
                        parsedEpub.chapters[0].href;
                    const pathParts =
                        firstChapterHref.split("/");
                    pathParts.pop();
                    basePathPrefix = pathParts.join("/");
                    if (basePathPrefix)
                        basePathPrefix += "/";
                }

                // Load the chapter
                const chapter = await loadChapterById(
                    zip,
                    chapterId,
                    parsedEpub.manifestMap,
                    basePathPrefix
                );

                if (chapter) {
                    // Process the chapter content
                    const processedChapter =
                        processChapterContent(
                            chapter,
                            parsedEpub.images,
                            basePathPrefix
                        );

                    // Add the chapter to the reader
                    if (
                        window.literaReader &&
                        typeof window.literaReader
                            .appendChapter === "function"
                    ) {
                        window.literaReader.appendChapter(
                            processedChapter,
                            chapter.id
                        );

                        // Scroll to the new chapter if it's a user-initiated navigation
                        if (
                            window.literaReader
                                .scrollToChapter &&
                            direction === "prev"
                        ) {
                            setTimeout(() => {
                                window.literaReader?.scrollToChapter(
                                    chapter.id
                                );
                            }, 100);
                        }
                    }
                }
            } catch (error) {
                console.error(
                    "Error loading dynamic chapter:",
                    error
                );
            }
        };

        // Add event listeners
        document.addEventListener(
            "load-chapter",
            handleLoadChapter
        );

        // Clean up
        return () => {
            document.removeEventListener(
                "load-chapter",
                handleLoadChapter
            );
        };
    }, [isLoading]);

    // Parse the EPUB file and process its content
    useEffect(() => {
        // Create an abort controller to cancel operations if component unmounts
        const abortController = new AbortController();
        const signal = abortController.signal;

        const processEpub = async () => {
            try {
                if (signal.aborted) return;
                setIsLoading(true);
                setError(null);
                // Parse the EPUB file
                const parsedEpub = await parseEpub(
                    memoizedEpubData,
                    signal
                );

                if (signal.aborted) return;

                // Store reference to parsed epub for dynamic loading
                parsedEpubRef.current = parsedEpub;

                // Store JSZip instance
                const zip = new JSZip();
                const loadedZip = await zip.loadAsync(
                    memoizedEpubData
                );
                zipRef.current = loadedZip;

                // Process all chapters instead of just the first one
                let allChaptersContent = "";
                const basePath = ""; // Base path for resolving image paths

                // Process all chapters
                for (const chapter of parsedEpub.chapters) {
                    // Process the chapter content
                    const processedChapter =
                        processChapterContent(
                            chapter,
                            parsedEpub.images,
                            basePath
                        );

                    allChaptersContent += processedChapter;
                }

                if (signal.aborted) return;

                // Calculate chapter sizes if TOC is available
                let tocWithAccuratePositions =
                    parsedEpub.toc || [];
                if (
                    parsedEpub.toc &&
                    parsedEpub.toc.length > 0 &&
                    parsedEpub.manifestMap
                ) {
                    // Map chapters to their content length for more accurate positioning
                    const chapterSizes = new Map<
                        string,
                        number
                    >();

                    // Get chapter sizes based on content length
                    for (const chapter of parsedEpub.chapters) {
                        chapterSizes.set(
                            chapter.id,
                            chapter.content?.length || 0
                        );
                    }

                    // Calculate total content size
                    const totalContentSize = Array.from(
                        chapterSizes.values()
                    ).reduce((sum, size) => sum + size, 0);

                    // Update TOC positions based on actual chapter sizes
                    if (totalContentSize > 0) {
                        let runningPercentage = 0;

                        // Sort TOC items by their current position to maintain order
                        const sortedTopItems = [
                            ...parsedEpub.toc,
                        ]
                            .filter(
                                (item) => item.level === 0
                            )
                            .sort(
                                (a, b) =>
                                    a.position - b.position
                            );

                        // Update positions based on chapter sizes
                        for (const item of sortedTopItems) {
                            // Find corresponding chapter by href
                            const manifestMap =
                                parsedEpub.manifestMap!;
                            const chapterId = Object.keys(
                                manifestMap
                            ).find((id) => {
                                const manifestItem =
                                    manifestMap[id];
                                return item.href.includes(
                                    manifestItem.href
                                );
                            });

                            if (
                                chapterId &&
                                chapterSizes.has(chapterId)
                            ) {
                                // Set position to current running percentage
                                item.position = Math.min(
                                    100,
                                    runningPercentage
                                );

                                // Update running percentage
                                const chapterSize =
                                    chapterSizes.get(
                                        chapterId
                                    ) || 0;
                                runningPercentage +=
                                    (chapterSize /
                                        totalContentSize) *
                                    100;
                            }
                        }

                        // Update the TOC reference
                        tocWithAccuratePositions =
                            parsedEpub.toc;
                    }
                }

                // Add spine data for dynamic loading
                const bodyContent = `<meta name="spine-data" content='${JSON.stringify(
                    parsedEpub.spine
                )}'>
                              <meta name="book-title" content="${truncateBookTitle(
                                  parsedEpub.metadata
                                      .title || "E-Book"
                              )}">
                              <meta name="initial-position" content="${initialPosition}">
                              ${allChaptersContent}`;

                // Process content in chunks for better performance
                const processedContent =
                    await processContentInChunks(
                        bodyContent,
                        signal,
                        initialPosition,
                        tocWithAccuratePositions
                    );

                // Set the processed content
                setContent(processedContent);
                console.timeEnd("EPUB parsing");
                setIsLoading(false);
            } catch (err) {
                if (!signal.aborted) {
                    console.error(
                        "Error parsing EPUB:",
                        err
                    );
                    setError(
                        `Failed to parse EPUB: ${
                            err instanceof Error
                                ? err.message
                                : String(err)
                        }`
                    );
                    setIsLoading(false);
                }
            }
        };

        processEpub();

        // Cleanup function to abort operations if component unmounts
        return () => {
            abortController.abort();
            // Clean up position update interval
            if (positionUpdateIntervalRef.current) {
                clearInterval(
                    positionUpdateIntervalRef.current
                );
                positionUpdateIntervalRef.current = null;
            }
        };
    }, [memoizedEpubData, initialPosition]);

    // Helper function to truncate long book titles for mobile
    const truncateBookTitle = (title: string): string => {
        // Sanitize title to prevent HTML injection
        const sanitizedTitle = title
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        // For very long titles, truncate to reasonable length
        if (sanitizedTitle.length > 40) {
            return sanitizedTitle.substring(0, 37) + "...";
        }

        return sanitizedTitle;
    };

    // Handle anchor clicks for internal navigation
    const handleAnchorClick = useCallback(
        (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                target.tagName === "A" &&
                target.getAttribute("href")?.startsWith("#")
            ) {
                e.preventDefault();
                const id = target
                    .getAttribute("href")
                    ?.substring(1);
                if (id) {
                    // Try to find the element by ID
                    const element =
                        document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({
                            behavior: "smooth",
                        });
                    } else {
                        // Try to find by name attribute as fallback
                        const namedElement =
                            document.querySelector(
                                `[name="${id}"]`
                            );
                        if (namedElement) {
                            namedElement.scrollIntoView({
                                behavior: "smooth",
                            });
                        }
                    }
                }
            }
        },
        []
    );

    // Set up click event listener for handling anchor clicks
    useEffect(() => {
        if (!isLoading && containerRef.current) {
            containerRef.current.addEventListener(
                "click",
                handleAnchorClick
            );

            return () => {
                containerRef.current?.removeEventListener(
                    "click",
                    handleAnchorClick
                );
            };
        }
    }, [isLoading, handleAnchorClick]);

    return (
        <div className="relative w-full h-screen bg-gray-900 flex flex-col no-scrollbar">
            {isLoading && (
                <LoadingOverlay
                    isLoading={isLoading}
                    title={"EPUB File is loaded"}
                    description={
                        "Please wait while we process the content"
                    }
                />
            )}
            <ContentRenderer
                content={content}
                isLoading={isLoading}
                error={error}
                containerRef={containerRef}
                saveReadingPosition={saveReadingPosition}
            />
        </div>
    );
}
