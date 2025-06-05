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
    showControls?: boolean;
    isLoaded?: (imagePath: string) => boolean;
    isPrefetching?: (imagePath: string) => boolean;
}

const DoublePageMode = ({
    pages,
    currentPage,
    settings,
    onPageChange,
    showControls = false,
    isLoaded,
    isPrefetching,
}: ReadingModeProps) => {
    // Ensure we're on an odd page for proper double page display
    const adjustedCurrentPage =
        currentPage % 2 === 0 && currentPage > 1
            ? currentPage - 1
            : currentPage;

    const leftPageIndex = adjustedCurrentPage - 1;
    const rightPageIndex = adjustedCurrentPage;
    const leftPage = pages[leftPageIndex];
    const rightPage = pages[rightPageIndex];

    // Replace state with refs where possible
    const [isReady, setIsReady] = useState(false);
    const preloadedPagesRef = useRef<{
        [key: number]: PageWithTextBlocks;
    }>({});
    const [isCropperOpen, setIsCropperOpen] =
        useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [scale, setScale] = useState(1);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Use a state variable for RTL changes instead of refs
    const [rtlVersion, setRtlVersion] = useState(0);
    const isMountedRef = useRef(true);
    const [isMounted, setIsMounted] = useState(false);

    // Add a state to track the current transform
    const [transform, setTransform] = useState({
        scale: 1,
        positionX: 0,
        positionY: 0,
    });

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        // Set isMounted to true after hydration
        setIsMounted(true);

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Add event listener for right-to-left changes
    useEffect(() => {
        const handleRightToLeftChange = (e: Event) => {
            const rtlEvent = e as RightToLeftChangedEvent;
            console.log(
                "Right-to-left changed event received in DoublePageMode, new value:",
                rtlEvent.detail?.rightToLeft
            );
            // Use state update instead of ref and force update
            if (isMountedRef.current) {
                setRtlVersion((prev) => prev + 1);
            }
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

    // Custom navigation for double page mode
    const handlePrevPage = useCallback(() => {
        if (
            adjustedCurrentPage > 1 &&
            onPageChange &&
            !isCropperOpen &&
            scale <= 1.1 // Only block navigation if significantly zoomed
        ) {
            // Move back two pages
            onPageChange(adjustedCurrentPage - 2);
        }
    }, [
        adjustedCurrentPage,
        onPageChange,
        isCropperOpen,
        scale,
    ]);

    const handleNextPage = useCallback(() => {
        if (
            adjustedCurrentPage + 1 < pages.length &&
            onPageChange &&
            !isCropperOpen &&
            scale <= 1.1 // Only block navigation if significantly zoomed
        ) {
            // Move forward two pages
            onPageChange(adjustedCurrentPage + 2);
        }
    }, [
        adjustedCurrentPage,
        onPageChange,
        pages.length,
        isCropperOpen,
        scale,
    ]);

    // Preload adjacent pages using ref, not state
    useEffect(() => {
        const pagesToPreload = [
            adjustedCurrentPage - 2,
            adjustedCurrentPage - 1,
            adjustedCurrentPage,
            adjustedCurrentPage + 1,
            adjustedCurrentPage + 2,
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
    }, [adjustedCurrentPage, pages]);

    // Ensure the component is properly initialized with the current page
    useEffect(() => {
        // Small delay to ensure the page is properly loaded
        const timer = setTimeout(() => {
            if (isMountedRef.current) {
                setIsReady(true);
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [adjustedCurrentPage]);

    // If current page changed from outside and it's even, adjust it
    useEffect(() => {
        if (
            currentPage % 2 === 0 &&
            currentPage > 1 &&
            onPageChange &&
            isReady
        ) {
            onPageChange(currentPage - 1);
        }
    }, [currentPage, onPageChange, isReady]);

    // Reset zoom when page changes - optimize to prevent unnecessary state updates
    useEffect(() => {
        if (transformRef.current) {
            // Prevent unnecessary resets if scale is already 1
            if (scale !== 1) {
                // Call resetTransform without async wrapper to avoid race conditions
                transformRef.current.resetTransform(0); // Use 0ms duration for immediate reset
            }
            // State updates will be handled by onTransformed callback
        }
    }, [adjustedCurrentPage, leftPage, rightPage, scale]);

    // Prevent wheel scrolling on the container when zoomed - more comprehensive approach
    useEffect(() => {
        const container = containerRef.current;

        const preventWheelScroll = (e: WheelEvent) => {
            // Allow zooming with Ctrl+wheel
            if (e.ctrlKey) {
                return true;
            }

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

        if (container) {
            // Prevent all scroll events when zoomed
            container.addEventListener(
                "wheel",
                preventWheelScroll,
                {
                    passive: false,
                }
            );
            container.addEventListener(
                "touchmove",
                preventTouchMove,
                {
                    passive: false,
                }
            );
            document.addEventListener(
                "wheel",
                preventWheelScroll,
                {
                    passive: false,
                    capture: true,
                }
            );
        }

        return () => {
            if (container) {
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
                    {
                        capture: true,
                    }
                );
            }
        };
    }, [isZoomed]);

    // Memoize page views to prevent unnecessary re-renders
    const leftPageView = useMemo(() => {
        if (!leftPage) return null;
        return (
            <PageView
                key={`left-${currentPage}-${settings.rightToLeft}-${rtlVersion}`}
                pages={pages}
                pageNumber={leftPage.pageNumber}
                settings={{
                    ...settings,
                    showTooltips: settings.showTooltips,
                }}
                priority={true}
                onCropperStateChange={setIsCropperOpen}
                mode="single"
                isLoaded={isLoaded}
                isPrefetching={isPrefetching}
                transform={transform}
            />
        );
    }, [
        leftPage,
        currentPage,
        settings,
        pages,
        rtlVersion,
        isLoaded,
        isPrefetching,
        transform,
    ]);

    const rightPageView = useMemo(() => {
        if (!rightPage) return null;
        return (
            <PageView
                key={`right-${currentPage}-${settings.rightToLeft}-${rtlVersion}`}
                pages={pages}
                pageNumber={rightPage.pageNumber}
                settings={{
                    ...settings,
                    showTooltips: settings.showTooltips,
                }}
                priority={true}
                onCropperStateChange={setIsCropperOpen}
                mode="single"
                isLoaded={isLoaded}
                isPrefetching={isPrefetching}
                transform={transform}
            />
        );
    }, [
        rightPage,
        currentPage,
        settings,
        pages,
        rtlVersion,
        isLoaded,
        isPrefetching,
        transform,
    ]);

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
                alignmentAnimation={{
                    sizeX: 0,
                    sizeY: 0,
                }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
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
                            <div className="flex max-h-full h-full">
                                {settings.rightToLeft ? (
                                    // Right to left (Japanese style) - right page first, then left
                                    <>
                                        {rightPage && (
                                            <div className="relative h-full">
                                                {
                                                    rightPageView
                                                }
                                            </div>
                                        )}
                                        {leftPage && (
                                            <div className="relative h-full">
                                                {
                                                    leftPageView
                                                }
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // Left to right (Western style) - left page first, then right
                                    <>
                                        {leftPage && (
                                            <div className="relative h-full">
                                                {
                                                    leftPageView
                                                }
                                            </div>
                                        )}
                                        {rightPage && (
                                            <div className="relative h-full">
                                                {
                                                    rightPageView
                                                }
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </TransformComponent>

                        {/* Zoom controls */}
                        <div
                            className={`fixed bottom-10 right-4 flex gap-2 transition-opacity duration-300 z-50 ${
                                showControls
                                    ? "opacity-100"
                                    : "opacity-0"
                            }`}
                        >
                            <button
                                onClick={() => zoomIn(0.2)}
                                className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                                aria-label="Zoom in"
                            >
                                <ZoomIn size={16} />
                            </button>
                            <button
                                onClick={() => zoomOut(0.2)}
                                className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                                aria-label="Zoom out"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={() =>
                                    resetTransform()
                                }
                                className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                                aria-label="Reset zoom"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </>
                )}
            </TransformWrapper>

            {/* Navigation buttons for double page mode */}
            <div
                className={`fixed inset-x-0 top-1/2 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-50 -translate-y-1/2 ${
                    showControls && isMounted
                        ? "opacity-100"
                        : "opacity-0"
                }`}
            >
                {/* Left side button */}
                <div className="flex-1 flex justify-start">
                    {settings.rightToLeft
                        ? adjustedCurrentPage + 1 <
                              pages.length && (
                              <button
                                  onClick={handleNextPage}
                                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto ml-4 transition-transform hover:scale-110 sm:ml-16 md:ml-24"
                                  disabled={
                                      isCropperOpen ||
                                      isZoomed
                                  }
                                  style={{
                                      opacity: isZoomed
                                          ? 0.3
                                          : 1,
                                  }}
                                  aria-label="Next page"
                              >
                                  <ArrowLeft size={20} />
                              </button>
                          )
                        : adjustedCurrentPage > 1 && (
                              <button
                                  onClick={handlePrevPage}
                                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto ml-4 transition-transform hover:scale-110 sm:ml-16 md:ml-24"
                                  disabled={
                                      isCropperOpen ||
                                      isZoomed
                                  }
                                  style={{
                                      opacity: isZoomed
                                          ? 0.3
                                          : 1,
                                  }}
                                  aria-label="Previous page"
                              >
                                  <ArrowLeft size={20} />
                              </button>
                          )}
                </div>

                {/* Right side button */}
                <div className="flex-1 flex justify-end">
                    {settings.rightToLeft
                        ? adjustedCurrentPage > 1 && (
                              <button
                                  onClick={handlePrevPage}
                                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto mr-4 transition-transform hover:scale-110 sm:mr-16 md:mr-24"
                                  disabled={
                                      isCropperOpen ||
                                      isZoomed
                                  }
                                  style={{
                                      opacity: isZoomed
                                          ? 0.3
                                          : 1,
                                  }}
                                  aria-label="Previous page"
                              >
                                  <ArrowRight size={20} />
                              </button>
                          )
                        : adjustedCurrentPage + 1 <
                              pages.length && (
                              <button
                                  onClick={handleNextPage}
                                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto mr-4 transition-transform hover:scale-110 sm:mr-16 md:mr-24"
                                  disabled={
                                      isCropperOpen ||
                                      isZoomed
                                  }
                                  style={{
                                      opacity: isZoomed
                                          ? 0.3
                                          : 1,
                                  }}
                                  aria-label="Next page"
                              >
                                  <ArrowRight size={20} />
                              </button>
                          )}
                </div>
            </div>

            {/* Zoom indicator */}
            {isZoomed && (
                <div className="fixed bottom-4 left-4 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded z-50">
                    {Math.round(scale * 100)}%
                </div>
            )}
        </div>
    );
};

export default DoublePageMode;
