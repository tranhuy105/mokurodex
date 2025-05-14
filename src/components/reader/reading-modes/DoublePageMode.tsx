"use client";

import { Settings } from "@/hooks/useSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import PageView from "../PageView";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MangaPage } from "@/types/manga";

// Interface for the right-to-left changed event
interface RightToLeftChangedEvent extends CustomEvent {
  detail: {
    rightToLeft: boolean;
  };
}

interface ReadingModeProps {
  pages: MangaPage[];
  currentPage: number;
  settings: Settings;
  initialPage: number;
  onPageChange?: (page: number) => void;
  manga: string;
  volumeId: string;
  showControls?: boolean;
}

const DoublePageMode = ({
  pages,
  currentPage,
  settings,
  onPageChange,
  manga,
  volumeId,
  showControls = false,
}: ReadingModeProps) => {
  // Ensure we're on an odd page for proper double page display
  const adjustedCurrentPage =
    currentPage % 2 === 0 && currentPage > 1 ? currentPage - 1 : currentPage;

  const leftPageIndex = adjustedCurrentPage - 1;
  const rightPageIndex = adjustedCurrentPage;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

  // Replace state with refs where possible
  const [isReady, setIsReady] = useState(false);
  const preloadedPagesRef = useRef<{ [key: number]: MangaPage }>({});
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const transformRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use a ref instead of state for force rerender
  const forceRerenderRef = useRef(0);
  const isMountedRef = useRef(true);

  // Create a state with update function stored in ref to avoid linter errors
  const [, setDummy] = useState({});
  const forceUpdateRef = useRef(() => {
    setDummy(Object.assign({}));
  });

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
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
      // Increment ref counter to force rerender without state update
      forceRerenderRef.current++;
      // Force re-render using an empty object - only when mounted
      if (isMountedRef.current) {
        forceUpdateRef.current();
      }
    };

    window.addEventListener("rightToLeftChanged", handleRightToLeftChange);
    return () =>
      window.removeEventListener("rightToLeftChanged", handleRightToLeftChange);
  }, []);

  // Custom navigation for double page mode
  const handlePrevPage = useCallback(() => {
    if (
      adjustedCurrentPage > 1 &&
      onPageChange &&
      !isCropperOpen &&
      !isZoomed
    ) {
      // When in right-to-left mode, "previous" moves backward in page numbers
      onPageChange(adjustedCurrentPage - 2);
    }
  }, [adjustedCurrentPage, onPageChange, isCropperOpen, isZoomed]);

  const handleNextPage = useCallback(() => {
    if (
      adjustedCurrentPage + 1 < pages.length &&
      onPageChange &&
      !isCropperOpen &&
      !isZoomed
    ) {
      // When in right-to-left mode, "next" moves forward in page numbers
      onPageChange(adjustedCurrentPage + 2);
    }
  }, [
    adjustedCurrentPage,
    onPageChange,
    pages.length,
    isCropperOpen,
    isZoomed,
  ]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCropperOpen || isZoomed) return;

      if (settings.rightToLeft) {
        // Right-to-left controls
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          handleNextPage();
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          handlePrevPage();
        }
      } else {
        // Standard left-to-right controls
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          handlePrevPage();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          handleNextPage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleNextPage,
    handlePrevPage,
    isCropperOpen,
    isZoomed,
    settings.rightToLeft,
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
        preloadedPagesRef.current[pageNum] = pages[pageNum - 1];
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
    if (currentPage % 2 === 0 && currentPage > 1 && onPageChange && isReady) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange, isReady]);

  // Reset zoom when page changes
  useEffect(() => {
    const resetZoom = async () => {
      // @ts-expect-error - transformRef.current might be typed incorrectly
      if (transformRef.current && transformRef.current.resetTransform) {
        // @ts-expect-error - Method is available but not properly typed in the library
        transformRef.current.resetTransform();
      }
    };

    resetZoom();
  }, [adjustedCurrentPage, leftPage, rightPage]);

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
      container.addEventListener("wheel", preventWheelScroll, {
        passive: false,
      });
      container.addEventListener("touchmove", preventTouchMove, {
        passive: false,
      });
      document.addEventListener("wheel", preventWheelScroll, {
        passive: false,
        capture: true,
      });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", preventWheelScroll);
        container.removeEventListener("touchmove", preventTouchMove);
        document.removeEventListener("wheel", preventWheelScroll, {
          capture: true,
        });
      }
    };
  }, [isZoomed]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full flex justify-center items-center bg-gray-900 no-scrollbar"
      style={{ touchAction: isZoomed ? "none" : "auto" }}
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
            setIsZoomed(ref.state.scale > 1.01);
            setScale(ref.state.scale);
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
                cursor: isZoomed ? "grab" : "default",
                willChange: "transform",
                transition: "transform 0.1s ease",
              }}
            >
              <div className="flex max-h-full h-full">
                {settings.rightToLeft ? (
                  // Right to left (Japanese style) - right page first, then left
                  <>
                    {rightPage && (
                      <div className="relative h-full">
                        <PageView
                          key={`right-page-${rightPageIndex + 1}-${
                            forceRerenderRef.current
                          }`}
                          page={rightPage}
                          settings={settings}
                          pageNumber={rightPageIndex + 1}
                          manga={manga}
                          volumeId={volumeId}
                          onCropperStateChange={setIsCropperOpen}
                        />
                      </div>
                    )}
                    {leftPage && (
                      <div className="relative h-full">
                        <PageView
                          key={`left-page-${leftPageIndex + 1}-${
                            forceRerenderRef.current
                          }`}
                          page={leftPage}
                          settings={settings}
                          pageNumber={leftPageIndex + 1}
                          manga={manga}
                          volumeId={volumeId}
                          onCropperStateChange={setIsCropperOpen}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  // Left to right (Western style) - left page first, then right
                  <>
                    {leftPage && (
                      <div className="relative h-full">
                        <PageView
                          key={`left-page-${leftPageIndex + 1}-${
                            forceRerenderRef.current
                          }`}
                          page={leftPage}
                          settings={settings}
                          pageNumber={leftPageIndex + 1}
                          manga={manga}
                          volumeId={volumeId}
                          onCropperStateChange={setIsCropperOpen}
                        />
                      </div>
                    )}
                    {rightPage && (
                      <div className="relative h-full">
                        <PageView
                          key={`right-page-${rightPageIndex + 1}-${
                            forceRerenderRef.current
                          }`}
                          page={rightPage}
                          settings={settings}
                          pageNumber={rightPageIndex + 1}
                          manga={manga}
                          volumeId={volumeId}
                          onCropperStateChange={setIsCropperOpen}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </TransformComponent>

            {/* Zoom controls */}
            <div
              className={`fixed bottom-10 right-4 flex gap-2 transition-opacity duration-300 z-50 ${
                showControls ? "opacity-100" : "opacity-0"
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
                onClick={() => resetTransform()}
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
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Left side button */}
        <div className="flex-1 flex justify-start">
          {settings.rightToLeft
            ? adjustedCurrentPage + 1 < pages.length && (
                <button
                  onClick={handleNextPage}
                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto ml-4 transition-transform hover:scale-110 sm:ml-16 md:ml-24"
                  disabled={isCropperOpen || isZoomed}
                  style={{ opacity: isZoomed ? 0.3 : 1 }}
                  aria-label="Next page"
                >
                  <ArrowLeft size={20} />
                </button>
              )
            : adjustedCurrentPage > 1 && (
                <button
                  onClick={handlePrevPage}
                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto ml-4 transition-transform hover:scale-110 sm:ml-16 md:ml-24"
                  disabled={isCropperOpen || isZoomed}
                  style={{ opacity: isZoomed ? 0.3 : 1 }}
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
                  disabled={isCropperOpen || isZoomed}
                  style={{ opacity: isZoomed ? 0.3 : 1 }}
                  aria-label="Previous page"
                >
                  <ArrowRight size={20} />
                </button>
              )
            : adjustedCurrentPage + 1 < pages.length && (
                <button
                  onClick={handleNextPage}
                  className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto mr-4 transition-transform hover:scale-110 sm:mr-16 md:mr-24"
                  disabled={isCropperOpen || isZoomed}
                  style={{ opacity: isZoomed ? 0.3 : 1 }}
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
