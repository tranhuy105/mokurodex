"use client";

import { Settings } from "@/hooks/useSettings";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import PageView from "../PageView";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Page } from "@prisma/client";

// Interface for the right-to-left changed event
interface RightToLeftChangedEvent extends CustomEvent {
  detail: {
    rightToLeft: boolean;
  };
}

interface ReadingModeProps {
  pages: Page[];
  currentPage: number;
  settings: Settings;
  initialPage: number;
  onPageChange?: (page: number) => void;
  manga: string;
  volumeId: string;
  showControls?: boolean;
}

// Single Page Mode Component
const SinglePageMode = ({
  pages,
  currentPage,
  settings,
  onPageChange,
  showControls = false,
}: ReadingModeProps) => {
  // Use direct ref access to avoid unnecessary re-renders
  const preloadedPagesRef = useRef<{ [key: number]: Page }>({});
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const transformRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Track animation state
  const [animationClass, setAnimationClass] = useState("");
  const lastPageRef = useRef(currentPage);

  // Memoize the current page to prevent unnecessary re-renders
  const page = useMemo(() => pages[currentPage - 1], [pages, currentPage]);

  // Set animation class when page changes
  useEffect(() => {
    if (!settings.animatePageTurns) return;

    if (lastPageRef.current !== currentPage) {
      const direction = lastPageRef.current < currentPage ? "next" : "prev";

      // Fix animation direction logic for right-to-left reading mode
      if (settings.rightToLeft) {
        // In RTL mode, "next" means going to a lower page number (right to left)
        if (direction === "next") {
          // Moving forward in manga (right to left) - page flips left
          setAnimationClass("animate-page-flip-left");
        } else {
          // Moving backward in manga (left to right) - page flips right
          setAnimationClass("animate-page-flip-right");
        }
      } else {
        // Standard LTR mode
        if (direction === "next") {
          // Moving forward in manga (left to right) - page flips right
          setAnimationClass("animate-page-flip-right");
        } else {
          // Moving backward in manga (right to left) - page flips left
          setAnimationClass("animate-page-flip-left");
        }
      }

      // Clear animation after it completes
      const timer = setTimeout(() => {
        setAnimationClass("");
      }, 600); // Match animation duration

      lastPageRef.current = currentPage;
      return () => clearTimeout(timer);
    }
  }, [currentPage, settings.animatePageTurns, settings.rightToLeft]);

  // Preload adjacent pages - extracted to a reusable function
  const preloadAdjacentPages = useCallback(() => {
    const pagesToPreload = [currentPage - 1, currentPage, currentPage + 1];
    console.log("Preloading pages:", pagesToPreload);

    pagesToPreload.forEach((pageNum) => {
      if (
        pageNum > 0 &&
        pageNum <= pages.length &&
        !preloadedPagesRef.current[pageNum]
      ) {
        preloadedPagesRef.current[pageNum] = pages[pageNum - 1];
      }
    });
  }, [currentPage, pages]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Preload current and adjacent pages immediately on mount
    preloadAdjacentPages();

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

    window.addEventListener("rightToLeftChanged", handleRightToLeftChange);
    return () =>
      window.removeEventListener("rightToLeftChanged", handleRightToLeftChange);
  }, []);

  // Minimal force update approach
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);

  // Navigation functions - optimized with proper dependencies
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && onPageChange && !isCropperOpen && !isZoomed) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange, isCropperOpen, isZoomed]);

  const handleNextPage = useCallback(() => {
    if (
      currentPage < pages.length &&
      onPageChange &&
      !isCropperOpen &&
      !isZoomed
    ) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, onPageChange, pages.length, isCropperOpen, isZoomed]);

  // Handle cropper state change
  const handleCropperStateChange = useCallback((isOpen: boolean) => {
    setIsCropperOpen(isOpen);
  }, []);

  // Add keyboard navigation - optimized to use passive event listeners where possible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCropperOpen || isZoomed) return;

      if (settings.rightToLeft) {
        // Swap arrow keys in right-to-left mode
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
  }, [currentPage, page]);

  // Prevent wheel scrolling on the container when zoomed - optimized event handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventWheelScroll = (e: WheelEvent) => {
      // Allow zooming with Ctrl+wheel
      if (e.ctrlKey) return true;

      if (isZoomed) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    // Use passive: false only for the wheel event
    container.addEventListener("wheel", preventWheelScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", preventWheelScroll);
    };
  }, [isZoomed]);

  // Early return if page is not available
  if (!page) return null;

  // Optimize zoom control handlers
  const handleZoomIn = () => {
    // @ts-expect-error - transformRef.current might be typed incorrectly
    if (transformRef.current && transformRef.current.zoomIn) {
      // @ts-expect-error - Method is available but not properly typed in the library
      transformRef.current.zoomIn(0.1);
    }
  };

  const handleZoomOut = () => {
    // @ts-expect-error - transformRef.current might be typed incorrectly
    if (transformRef.current && transformRef.current.zoomOut) {
      // @ts-expect-error - Method is available but not properly typed in the library
      transformRef.current.zoomOut(0.1);
    }
  };

  const handleResetTransform = () => {
    // @ts-expect-error - transformRef.current might be typed incorrectly
    if (transformRef.current && transformRef.current.resetTransform) {
      // @ts-expect-error - Method is available but not properly typed in the library
      transformRef.current.resetTransform();
    }
  };
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
          }
        }}
        ref={transformRef}
      >
        {() => (
          <>
            <TransformComponent
              wrapperClass="h-full w-full flex justify-center items-center"
              contentClass="flex justify-center items-center h-full w-full"
            >
              {page && (
                <div className={animationClass}>
                  <PageView
                    key={`${currentPage}-${page.imagePath}-${settings.rightToLeft}`}
                    page={page}
                    settings={settings}
                    pageNumber={currentPage}
                    priority={true}
                    onCropperStateChange={handleCropperStateChange}
                    mode="single"
                  />
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
                  onClick={handleResetTransform}
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
      {showControls && !isZoomed && (
        <>
          {/* Previous Page Button - direction depends on reading mode */}
          <button
            onClick={settings.rightToLeft ? handlePrevPage : handlePrevPage}
            disabled={
              settings.rightToLeft ? currentPage <= 1 : currentPage <= 1
            }
            className={`absolute ${
              settings.rightToLeft ? "right-1 md:right-4" : "left-1 md:left-4"
            } top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 ${
              (settings.rightToLeft ? currentPage > 1 : currentPage > 1)
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
            onClick={settings.rightToLeft ? handleNextPage : handleNextPage}
            disabled={
              settings.rightToLeft
                ? currentPage >= pages.length
                : currentPage >= pages.length
            }
            className={`absolute ${
              settings.rightToLeft ? "left-1 md:left-4" : "right-1 md:right-4"
            } top-1/2 transform -translate-y-1/2 flex items-center justify-center w-12 h-12 ${
              (
                settings.rightToLeft
                  ? currentPage < pages.length
                  : currentPage < pages.length
              )
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
    </div>
  );
};

export default SinglePageMode;
