"use client";

import { Settings } from "@/hooks/useSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import PageView from "./PageView";
import {
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface MangaPage {
  image: string;
  blocks: {
    box: [number, number, number, number];
    lines: string[];
    font_size: number;
    vertical: boolean;
    lines_coords?: number[][][];
  }[];
  img_width: number;
  img_height: number;
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

// Add this interface near the top of the file
interface RightToLeftChangedEvent extends CustomEvent {
  detail: {
    rightToLeft: boolean;
  };
}

// Single Page Mode
export function SinglePageMode({
  pages,
  currentPage,
  settings,
  onPageChange,
  manga,
  volumeId,
  showControls = false,
}: ReadingModeProps) {
  const page = pages[currentPage - 1];
  const [preloadedPages, setPreloadedPages] = useState<{
    [key: number]: MangaPage;
  }>({});
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const transformRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceRerender] = useState({});

  // Add event listener for right-to-left changes
  useEffect(() => {
    const handleRightToLeftChange = (e: Event) => {
      // Log that we received the event
      const rtlEvent = e as RightToLeftChangedEvent;
      console.log(
        "Right-to-left changed event received in SinglePageMode, new value:",
        rtlEvent.detail?.rightToLeft
      );
      // Force a rerender without using keys
      forceRerender({});
    };

    window.addEventListener("rightToLeftChanged", handleRightToLeftChange);
    return () =>
      window.removeEventListener("rightToLeftChanged", handleRightToLeftChange);
  }, []);

  // Log whenever settings changes, especially rightToLeft
  useEffect(() => {
    console.log("Settings in SinglePageMode:", settings);
    console.log("Right-to-left value:", settings.rightToLeft);
  }, [settings, settings.rightToLeft]);

  // Navigation functions
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

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCropperOpen || isZoomed) return;

      if (settings.rightToLeft) {
        // Swap arrow keys in right-to-left mode
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          handlePrevPage();
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          handleNextPage();
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

  // Preload adjacent pages
  useEffect(() => {
    const pagesToPreload = [currentPage - 1, currentPage, currentPage + 1];
    const newPreloadedPages = { ...preloadedPages };

    pagesToPreload.forEach((pageNum) => {
      if (pageNum > 0 && pageNum <= pages.length && !preloadedPages[pageNum]) {
        newPreloadedPages[pageNum] = pages[pageNum - 1];
      }
    });

    setPreloadedPages(newPreloadedPages);
  }, [currentPage, pages]);

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

  if (!page) return null;

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
          setIsZoomed(ref.state.scale > 1.01);
          setScale(ref.state.scale);
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
              <div className="max-w-full max-h-full transition-opacity duration-300 h-full">
                <PageView
                  page={page}
                  settings={settings}
                  pageNumber={currentPage}
                  manga={manga}
                  volumeId={volumeId}
                  onCropperStateChange={setIsCropperOpen}
                  showPageNumber={false}
                />
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

      {/* Navigation buttons */}
      {onPageChange && (
        <div
          className={`fixed inset-x-0 top-1/2 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-50 -translate-y-1/2 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* In RTL mode, next button goes on left side */}
          <div className="flex-1 flex justify-start">
            {settings.rightToLeft
              ? currentPage < pages.length && (
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
              : currentPage > 1 && (
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

          {/* In RTL mode, prev button goes on right side */}
          <div className="flex-1 flex justify-end">
            {settings.rightToLeft
              ? currentPage > 1 && (
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
              : currentPage < pages.length && (
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
      )}

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="fixed bottom-4 left-4 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded z-50">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}

// Double Page Mode
export function DoublePageMode({
  pages,
  currentPage,
  settings,
  onPageChange,
  manga,
  volumeId,
  showControls = false,
}: ReadingModeProps) {
  // Ensure we're on an odd page for proper double page display
  const adjustedCurrentPage =
    currentPage % 2 === 0 && currentPage > 1 ? currentPage - 1 : currentPage;

  const leftPageIndex = adjustedCurrentPage - 1;
  const rightPageIndex = adjustedCurrentPage;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];
  const [isReady, setIsReady] = useState(false);
  const [preloadedPages, setPreloadedPages] = useState<{
    [key: number]: MangaPage;
  }>({});
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const transformRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceRerender] = useState({});

  // Add event listener for right-to-left changes
  useEffect(() => {
    const handleRightToLeftChange = (e: Event) => {
      // Log that we received the event
      const rtlEvent = e as RightToLeftChangedEvent;
      console.log(
        "Right-to-left changed event received in DoublePageMode, new value:",
        rtlEvent.detail?.rightToLeft
      );
      // Force a rerender without using keys
      forceRerender({});
    };

    window.addEventListener("rightToLeftChanged", handleRightToLeftChange);
    return () =>
      window.removeEventListener("rightToLeftChanged", handleRightToLeftChange);
  }, []);

  // Log whenever settings changes, especially rightToLeft
  useEffect(() => {
    console.log("Settings in DoublePageMode:", settings);
    console.log("Right-to-left value:", settings.rightToLeft);
  }, [settings, settings.rightToLeft]);

  // Custom navigation for double page mode
  const handlePrevPage = useCallback(() => {
    if (
      adjustedCurrentPage > 1 &&
      onPageChange &&
      !isCropperOpen &&
      !isZoomed
    ) {
      // When in right-to-left mode, "previous" moves backward in page numbers
      if (settings.rightToLeft) {
        onPageChange(adjustedCurrentPage - 2);
      } else {
        onPageChange(adjustedCurrentPage - 2);
      }
    }
  }, [
    adjustedCurrentPage,
    onPageChange,
    isCropperOpen,
    isZoomed,
    settings.rightToLeft,
  ]);

  const handleNextPage = useCallback(() => {
    if (
      adjustedCurrentPage + 1 < pages.length &&
      onPageChange &&
      !isCropperOpen &&
      !isZoomed
    ) {
      // When in right-to-left mode, "next" moves forward in page numbers
      if (settings.rightToLeft) {
        onPageChange(adjustedCurrentPage + 2);
      } else {
        onPageChange(adjustedCurrentPage + 2);
      }
    }
  }, [
    adjustedCurrentPage,
    onPageChange,
    pages.length,
    isCropperOpen,
    isZoomed,
    settings.rightToLeft,
  ]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCropperOpen || isZoomed) return;

      if (settings.rightToLeft) {
        // Right-to-left controls: no need to swap arrow keys, just maintain consistent navigation
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

  // Preload adjacent pages
  useEffect(() => {
    const pagesToPreload = [
      adjustedCurrentPage - 2,
      adjustedCurrentPage - 1,
      adjustedCurrentPage,
      adjustedCurrentPage + 1,
      adjustedCurrentPage + 2,
    ];

    const newPreloadedPages = { ...preloadedPages };

    pagesToPreload.forEach((pageNum) => {
      if (pageNum > 0 && pageNum <= pages.length && !preloadedPages[pageNum]) {
        newPreloadedPages[pageNum] = pages[pageNum - 1];
      }
    });

    setPreloadedPages(newPreloadedPages);
  }, [adjustedCurrentPage, pages]);

  // Ensure the component is properly initialized with the current page
  useEffect(() => {
    // Small delay to ensure the page is properly loaded
    const timer = setTimeout(() => {
      setIsReady(true);
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
          setIsZoomed(ref.state.scale > 1.01);
          setScale(ref.state.scale);
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
}

// Long Strip Mode (vertical)
export function LongStripMode({
  pages,
  currentPage,
  settings,
  initialPage,
  onPageChange,
  manga,
  volumeId,
}: ReadingModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([
    Math.max(0, currentPage - 5),
    currentPage + 10,
  ]);
  const hasScrolledToInitialPage = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolledPages, setScrolledPages] = useState<Set<number>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPage = useRef(currentPage);
  const isScrollingRef = useRef(false);
  const lastPageChangeRef = useRef<number>(0);
  const didInitialScrollRef = useRef(false);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [forceRtlUpdate, setForceRtlUpdate] = useState(0);

  // Force reset when component is mounted or remounted to ensure proper syncing with URL
  useEffect(() => {
    hasScrolledToInitialPage.current = false;
    didInitialScrollRef.current = false;

    // Set a timeout to reset these values after component is mounted
    const resetTimer = setTimeout(() => {
      hasScrolledToInitialPage.current = false;
      didInitialScrollRef.current = false;
    }, 50);

    return () => clearTimeout(resetTimer);
  }, []);

  // Detect if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle browser navigation events
  useEffect(() => {
    const handlePopState = () => {
      // Force rerender when navigating with browser buttons
      setForceRtlUpdate((prev) => prev + 1);
      setForceRenderKey((prev) => prev + 1);
      hasScrolledToInitialPage.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Initialize pageRefs array with the correct length
  useEffect(() => {
    pageRefs.current = Array(pages.length).fill(null);
  }, [pages.length]);

  // Clean up function for intersection observer
  const cleanupObserver = useCallback(() => {
    if (observerRef.current) {
      pageRefs.current.forEach((ref) => {
        if (ref) observerRef.current?.unobserve(ref);
      });
      observerRef.current = null;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // Setup intersection observer to detect which page is currently visible
  useEffect(() => {
    // Clean up any existing observer
    cleanupObserver();

    const options = {
      root: containerRef.current,
      rootMargin: "200px 0px",
      threshold: [0.5],
    };

    observerRef.current = new IntersectionObserver((entries) => {
      // Don't update if we're programmatically scrolling
      if (isScrollingRef.current) return;

      // Find the most visible entry
      let highestVisibility = 0;
      let highestVisiblePageIndex = -1;

      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio > highestVisibility
        ) {
          highestVisibility = entry.intersectionRatio;
          const pageIndexStr = entry.target.getAttribute("data-page-index");
          if (pageIndexStr) {
            highestVisiblePageIndex = parseInt(pageIndexStr, 10);
          }
        }
      });

      // Process only if we found a visible page with sufficient visibility
      if (
        highestVisiblePageIndex >= 0 &&
        highestVisibility >= 0.5 &&
        onPageChange
      ) {
        // Avoid too frequent updates (throttle)
        const now = Date.now();
        if (now - lastPageChangeRef.current < 100) return;
        lastPageChangeRef.current = now;

        // Debounce the page change to avoid rapid updates
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          // Only update if it's actually a different page
          if (highestVisiblePageIndex + 1 !== currentPage) {
            onPageChange(highestVisiblePageIndex + 1);
          }

          // Mark this page as having been seen
          setScrolledPages((prev) => {
            const newSet = new Set(prev);
            newSet.add(highestVisiblePageIndex);
            return newSet;
          });
        }, 100);
      }
    }, options);

    // Observe all page refs that exist
    pageRefs.current.forEach((ref) => {
      if (ref) {
        observerRef.current?.observe(ref);
      }
    });

    return cleanupObserver;
  }, [onPageChange, cleanupObserver, currentPage]);

  // Handle new refs being assigned after initial render
  const updateObserver = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      // Store the ref
      pageRefs.current[index] = el;

      // If the element exists and we have an observer, observe it
      if (el && observerRef.current) {
        observerRef.current.observe(el);
      }
    },
    []
  );

  // Update visible range on scroll with improved performance
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      // Use requestAnimationFrame for better scroll performance
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        // Calculate the viewport boundaries
        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + containerHeight;

        // Find which pages are visible based on their position and viewport
        let firstVisiblePage = 0;
        let lastVisiblePage = pages.length - 1;

        // Use a larger buffer (more pages) for better performance when scrolling quickly
        const buffer = Math.max(5, Math.floor(containerHeight / 400)); // About 5 pages or more

        // Calculate the estimated visible range
        for (let i = 0; i < pageRefs.current.length; i++) {
          const pageRef = pageRefs.current[i];
          if (pageRef) {
            const rect = pageRef.getBoundingClientRect();
            const pageTop = rect.top + window.scrollY - container.offsetTop;
            const pageBottom = pageTop + rect.height;

            if (pageBottom >= viewportTop && firstVisiblePage === 0) {
              firstVisiblePage = Math.max(0, i - buffer);
            }

            if (pageTop <= viewportBottom) {
              lastVisiblePage = Math.min(pages.length - 1, i + buffer);
            }
          }
        }

        setVisibleRange([firstVisiblePage, lastVisiblePage]);
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
      // Initial calculation
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [pages.length]);

  // Track if the currentPage changes from outside the component
  useEffect(() => {
    // Only reset hasScrolledToInitialPage if switching to a different page
    // from another mode (not from internal scrolling detection)
    if (
      currentPage !== previousPage.current &&
      !hasScrolledToInitialPage.current
    ) {
      hasScrolledToInitialPage.current = false;
    }
    previousPage.current = currentPage;
  }, [currentPage]);

  // Initial scroll to the specified page with improved behavior
  useEffect(() => {
    // Skip if we've already scrolled successfully
    if (hasScrolledToInitialPage.current && didInitialScrollRef.current) {
      return;
    }

    // Use initialPage (from URL) or currentPage for initial positioning
    const targetPage = initialPage || currentPage;

    // Check if we have a valid reference to the target page
    if (!pageRefs.current[targetPage - 1]) {
      // If not, try again in a short while
      const retryTimer = setTimeout(() => {
        hasScrolledToInitialPage.current = false;
        didInitialScrollRef.current = false;
      }, 100);

      return () => clearTimeout(retryTimer);
    }

    // Wait a bit for layout to stabilize before scrolling
    const timer = setTimeout(() => {
      if (!pageRefs.current[targetPage - 1]) return;

      // Set flag to prevent intersection observer from triggering while we scroll
      isScrollingRef.current = true;

      // Scroll to the target page
      pageRefs.current[targetPage - 1]?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });

      // Mark the initial page and surrounding pages as already seen
      const initialPageSet = new Set<number>();
      for (
        let i = Math.max(0, targetPage - 3);
        i <= Math.min(pages.length - 1, targetPage + 3);
        i++
      ) {
        initialPageSet.add(i - 1); // Adjust for 0-indexed
      }
      setScrolledPages(initialPageSet);

      // Reset scrolling flag after a delay
      setTimeout(() => {
        isScrollingRef.current = false;
        hasScrolledToInitialPage.current = true;
        didInitialScrollRef.current = true;

        // Make sure the URL is updated to reflect the current page
        if (onPageChange && targetPage !== currentPage) {
          onPageChange(targetPage);
        }
      }, 300);
    }, 150);

    return () => clearTimeout(timer);
  }, [currentPage, initialPage, pages.length, onPageChange]);

  // Add event listener for right-to-left changes
  useEffect(() => {
    const handleRightToLeftChange = (e: Event) => {
      // Log that we received the event
      const rtlEvent = e as RightToLeftChangedEvent;
      console.log(
        "Right-to-left changed event received in LongStripMode, new value:",
        rtlEvent.detail?.rightToLeft
      );
      // Force a rerender by incrementing the counter instead of using timestamps
      setForceRtlUpdate((prev) => prev + 1);
      setForceRenderKey((prev) => prev + 1);
    };

    window.addEventListener("rightToLeftChanged", handleRightToLeftChange);
    return () =>
      window.removeEventListener("rightToLeftChanged", handleRightToLeftChange);
  }, []);

  // Log whenever settings changes, especially rightToLeft
  useEffect(() => {
    console.log("Settings in LongStripMode:", settings);
    console.log("Right-to-left value:", settings.rightToLeft);
  }, [settings, settings.rightToLeft, forceRtlUpdate]);

  // Create array of all page indexes
  const allPageIndexes = Array.from({ length: pages.length }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 no-scrollbar bg-gray-900"
      style={{ scrollBehavior: "smooth" }}
      key={`longstrip-${forceRenderKey}-${forceRtlUpdate}`}
    >
      <div className={`mx-auto w-full ${isMobile ? "px-0" : "max-w-5xl"}`}>
        {allPageIndexes.map((index) => {
          const [startPage, endPage] = visibleRange;
          const isVisible = index >= startPage && index <= endPage;

          // Expand the range for the initially loaded pages to ensure they're visible
          const isNearInitialPage = Math.abs(index - (currentPage - 1)) <= 2; // Pages very close to current page

          const isNearby =
            isNearInitialPage ||
            (index >= Math.max(0, currentPage - 3) &&
              index <= Math.min(pages.length - 1, currentPage + 3));

          const hasBeenSeen = scrolledPages.has(index);
          const shouldRenderFullPage =
            isVisible || isNearby || isNearInitialPage;

          return (
            <div
              key={`page-${index}-${forceRenderKey}`}
              ref={(el) => updateObserver(index, el)}
              data-page-index={index}
              className="relative mb-1 flex justify-center w-full"
            >
              {shouldRenderFullPage ? (
                <div className="w-full">
                  <PageView
                    page={pages[index]}
                    settings={settings}
                    pageNumber={index + 1}
                    showPageNumber={true}
                    manga={manga}
                    volumeId={volumeId}
                  />
                </div>
              ) : (
                // Lightweight placeholder when not in view
                <div
                  className="flex items-center justify-center w-full"
                  style={{
                    height: hasBeenSeen
                      ? `${pages[index].img_height * 0.25}px`
                      : "300px",
                    minHeight: "150px",
                    backgroundColor: settings.darkMode ? "#111" : "#eee",
                  }}
                >
                  <span className="text-gray-500">Page {index + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
