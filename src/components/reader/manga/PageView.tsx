"use client";

import { Settings } from "@/hooks/useSettings";
import { PageWithTextBlocks } from "@/types/content";
import { AlertCircle } from "lucide-react";
import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import TextBoxes from "./TextBoxes";

interface PageViewProps {
    page?: PageWithTextBlocks;
    settings: Settings;
    pageNumber: number;
    showPageNumber?: boolean;
    priority?: boolean;
    onCropperStateChange?: (isOpen: boolean) => void;
    mode?: "single" | "longStrip";
    pages?: PageWithTextBlocks[];
    isLoaded?: (imagePath: string) => boolean;
    isPrefetching?: (imagePath: string) => boolean;
    onLoadImage?: () => void;
    transform?: {
        scale: number;
        positionX: number;
        positionY: number;
    };
}

// Memoize the PageView component to prevent unnecessary re-renders
const PageView = memo(function PageView({
    page: passedPage,
    settings,
    pageNumber,
    pages,
    mode = "single",
    isLoaded,
    isPrefetching,
    onLoadImage,
    transform,
}: PageViewProps) {
    // For single/double mode, get the page from the pages array if not directly passed
    const page =
        mode === "longStrip"
            ? passedPage
            : pages && pages.length > 0
            ? pages[pageNumber - 1]
            : passedPage;

    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(
        page?.imagePath || ""
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(
        null
    );
    const mountedRef = useRef(true);
    const dimensionsRef = useRef({ width: 0, height: 0 });
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(
        null
    );
    const resizeObserverRef = useRef<ResizeObserver | null>(
        null
    );

    // Optimized image load handler
    const handleImageLoad = useCallback(() => {
        if (mountedRef.current) {
            setIsLoading(false);
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
            onLoadImage?.();
        }
    }, []);

    // Check prefetch status
    const checkPrefetchStatus = useCallback(() => {
        if (!page?.imagePath) return false;
        return isLoaded ? isLoaded(page.imagePath) : false;
    }, [page?.imagePath, isLoaded]);

    const checkIfPrefetching = useCallback(() => {
        if (!page?.imagePath) return false;
        return isPrefetching
            ? isPrefetching(page.imagePath)
            : false;
    }, [page?.imagePath, isPrefetching]);

    // Component lifecycle
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);

    // Reset loading state when page changes
    useEffect(() => {
        if (!page) return;

        // Check if image is already loaded via prefetch
        if (checkPrefetchStatus()) {
            setIsLoading(false);
            setImageError(false);
            return;
        }

        setIsLoading(true);
        setImageError(false);
        setRetryCount(0);

        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        loadTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && isLoading) {
                if (retryCount < 2) {
                    retryLoadImage();
                } else {
                    setImageError(true);
                    setIsLoading(false);
                }
            }
        }, 5000);
    }, [page, pageNumber, checkPrefetchStatus]);

    // Optimize mobile detection with single listener
    useEffect(() => {
        const checkIfMobile = () => {
            if (typeof window !== "undefined") {
                const mobile = window.innerWidth <= 768;
                if (mobile !== isMobile) {
                    setIsMobile(mobile);
                }
            }
        };

        checkIfMobile();

        // Throttle resize events
        let ticking = false;
        const handleResize = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    checkIfMobile();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("resize", handleResize, {
            passive: true,
        });
        return () =>
            window.removeEventListener(
                "resize",
                handleResize
            );
    }, [isMobile]);

    // Update image URL when page changes
    useEffect(() => {
        if (
            page?.imagePath &&
            page.imagePath !== imageUrl
        ) {
            setImageUrl(page.imagePath);
        }
    }, [page?.imagePath, imageUrl]);

    // Memoized retry function
    const retryLoadImage = useCallback(() => {
        if (!page || retryCount >= 3 || !mountedRef.current)
            return;

        setIsLoading(true);
        setImageError(false);
        setRetryCount((prev) => prev + 1);

        if (imageRef.current) {
            const timestamp = Date.now();
            const newUrl = `${imageUrl}?t=${timestamp}`;
            imageRef.current.style.backgroundImage = `url(${newUrl})`;

            const img = new Image();
            img.onload = () => {
                if (mountedRef.current) {
                    setIsLoading(false);
                }
            };
            img.onerror = () => {
                if (mountedRef.current) {
                    setIsLoading(false);
                    setImageError(true);
                }
            };
            img.src = newUrl;
        }
    }, [page, retryCount, imageUrl]);

    // Memoize optimal dimensions calculation
    const optimalDimensions = useMemo(() => {
        if (!page)
            return {
                width: "100%",
                height: "auto",
                maxWidth: "100%",
            };

        const isWideImage = page.width > page.height * 1.5;
        const viewportWidth =
            typeof window !== "undefined"
                ? window.innerWidth
                : 1200;
        const viewportHeight =
            typeof window !== "undefined"
                ? window.innerHeight * 0.85
                : 800;

        if (isMobile) {
            return {
                width: "100%",
                height: `calc(100vw * ${
                    page.height / page.width
                })`,
                maxWidth: "100%",
            };
        } else {
            if (isWideImage) {
                const maxWidth = Math.min(
                    page.width,
                    viewportWidth * 0.95
                );
                const scaleFactor = maxWidth / page.width;
                const scaledHeight =
                    page.height * scaleFactor;

                if (scaledHeight > viewportHeight) {
                    const heightScaleFactor =
                        viewportHeight / scaledHeight;
                    return {
                        width: `${
                            maxWidth * heightScaleFactor
                        }px`,
                        height: `${viewportHeight}px`,
                        maxWidth: "95vw",
                        maxHeight: `${viewportHeight}px`,
                    };
                }

                return {
                    width: `${maxWidth}px`,
                    height: `${scaledHeight}px`,
                    maxWidth: "95vw",
                    maxHeight: `${viewportHeight}px`,
                };
            } else {
                const maxWidth = Math.min(
                    page.width,
                    viewportWidth * 0.95
                );
                const scaleFactor = maxWidth / page.width;
                const scaledHeight =
                    page.height * scaleFactor;

                return {
                    width: `${maxWidth}px`,
                    height: `${scaledHeight}px`,
                    maxWidth: "95vw",
                };
            }
        }
    }, [page, isMobile]);

    // Optimize image preloading with better error handling
    useEffect(() => {
        if (!page?.imagePath) return;

        // Skip loading if already loaded by prefetch system
        if (checkPrefetchStatus()) {
            setIsLoading(false);
            return;
        }

        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
        }

        const img = new Image();
        img.onload = handleImageLoad;
        img.onerror = () => {
            if (mountedRef.current) {
                setIsLoading(false);
                setImageError(true);
            }
        };

        const url =
            retryCount > 0
                ? `${imageUrl}?t=${Date.now()}`
                : imageUrl;
        img.src = url;

        loadTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && isLoading) {
                setIsLoading(false);
                setImageError(true);
            }
        }, 8000);

        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
            }
            img.onload = null;
            img.onerror = null;
        };
    }, [
        imageUrl,
        retryCount,
        pageNumber,
        handleImageLoad,
        checkPrefetchStatus,
    ]);

    // Optimize resize handling with proper debouncing and RAF
    useEffect(() => {
        if (!imageRef.current) return;

        const handleResize = () => {
            if (!mountedRef.current) return;

            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }

            resizeTimeoutRef.current = setTimeout(() => {
                if (
                    !mountedRef.current ||
                    !imageRef.current
                )
                    return;

                requestAnimationFrame(() => {
                    if (
                        !imageRef.current ||
                        !mountedRef.current
                    )
                        return;

                    const rect =
                        imageRef.current.getBoundingClientRect();
                    const {
                        width: lastWidth,
                        height: lastHeight,
                    } = dimensionsRef.current;

                    if (
                        Math.abs(rect.width - lastWidth) >
                            20 ||
                        Math.abs(rect.height - lastHeight) >
                            20
                    ) {
                        dimensionsRef.current = {
                            width: rect.width,
                            height: rect.height,
                        };
                        // Force re-render for TextBoxes positioning
                        setImageUrl((prev) => prev);
                    }
                });
            }, 100);
        };

        // Clean up previous observer
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        if (typeof ResizeObserver !== "undefined") {
            resizeObserverRef.current = new ResizeObserver(
                handleResize
            );
            resizeObserverRef.current.observe(
                imageRef.current
            );
        }

        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);

    if (!page) return null;

    return (
        <div className="relative w-full">
            <div
                ref={containerRef}
                className="relative flex justify-center w-full"
            >
                {/* Loading indicator */}
                {isLoading && (
                    <div
                        className="flex items-center justify-center bg-gray-800 w-full"
                        style={{
                            aspectRatio: `${page.width} / ${page.height}`,
                        }}
                    >
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-16 w-16 border-4 border-t-orange-500 border-gray-800 rounded-full animate-spin"></div>
                            <p className="mt-3 text-gray-400 text-sm">
                                {checkIfPrefetching()
                                    ? "Prefetching page..."
                                    : `Loading page ${pageNumber}...`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Main content with image as background and TextBoxes overlay */}
                {!isLoading && !imageError && (
                    <div
                        className="relative"
                        style={{
                            width: isMobile
                                ? "100%"
                                : "auto",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <div
                            ref={imageRef}
                            className="select-none transition-opacity duration-300 relative"
                            style={{
                                ...optimalDimensions,
                                aspectRatio: `${page.width} / ${page.height}`,
                                backgroundColor:
                                    settings.darkMode
                                        ? "#000"
                                        : "#fff",
                                boxShadow:
                                    "0 4px 6px rgba(0, 0, 0, 0.1)",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                minHeight: isMobile
                                    ? "50px"
                                    : "auto",
                            }}
                        >
                            <img
                                src={imageUrl}
                                alt={`Page ${pageNumber}`}
                                className="w-full h-full object-contain"
                                style={{
                                    transform:
                                        "translateZ(0)",
                                    willChange: "transform",
                                    imageRendering: "auto",
                                    transformStyle:
                                        "preserve-3d",
                                }}
                                onLoad={handleImageLoad}
                                onError={() => {
                                    console.error(
                                        `Image failed to load: ${imageUrl}`
                                    );
                                }}
                                loading={
                                    mode === "longStrip"
                                        ? "lazy"
                                        : "eager"
                                }
                                decoding="async"
                            />
                        </div>

                        {/* TextBoxes overlay */}
                        {settings.showTooltips !==
                            false && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${page.width}px`,
                                    height: `${page.height}px`,
                                    transform: transform
                                        ? `scale(${
                                              1 /
                                              transform.scale
                                          })`
                                        : "scale(1)",
                                    transformOrigin:
                                        "top left",
                                }}
                            >
                                <TextBoxes
                                    blocks={
                                        page.textBlocks ||
                                        []
                                    }
                                    settings={settings}
                                    imgWidth={page.width}
                                    imgHeight={page.height}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Error state */}
                {imageError && (
                    <div
                        className="flex items-center justify-center bg-gray-800 w-full"
                        style={{
                            aspectRatio: `${page.width} / ${page.height}`,
                        }}
                    >
                        <div className="text-center p-4">
                            <AlertCircle
                                size={32}
                                className="text-red-500 mx-auto mb-2"
                            />
                            <p className="text-red-500 font-medium">
                                Failed to load image
                            </p>
                            <p className="text-gray-400 text-sm my-2">
                                Page {pageNumber}
                            </p>
                            {retryCount < 3 && (
                                <button
                                    onClick={retryLoadImage}
                                    className="mt-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// Add display name for better debugging
PageView.displayName = "PageView";

export default PageView;