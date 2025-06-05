"use client";

import {
    extractBodyContent,
    processChapterContent,
    processContentInChunks,
} from "@/lib/epub/content-processor";
import { parseEpub } from "@/lib/epub/parser";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ContentRenderer } from "./ContentRenderer";
import { LoadingOverlay } from "./LoadingOverlay";
import { EpubReaderProps } from "./types";

export function EpubReader({
    epubData,
    onPositionChange,
    initialPosition = 0,
}: EpubReaderProps) {
    const [content, setContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef<number>(initialPosition);
    const [
        hasSetInitialPosition,
        setHasSetInitialPosition,
    ] = useState(false);

    // Memoize the epubData to prevent unnecessary re-renders
    const memoizedEpubData = useMemo(
        () => epubData,
        [epubData]
    );

    // Handle scroll position tracking with debounce
    const debouncedScrollHandler = useCallback(
        (() => {
            let scrollTimeout: NodeJS.Timeout;
            return () => {
                const container = containerRef.current;
                if (!container) return;

                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }

                scrollTimeout = setTimeout(() => {
                    if (!container) return;

                    // Calculate position as percentage (0-100)
                    const scrollHeight =
                        container.scrollHeight -
                        container.clientHeight;
                    const scrollPosition =
                        container.scrollTop;
                    const percentage = Math.round(
                        (scrollPosition / scrollHeight) *
                            100
                    );

                    // Update position ref
                    positionRef.current = percentage;

                    // Report position change if callback provided
                    if (onPositionChange) {
                        onPositionChange(percentage);
                    }
                }, 200);
            };
        })(),
        [onPositionChange]
    );

    // Set up scroll event listener
    useEffect(() => {
        if (!containerRef.current || isLoading) return;

        const container = containerRef.current;
        container.addEventListener(
            "scroll",
            debouncedScrollHandler,
            { passive: true }
        );

        return () => {
            container.removeEventListener(
                "scroll",
                debouncedScrollHandler
            );
        };
    }, [isLoading, debouncedScrollHandler]);

    // Set initial scroll position after content is loaded
    useEffect(() => {
        if (
            !isLoading &&
            containerRef.current &&
            initialPosition > 0 &&
            !hasSetInitialPosition
        ) {
            const container = containerRef.current;
            const scrollHeight =
                container.scrollHeight -
                container.clientHeight;
            const targetPosition =
                (initialPosition / 100) * scrollHeight;

            container.scrollTo({
                top: targetPosition,
                behavior: "auto",
            });

            setHasSetInitialPosition(true);
        }
    }, [isLoading, initialPosition, hasSetInitialPosition]);

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

                console.time("EPUB parsing");

                // Parse the EPUB file
                const parsedEpub = await parseEpub(
                    memoizedEpubData,
                    signal
                );

                if (signal.aborted) return;

                // Process all chapters
                let allContent = "";
                const basePath = ""; // Base path for resolving image paths

                // Process each chapter
                for (const chapter of parsedEpub.chapters) {
                    if (signal.aborted) return;

                    // Process the chapter content
                    const processedChapter =
                        processChapterContent(
                            chapter,
                            parsedEpub.images,
                            basePath
                        );

                    allContent += processedChapter;

                    // Add yield point for better responsiveness
                    await new Promise((resolve) =>
                        setTimeout(resolve, 0)
                    );
                }

                if (signal.aborted) return;

                // Extract just the body content
                let bodyContent =
                    extractBodyContent(allContent);

                // If we couldn't extract body content, use all content
                if (!bodyContent) {
                    bodyContent = allContent;
                }

                // Process content in chunks for better performance
                const processedContent =
                    await processContentInChunks(
                        bodyContent,
                        signal
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
        };
    }, [memoizedEpubData]);

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
            {/* Loading overlay */}
            <LoadingOverlay isLoading={isLoading} />

            {/* Content renderer */}
            <ContentRenderer
                content={content}
                isLoading={isLoading}
                error={error}
                containerRef={containerRef}
            />
        </div>
    );
}
