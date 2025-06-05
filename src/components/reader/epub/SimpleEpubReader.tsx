"use client";

import { cn } from "@/lib/utils";
import JSZip from "jszip";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { parseStringPromise } from "xml2js";

interface ManifestItem {
    id: string;
    href: string;
    "media-type": string;
}

interface SimpleEpubReaderProps {
    epubData: ArrayBuffer;
    onPositionChange?: (position: number) => void;
    initialPosition?: number;
}

/**
 * @deprecated Use EpubReader instead
 */
export function SimpleEpubReader({
    epubData,
    onPositionChange,
    initialPosition = 0,
}: SimpleEpubReaderProps) {
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

    // OPTIMIZATION 1: Memoize and debounce the scroll handler
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

    // Calculate and report scroll position
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

    // OPTIMIZATION 2: Move heavy processing to Web Worker (simulation with async chunks)
    const processContentInChunks = useCallback(
        async (content: string, signal: AbortSignal) => {
            return new Promise<string>(
                (resolve, reject) => {
                    // Use requestIdleCallback for non-blocking processing
                    const processChunk = (
                        content: string
                    ) => {
                        if (signal.aborted) {
                            reject(
                                new Error(
                                    "Processing aborted"
                                )
                            );
                            return;
                        }

                        // Process content in smaller chunks to avoid blocking
                        const CHUNK_SIZE = 50000; // Process 50KB at a time
                        let processedContent = "";
                        let currentIndex = 0;

                        const processNextChunk = () => {
                            const chunk = content.slice(
                                currentIndex,
                                currentIndex + CHUNK_SIZE
                            );
                            if (chunk) {
                                processedContent += chunk;
                                currentIndex += CHUNK_SIZE;

                                // Use scheduler API for better performance
                                if (
                                    "scheduler" in window &&
                                    "postTask" in
                                        window.scheduler
                                ) {
                                    (
                                        window.scheduler as any
                                    ).postTask(
                                        processNextChunk,
                                        {
                                            priority:
                                                "background",
                                        }
                                    );
                                } else if (
                                    "requestIdleCallback" in
                                    window
                                ) {
                                    requestIdleCallback(
                                        processNextChunk
                                    );
                                } else {
                                    setTimeout(
                                        processNextChunk,
                                        0
                                    );
                                }
                            } else {
                                resolve(processedContent);
                            }
                        };

                        processNextChunk();
                    };

                    if ("requestIdleCallback" in window) {
                        requestIdleCallback(() =>
                            processChunk(content)
                        );
                    } else {
                        setTimeout(
                            () => processChunk(content),
                            0
                        );
                    }
                }
            );
        },
        []
    );

    // Parse EPUB and extract content
    useEffect(() => {
        // Create an abort controller to cancel operations if component unmounts
        const abortController = new AbortController();
        const signal = abortController.signal;

        const parseEpub = async () => {
            try {
                if (signal.aborted) return;
                setIsLoading(true);
                setError(null);

                // Load the EPUB file using JSZip
                console.time("EPUB parsing");
                const zip = new JSZip();
                const epubZip = await zip.loadAsync(
                    memoizedEpubData
                );

                if (signal.aborted) return;

                // Find the container.xml file
                const containerXml = await epubZip
                    .file("META-INF/container.xml")
                    ?.async("text");
                if (!containerXml) {
                    throw new Error(
                        "Invalid EPUB: container.xml not found"
                    );
                }

                if (signal.aborted) return;

                // Parse container.xml to find the OPF path
                const containerData =
                    await parseStringPromise(containerXml);
                const opfPath =
                    containerData.container.rootfiles[0]
                        .rootfile[0].$["full-path"];

                // Read the OPF file
                const opfContent = await epubZip
                    .file(opfPath)
                    ?.async("text");
                if (!opfContent) {
                    throw new Error(
                        "Invalid EPUB: OPF file not found"
                    );
                }

                if (signal.aborted) return;

                // Parse the OPF file
                const opfData = await parseStringPromise(
                    opfContent
                );
                const manifest =
                    opfData.package.manifest[0].item;
                const spine =
                    opfData.package.spine[0].itemref;

                // Get the base directory for resolving relative paths
                const basePath = opfPath
                    .split("/")
                    .slice(0, -1)
                    .join("/");
                const basePathPrefix = basePath
                    ? `${basePath}/`
                    : "";

                // Create a map of all manifest items
                const manifestMap = manifest.reduce(
                    (
                        acc: Record<string, ManifestItem>,
                        item: { $: ManifestItem }
                    ) => {
                        acc[item.$.id] = item.$;
                        return acc;
                    },
                    {}
                );

                // Extract all HTML content in spine order
                let allContent = "";
                const imageMap: Record<string, string> = {};

                console.time("Image processing");

                // Find all image items in the manifest
                const imageItems = manifest.filter(
                    (item: { $: ManifestItem }) => {
                        return (
                            item.$ &&
                            item.$["media-type"] &&
                            item.$["media-type"].startsWith(
                                "image/"
                            )
                        );
                    }
                );

                // Log potential cover images for debugging
                const potentialCoverImages =
                    imageItems.filter(
                        (item: { $: ManifestItem }) => {
                            const href =
                                item.$.href.toLowerCase();
                            return (
                                href.includes("cover") ||
                                item.$.id
                                    .toLowerCase()
                                    .includes("cover")
                            );
                        }
                    );

                console.log(
                    "Potential cover images found:",
                    potentialCoverImages.map(
                        (item: { $: ManifestItem }) => ({
                            id: item.$.id,
                            href: item.$.href,
                            type: item.$["media-type"],
                        })
                    )
                );

                // OPTIMIZATION 3: Reduce batch size and add better memory management
                const BATCH_SIZE = 5; // Reduced from 10 for better memory management
                for (
                    let i = 0;
                    i < imageItems.length;
                    i += BATCH_SIZE
                ) {
                    if (signal.aborted) return;

                    const batch = imageItems.slice(
                        i,
                        i + BATCH_SIZE
                    );

                    // OPTIMIZATION 4: Process images with better concurrency control
                    const batchPromises = batch.map(
                        async (itemObj: {
                            $: ManifestItem;
                        }) => {
                            const item = itemObj.$;
                            try {
                                // Normalize the image path
                                const imagePath = `${basePathPrefix}${item.href}`;

                                // Handle relative paths in image href
                                let resolvedPath =
                                    item.href;
                                if (
                                    item.href.includes(
                                        "../"
                                    )
                                ) {
                                    // Get the directory structure
                                    const parts =
                                        item.href.split(
                                            "/"
                                        );
                                    const fileName =
                                        parts.pop() || "";

                                    // Count how many levels up we need to go
                                    let upCount = 0;
                                    for (const part of parts) {
                                        if (part === "..")
                                            upCount++;
                                    }

                                    // Get base directory parts
                                    const basePathParts =
                                        basePathPrefix
                                            .split("/")
                                            .filter(
                                                (p) => p
                                            );

                                    // Go up the required number of levels
                                    const newBasePath =
                                        basePathParts.slice(
                                            0,
                                            Math.max(
                                                0,
                                                basePathParts.length -
                                                    upCount
                                            )
                                        );

                                    // Remove all '../' parts from the path
                                    const remainingParts =
                                        parts.filter(
                                            (p) =>
                                                p !== ".."
                                        );

                                    // Construct the resolved path
                                    resolvedPath = [
                                        ...newBasePath,
                                        ...remainingParts,
                                        fileName,
                                    ].join("/");
                                    console.log(
                                        `Resolved relative image path: ${item.href} -> ${resolvedPath}`
                                    );
                                }

                                // Generate a list of possible paths for this image
                                const fileName =
                                    item.href
                                        .split("/")
                                        .pop() || "";
                                const possiblePaths = [
                                    imagePath,
                                    imagePath.replace(
                                        /^\//,
                                        ""
                                    ),
                                    `OEBPS/${item.href}`,
                                    item.href,
                                    resolvedPath,
                                    fileName,
                                    `images/${fileName}`,
                                    `Images/${fileName}`,
                                    `OEBPS/images/${fileName}`,
                                    `OEBPS/Images/${fileName}`,
                                    // Add more variations
                                    `OEBPS/${fileName}`,
                                    `${basePathPrefix}images/${fileName}`,
                                    `${basePathPrefix}Images/${fileName}`,
                                ];

                                let imageFile = null;
                                let foundPath = null;
                                for (const path of possiblePaths) {
                                    imageFile =
                                        epubZip.file(path);
                                    if (imageFile) {
                                        foundPath = path;
                                        break;
                                    }
                                }

                                if (imageFile) {
                                    const imageData =
                                        await imageFile.async(
                                            "base64"
                                        );
                                    const mimeType =
                                        item[
                                            "media-type"
                                        ] || "image/jpeg";
                                    const dataUrl = `data:${mimeType};base64,${imageData}`;

                                    // Store image with all possible paths for better lookup
                                    // Store the original path
                                    imageMap[item.href] =
                                        dataUrl;

                                    // Store with basePathPrefix
                                    imageMap[imagePath] =
                                        dataUrl;

                                    // Store just the filename
                                    imageMap[fileName] =
                                        dataUrl;

                                    // Store with common directory prefixes
                                    imageMap[
                                        `images/${fileName}`
                                    ] = dataUrl;
                                    imageMap[
                                        `Images/${fileName}`
                                    ] = dataUrl;
                                    imageMap[
                                        `OEBPS/images/${fileName}`
                                    ] = dataUrl;
                                    imageMap[
                                        `OEBPS/Images/${fileName}`
                                    ] = dataUrl;

                                    // If this is the path that worked, log it
                                    if (foundPath) {
                                        console.log(
                                            `Image found at: ${foundPath} (original href: ${item.href})`
                                        );
                                    }
                                } else {
                                    console.warn(
                                        `Failed to find image: ${item.href} (tried ${possiblePaths.length} paths)`
                                    );
                                }
                            } catch (err) {
                                console.warn(
                                    `Failed to process image: ${item.href}`,
                                    err
                                );
                            }
                        }
                    );

                    await Promise.all(batchPromises);

                    // OPTIMIZATION 5: Add yield point for better responsiveness
                    await new Promise((resolve) =>
                        setTimeout(resolve, 0)
                    );
                }

                console.timeEnd("Image processing");

                if (signal.aborted) return;

                console.time("HTML processing");

                // Process HTML content in batches for better performance
                const spineItems = spine.map(
                    (item: { $: { idref: string } }) =>
                        item.$.idref
                );
                const CHAPTER_BATCH_SIZE = 3; // Reduced from 5 for better memory management

                for (
                    let i = 0;
                    i < spineItems.length;
                    i += CHAPTER_BATCH_SIZE
                ) {
                    if (signal.aborted) return;

                    const batchItems = spineItems.slice(
                        i,
                        i + CHAPTER_BATCH_SIZE
                    );
                    const batchContent = await Promise.all(
                        batchItems.map(
                            async (itemId: string) => {
                                const item =
                                    manifestMap[itemId];
                                if (!item || !item.href)
                                    return "";

                                // Get the chapter content
                                const chapterPath = `${basePathPrefix}${item.href}`;
                                let chapterContent =
                                    (await epubZip
                                        .file(chapterPath)
                                        ?.async("text")) ||
                                    "";

                                if (chapterContent) {
                                    // OPTIMIZATION 6: Pre-compile regex patterns
                                    const imgRegex =
                                        /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
                                    const svgRegex =
                                        /<image[^>]*xlink:href=["']([^"']*)["'][^>]*>/gi;
                                    const linkRegex =
                                        /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;

                                    // Process the HTML to replace image sources with data URLs
                                    chapterContent =
                                        chapterContent.replace(
                                            imgRegex,
                                            (
                                                match,
                                                src
                                            ) => {
                                                // Handle relative paths like "../images/00041.jpeg"
                                                let resolvedSrc =
                                                    src;

                                                // If it starts with "../", resolve the relative path
                                                if (
                                                    src.startsWith(
                                                        "../"
                                                    )
                                                ) {
                                                    // Get the current chapter directory
                                                    const chapterDir =
                                                        item.href
                                                            .split(
                                                                "/"
                                                            )
                                                            .slice(
                                                                0,
                                                                -1
                                                            )
                                                            .join(
                                                                "/"
                                                            );

                                                    // Remove the "../" and combine with directory above chapter
                                                    const parentDir =
                                                        chapterDir
                                                            .split(
                                                                "/"
                                                            )
                                                            .slice(
                                                                0,
                                                                -1
                                                            )
                                                            .join(
                                                                "/"
                                                            );
                                                    resolvedSrc =
                                                        src.replace(
                                                            /^\.\.\//,
                                                            `${
                                                                parentDir
                                                                    ? parentDir +
                                                                      "/"
                                                                    : ""
                                                            }`
                                                        );

                                                    console.log(
                                                        `Resolved relative path: ${src} -> ${resolvedSrc}`
                                                    );
                                                }

                                                // Try multiple ways to match the image
                                                const relativeSrc =
                                                    resolvedSrc
                                                        .split(
                                                            "/"
                                                        )
                                                        .pop() ||
                                                    "";

                                                // Try all possible paths for this image
                                                const possibleImagePaths =
                                                    [
                                                        resolvedSrc,
                                                        `${basePathPrefix}${resolvedSrc}`,
                                                        relativeSrc,
                                                        `images/${relativeSrc}`,
                                                        `Images/${relativeSrc}`,
                                                        `OEBPS/images/${relativeSrc}`,
                                                        `OEBPS/Images/${relativeSrc}`,
                                                    ];

                                                // Check if any of these paths exist in our image map
                                                let dataUrl =
                                                    null;
                                                for (const path of possibleImagePaths) {
                                                    if (
                                                        imageMap[
                                                            path
                                                        ]
                                                    ) {
                                                        dataUrl =
                                                            imageMap[
                                                                path
                                                            ];
                                                        break;
                                                    }
                                                }

                                                if (
                                                    dataUrl
                                                ) {
                                                    return match.replace(
                                                        src,
                                                        dataUrl
                                                    );
                                                }

                                                // If not found, replace with a placeholder
                                                console.warn(
                                                    `Image not found in EPUB: ${src} (tried ${possibleImagePaths.join(
                                                        ", "
                                                    )})`
                                                );
                                                return `<div class="missing-image">Image not found: ${relativeSrc}</div>`;
                                            }
                                        );

                                    // Also handle SVG images with xlink:href
                                    chapterContent =
                                        chapterContent.replace(
                                            svgRegex,
                                            (
                                                match,
                                                href
                                            ) => {
                                                // Handle relative paths
                                                let resolvedHref =
                                                    href;

                                                // If it starts with "../", resolve the relative path
                                                if (
                                                    href.startsWith(
                                                        "../"
                                                    )
                                                ) {
                                                    const chapterDir =
                                                        item.href
                                                            .split(
                                                                "/"
                                                            )
                                                            .slice(
                                                                0,
                                                                -1
                                                            )
                                                            .join(
                                                                "/"
                                                            );
                                                    const parentDir =
                                                        chapterDir
                                                            .split(
                                                                "/"
                                                            )
                                                            .slice(
                                                                0,
                                                                -1
                                                            )
                                                            .join(
                                                                "/"
                                                            );
                                                    resolvedHref =
                                                        href.replace(
                                                            /^\.\.\//,
                                                            `${
                                                                parentDir
                                                                    ? parentDir +
                                                                      "/"
                                                                    : ""
                                                            }`
                                                        );
                                                    console.log(
                                                        `Resolved SVG image path: ${href} -> ${resolvedHref}`
                                                    );
                                                }

                                                // Get the filename
                                                const relativeSrc =
                                                    resolvedHref
                                                        .split(
                                                            "/"
                                                        )
                                                        .pop() ||
                                                    "";

                                                // Try all possible paths for this image
                                                const possibleImagePaths =
                                                    [
                                                        resolvedHref,
                                                        `${basePathPrefix}${resolvedHref}`,
                                                        relativeSrc,
                                                        `images/${relativeSrc}`,
                                                        `Images/${relativeSrc}`,
                                                        `OEBPS/images/${relativeSrc}`,
                                                        `OEBPS/Images/${relativeSrc}`,
                                                    ];

                                                // Check if any of these paths exist in our image map
                                                let dataUrl =
                                                    null;
                                                for (const path of possibleImagePaths) {
                                                    if (
                                                        imageMap[
                                                            path
                                                        ]
                                                    ) {
                                                        dataUrl =
                                                            imageMap[
                                                                path
                                                            ];
                                                        break;
                                                    }
                                                }

                                                if (
                                                    dataUrl
                                                ) {
                                                    return match.replace(
                                                        href,
                                                        dataUrl
                                                    );
                                                }

                                                console.warn(
                                                    `SVG image not found: ${href} (tried ${possibleImagePaths.join(
                                                        ", "
                                                    )})`
                                                );
                                                return match; // Keep original if not found
                                            }
                                        );

                                    // Fix internal links to prevent 404 errors
                                    chapterContent =
                                        chapterContent.replace(
                                            linkRegex,
                                            (
                                                match,
                                                href
                                            ) => {
                                                // If it's an external link, leave it alone
                                                if (
                                                    href.startsWith(
                                                        "http://"
                                                    ) ||
                                                    href.startsWith(
                                                        "https://"
                                                    )
                                                ) {
                                                    return match;
                                                }

                                                // If it's an internal link, convert it to an anchor link
                                                // Extract just the ID part if it has a hash
                                                if (
                                                    href.includes(
                                                        "#"
                                                    )
                                                ) {
                                                    const hashPart =
                                                        href.split(
                                                            "#"
                                                        )[1];
                                                    return match.replace(
                                                        href,
                                                        `#${hashPart}`
                                                    );
                                                }

                                                // For other internal links, prevent navigation
                                                return match.replace(
                                                    href,
                                                    "javascript:void(0)"
                                                );
                                            }
                                        );

                                    return `<div class="chapter" data-chapter-id="${item.id}">${chapterContent}</div>`;
                                }
                                return "";
                            }
                        )
                    );

                    allContent += batchContent.join("");

                    // OPTIMIZATION 7: Add yield point after each batch
                    await new Promise((resolve) =>
                        setTimeout(resolve, 0)
                    );
                }

                if (signal.aborted) return;

                // Extract just the body content from each chapter
                const bodyContentRegex =
                    /<body[^>]*>([\s\S]*?)<\/body>/gi;
                let bodyContent = "";
                let match;

                while (
                    (match =
                        bodyContentRegex.exec(
                            allContent
                        )) !== null
                ) {
                    bodyContent += match[1];
                }

                // If we couldn't extract body content, use all content
                if (!bodyContent) {
                    bodyContent = allContent;
                }

                console.timeEnd("HTML processing");

                if (signal.aborted) return;

                // OPTIMIZATION 8: Process content in chunks for better responsiveness
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

        parseEpub();

        // Cleanup function to abort operations if component unmounts
        return () => {
            abortController.abort();
        };
    }, [memoizedEpubData, processContentInChunks]);

    // OPTIMIZATION 9: Memoize anchor click handler
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

    // Handle anchor clicks for navigation
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
            {/* Loading indicator */}
            {isLoading && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                </div>
            )}

            {/* Content area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto light-novel-reader p-4 md:p-8 pt-16"
                style={{
                    // OPTIMIZATION 10: CSS optimizations for better rendering
                    willChange: "scroll-position",
                    contain: "layout style paint",
                }}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                        <p className="text-sm text-gray-300 mt-4">
                            Loading EPUB content...
                        </p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500 p-4">
                            {error}
                        </p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <div
                            className={cn(
                                "light-novel-content text-white"
                            )}
                            dangerouslySetInnerHTML={{
                                __html: content,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
