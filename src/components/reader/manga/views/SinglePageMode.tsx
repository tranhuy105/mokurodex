"use client";

import { Settings } from "@/hooks/useSettings";
import { PageWithTextBlocks } from "@/types/content";
import {
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ReactZoomPanPinchRef,
    TransformComponent,
    TransformWrapper,
} from "react-zoom-pan-pinch";
import PageView from "../PageView";

// Interface for the right-to-left changed event
interface RightToLeftChangedEvent extends CustomEvent {
    detail: {
        rightToLeft: boolean;
    };
}

interface ReadingModeProps {
    pages: PageWithTextBlocks[];
    currentPage: number;
    settings: Settings;
    initialPage: number;
    onPageChange?: (page: number) => void;
    manga: string;
    volumeId: string;
    showControls?: boolean;
    isLoaded?: (imagePath: string) => boolean;
    isPrefetching?: (imagePath: string) => boolean;
}

// Single Page Mode Component
const SinglePageMode = ({
    pages,
    currentPage,
    settings,
    onPageChange,
    showControls = false,
    isLoaded,
    isPrefetching,
}: ReadingModeProps) => {
    // Use direct ref access to avoid unnecessary re-renders
    const preloadedPagesRef = useRef<{
        [key: number]: PageWithTextBlocks;
    }>({});
    const [isCropperOpen, setIsCropperOpen] =
        useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [scale, setScale] = useState(1);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(true);
    const [isMounted, setIsMounted] = useState(false);

    // Memoize the current page to prevent unnecessary re-renders
    const page = useMemo(
        () => pages[currentPage - 1],
        [pages, currentPage]
    );

    // Add a state to track the current transform
    const [transform, setTransform] = useState({
        scale: 1,
        positionX: 0,
        positionY: 0,
    });

    const handleResetTransform = () => {
        if (transformRef.current) {
            transformRef.current.resetTransform();
        }
    };

    // Preload adjacent pages - can be kept for backward compatibility
    const preloadAdjacentPages = useCallback(() => {
        const pagesToPreload = [
            currentPage - 1,
            currentPage,
            currentPage + 1,
        ];

        pagesToPreload.forEach((pageNum) => {
            if (
                pageNum > 0 &&
                pageNum <= pages.length &&
                !preloadedPagesRef.current[pageNum]
            ) {
                preloadedPagesRef.current[pageNum] =
                    pages[pageNum - 1];
            }
        });
    }, [currentPage, pages]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        // Preload current and adjacent pages immediately on mount
        preloadAdjacentPages();

        // Set isMounted to true after hydration
        setIsMounted(true);
        return () => {
            isMountedRef.current = false;
        };
    }, [preloadAdjacentPages]);

    // Add event listener for right-to-left changes
    useEffect(() => {
        const handleRightToLeftChange = (e: Event) => {
            const rtlEvent = e as RightToLeftChangedEvent;
            console.log(
                "Right-to-left changed event received in SinglePageMode, new value:",
                rtlEvent.detail?.rightToLeft
            );

            if (!isMountedRef.current) return;

            // Force update using minimal approach
            forceUpdate();
        };

        window.addEventListener(
            "rightToLeftChanged",
            handleRightToLeftChange
        );
        return () =>
            window.removeEventListener(
                "rightToLeftChanged",
                handleRightToLeftChange
            );
    }, []);

    // Minimal force update approach
    const [, updateState] = useState({});
    const forceUpdate = useCallback(
        () => updateState({}),
        []
    );

    // Memoize navigation handlers to prevent unnecessary re-renders
    const handlePrevPage = useCallback(() => {
        if (
            currentPage > 1 &&
            onPageChange &&
            !isCropperOpen &&
            scale <= 1.1 // Only block navigation if significantly zoomed
        ) {
            onPageChange(currentPage - 1);
        }
    }, [currentPage, onPageChange, isCropperOpen, scale]);

    const handleNextPage = useCallback(() => {
        if (
            currentPage < pages.length &&
            onPageChange &&
            !isCropperOpen &&
            scale <= 1.1 // Only block navigation if significantly zoomed
        ) {
            onPageChange(currentPage + 1);
        }
    }, [
        currentPage,
        onPageChange,
        pages.length,
        isCropperOpen,
        scale,
    ]);

    // Handle cropper state change
    const handleCropperStateChange = useCallback(
        (isOpen: boolean) => {
            setIsCropperOpen(isOpen);
        },
        []
    );

    // Add keyboard navigation - optimized to use passive event listeners where possible
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isCropperOpen || isZoomed) return;

            if (settings.rightToLeft) {
                // Swap arrow keys in right-to-left mode
                if (
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowDown"
                ) {
                    handleNextPage();
                } else if (
                    e.key === "ArrowRight" ||
                    e.key === "ArrowUp"
                ) {
                    handlePrevPage();
                }
            } else {
                // Standard left-to-right controls
                if (
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowUp"
                ) {
                    handlePrevPage();
                } else if (
                    e.key === "ArrowRight" ||
                    e.key === "ArrowDown"
                ) {
                    handleNextPage();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
    }, [
        handlePrevPage,
        handleNextPage,
        isCropperOpen,
        isZoomed,
        settings.rightToLeft,
    ]);

    // Preload adjacent pages when current page changes
    useEffect(() => {
        preloadAdjacentPages();
    }, [currentPage, preloadAdjacentPages]);

    // Prevent wheel scrolling on the container when zoomed - optimized event handling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const preventWheelScroll = (e: WheelEvent) => {
            // Allow zooming with Ctrl+wheel
            if (e.ctrlKey) return true;

            if (isZoomed) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            return true;
        };

        const preventTouchMove = (e: TouchEvent) => {
            if (isZoomed) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            return true;
        };

        // Use passive: false for the wheel and touch events
        container.addEventListener(
            "wheel",
            preventWheelScroll,
            { passive: false }
        );
        container.addEventListener(
            "touchmove",
            preventTouchMove,
            { passive: false }
        );
        document.addEventListener(
            "wheel",
            preventWheelScroll,
            { passive: false, capture: true }
        );

        return () => {
            container.removeEventListener(
                "wheel",
                preventWheelScroll
            );
            container.removeEventListener(
                "touchmove",
                preventTouchMove
            );
            document.removeEventListener(
                "wheel",
                preventWheelScroll,
                { capture: true }
            );
        };
    }, [isZoomed]);

    // Memoize the PageView component to prevent unnecessary re-renders
    const pageViewComponent = useMemo(() => {
        if (!page) return null;
        return (
            <PageView
                key={`${currentPage}-${settings.rightToLeft}`}
                pages={pages}
                settings={{
                    ...settings,
                    showTooltips: settings.showTooltips,
                }}
                pageNumber={currentPage}
                priority={true}
                onCropperStateChange={
                    handleCropperStateChange
                }
                mode="single"
                isLoaded={isLoaded}
                isPrefetching={isPrefetching}
                onLoadImage={handleResetTransform}
                transform={transform}
            />
        );
    }, [
        currentPage,
        settings,
        pages,
        handleCropperStateChange,
        isLoaded,
        isPrefetching,
        transform,
    ]);

    // Early return if page is not available
    if (!page) return null;

    // Optimize zoom control handlers
    const handleZoomIn = () => {
        if (transformRef.current) {
            transformRef.current.zoomIn(0.1);
        }
    };

    const handleZoomOut = () => {
        if (transformRef.current) {
            transformRef.current.zoomOut(0.1);
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full flex justify-center items-center bg-gray-900 no-scrollbar"
            style={{
                touchAction: isZoomed ? "none" : "auto",
            }}
        >
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{
                    step: 0.1,
                    activationKeys: ["Control"],
                }}
                doubleClick={{
                    disabled: false,
                }}
                onTransformed={(ref) => {
                    if (isMountedRef.current) {
                        const newScale = ref.state.scale;
                        const newPositionX =
                            ref.state.positionX;
                        const newPositionY =
                            ref.state.positionY;

                        // Update transform state
                        setTransform({
                            scale: newScale,
                            positionX: newPositionX,
                            positionY: newPositionY,
                        });

                        // Only update zoom state when there's an actual change
                        if (
                            Math.abs(newScale - scale) >
                            0.01
                        ) {
                            setIsZoomed(newScale > 1.01);
                            setScale(newScale);
                        }
                    }
                }}
                ref={transformRef}
            >
                {() => (
                    <>
                        <TransformComponent
                            wrapperStyle={{
                                width: "100%",
                                height: "100%",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            contentStyle={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: isZoomed
                                    ? "grab"
                                    : "default",
                                willChange: "transform",
                                transition:
                                    "transform 0.1s ease",
                            }}
                        >
                            {page && (
                                <div>
                                    {pageViewComponent}
                                </div>
                            )}
                        </TransformComponent>

                        {/* Zoom controls - show only when controls are visible */}
                        {showControls && (
                            <div className="absolute bottom-4 left-4 flex space-x-2 opacity-80 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleZoomIn}
                                    className="flex items-center justify-center w-9 h-9 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all"
                                    aria-label="Zoom in"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    onClick={handleZoomOut}
                                    className="flex items-center justify-center w-9 h-9 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all"
                                    aria-label="Zoom out"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    onClick={
                                        handleResetTransform
                                    }
                                    className="flex items-center justify-center w-9 h-9 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg transition-all"
                                    aria-label="Reset zoom"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </TransformWrapper>

            {/* Navigation buttons - show only when controls are visible and not zoomed */}
            {showControls && !isZoomed && isMounted && (
                <>
                    {/* Previous Page Button - direction depends on reading mode */}
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1}
                        className={`absolute ${
                            settings.rightToLeft
                                ? "right-1 md:right-4"
                                : "left-1 md:left-4"
                        } top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 ${
                            currentPage > 1
                                ? "bg-gray-800 hover:bg-gray-700"
                                : "bg-gray-800 opacity-40"
                        } bg-opacity-70 text-white rounded-full shadow-lg transition-all`}
                        aria-label="Previous page"
                    >
                        {settings.rightToLeft ? (
                            <ArrowRight size={24} />
                        ) : (
                            <ArrowLeft size={24} />
                        )}
                    </button>

                    {/* Next Page Button - direction depends on reading mode */}
                    <button
                        onClick={handleNextPage}
                        disabled={
                            currentPage >= pages.length
                        }
                        className={`absolute ${
                            settings.rightToLeft
                                ? "left-1 md:left-4"
                                : "right-1 md:right-4"
                        } top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 ${
                            currentPage < pages.length
                                ? "bg-gray-800 hover:bg-gray-700"
                                : "bg-gray-800 opacity-40"
                        } bg-opacity-70 text-white rounded-full shadow-lg transition-all`}
                        aria-label="Next page"
                    >
                        {settings.rightToLeft ? (
                            <ArrowLeft size={24} />
                        ) : (
                            <ArrowRight size={24} />
                        )}
                    </button>
                </>
            )}

            {/* Zoom indicator */}
            {isZoomed && (
                <div className="fixed bottom-4 left-4 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded z-50">
                    {Math.round(scale * 100)}%
                </div>
            )}
        </div>
    );
};

export default SinglePageMode;
