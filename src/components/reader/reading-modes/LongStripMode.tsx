"use client";

import { Settings } from "@/hooks/useSettings";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import PageView from "../PageView";
import { Page } from "@prisma/client";

interface ReadingModeProps {
  pages: Page[];
  currentPage: number;
  settings: Settings;
  initialPage: number;
  onPageChange?: (page: number) => void;
  showControls?: boolean;
}

const LongStripMode = ({
  pages,
  currentPage,
  settings,
  initialPage,
  onPageChange,
}: ReadingModeProps) => {
  // Stable refs for DOM elements and tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const pageElementsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  // Single source of truth for current page - avoid multiple state tracking
  const [activePageNumber, setActivePageNumber] = useState<number>(initialPage);
  const activePageRef = useRef<number>(initialPage);

  // Rendering window for virtualization
  const [visibleRange, setVisibleRange] = useState<[number, number]>([
    Math.max(0, initialPage - 3),
    Math.min(pages.length, initialPage + 6),
  ]);

  // Flags to manage scroll behavior and prevent bugs
  const isInitialized = useRef<boolean>(false);
  const isManuallyScrolling = useRef<boolean>(false);
  const isUpdatingPage = useRef<boolean>(false);
  const lastScrollTop = useRef<number>(0);

  // Timing control for stability
  const lastPageChangeTimestamp = useRef<number>(Date.now());
  const CHANGE_COOLDOWN = 600; // ms between allowed page changes

  // Handle ref cleanup properly on unmount
  useEffect(() => {
    return () => {
      // Clear all refs to prevent memory leaks
      pageElementsRef.current.clear();

      // Clear any pending timeouts
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      if (urlUpdateTimeoutRef.current) {
        window.clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Centralized page change function for consistent state updates
  const changePage = useCallback(
    (newPage: number, updateUrl = true) => {
      if (isUpdatingPage.current) return;

      try {
        isUpdatingPage.current = true;

        // Update refs first for immediate access in callbacks
        activePageRef.current = newPage;
        lastPageChangeTimestamp.current = Date.now();

        // Then update state which will cause re-render
        setActivePageNumber(newPage);

        // Only update URL if requested and if different from current URL page
        if (updateUrl && onPageChange && newPage !== currentPage) {
          onPageChange(newPage);
        }
      } finally {
        // Always reset the flag
        isUpdatingPage.current = false;
      }
    },
    [currentPage, onPageChange]
  );

  // Timeouts for throttle/debounce
  const scrollTimeoutRef = useRef<number | null>(null);
  const urlUpdateTimeoutRef = useRef<number | null>(null);

  // Scroll handler with improved stability and error handling
  const handleScroll = useCallback(() => {
    // Skip if not initialized or manually scrolling
    if (!containerRef.current || isManuallyScrolling.current) return;

    // Throttle scroll events
    if (scrollTimeoutRef.current !== null) return;

    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollTimeoutRef.current = null;

      try {
        const container = containerRef.current;
        if (!container) return;

        // Get current scroll position and direction
        const scrollTop = container.scrollTop;
        const scrollDirection =
          scrollTop > lastScrollTop.current ? "down" : "up";
        lastScrollTop.current = scrollTop;

        // Return early if we recently changed pages (cooling down)
        const now = Date.now();
        if (now - lastPageChangeTimestamp.current < CHANGE_COOLDOWN) return;

        // Find all visible pages and their visibility percentages
        const visiblePages = new Map<number, number>();
        let mostVisiblePage = activePageRef.current;
        let highestVisibility = 0;

        pageElementsRef.current.forEach((element, pageNumber) => {
          // Calculate element visibility in viewport
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          const visibleTop = Math.max(rect.top, containerRect.top);
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom);

          if (visibleBottom > visibleTop) {
            const visibleHeight = visibleBottom - visibleTop;
            const percentVisible = visibleHeight / rect.height;

            // Store visibility data
            visiblePages.set(pageNumber, percentVisible);

            // Track most visible page
            if (percentVisible > highestVisibility) {
              highestVisibility = percentVisible;
              mostVisiblePage = pageNumber;
            }
          }
        });

        // Get current active page visibility
        const currentPageVisibility =
          visiblePages.get(activePageRef.current) || 0;

        // Determine if page change is needed based on stable criteria
        let shouldChangePage = false;

        // Case 1: Current page not visible at all
        if (currentPageVisibility === 0 && highestVisibility > 0.3) {
          shouldChangePage = true;
        }
        // Case 2: New page is significantly more visible
        else if (highestVisibility > currentPageVisibility + 0.25) {
          shouldChangePage = true;
        }
        // Case 3: Direction-based changes with strong visibility
        else if (
          (scrollDirection === "down" &&
            mostVisiblePage > activePageRef.current &&
            highestVisibility > 0.4) ||
          (scrollDirection === "up" &&
            mostVisiblePage < activePageRef.current &&
            highestVisibility > 0.4)
        ) {
          shouldChangePage = true;
        }

        // Apply page change if needed
        if (shouldChangePage && mostVisiblePage !== activePageRef.current) {
          changePage(mostVisiblePage, true);

          // Update virtualization window - conservative range
          const newStartIdx = Math.max(0, mostVisiblePage - 3);
          const newEndIdx = Math.min(pages.length, mostVisiblePage + 6);

          // Only update if range changes significantly
          if (
            Math.abs(newStartIdx - visibleRange[0]) > 1 ||
            Math.abs(newEndIdx - visibleRange[1]) > 1
          ) {
            setVisibleRange([newStartIdx, newEndIdx]);
          }
        }
      } catch (error) {
        // Handle errors gracefully
        console.error("Error in scroll handler:", error);
      }
    }, 120); // Conservative throttle
  }, [changePage, pages.length, visibleRange]);

  // Attach scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Scroll to a specific page safely
  const scrollToPage = useCallback(
    (pageNumber: number, behavior: ScrollBehavior = "auto") => {
      const container = containerRef.current;
      const targetElement = pageElementsRef.current.get(pageNumber);

      if (!container) {
        console.warn("Container ref not available for scrolling");
        return false;
      }

      if (!targetElement) {
        console.warn(`Target element for page ${pageNumber} not found in refs`);
        // Update page state anyway to keep UI consistent
        changePage(pageNumber, true);
        return false;
      }

      try {
        // Set flags to prevent page change during scroll
        isManuallyScrolling.current = true;

        // Update page state immediately to prevent flicker
        changePage(pageNumber, false);

        // Calculate scroll position with offset for better viewing
        const targetPosition = targetElement.offsetTop - 60;

        // Perform the scroll
        container.scrollTo({
          top: targetPosition,
          behavior,
        });

        console.log(
          `Scrolled to page ${pageNumber} at position ${targetPosition}`
        );
        return true;
      } catch (error) {
        console.error("Error scrolling to page:", error);
        return false;
      } finally {
        // Reset flags after scroll animation completes with appropriate timing
        const delay = behavior === "smooth" ? 800 : 200;
        setTimeout(() => {
          isManuallyScrolling.current = false;
          isInitialized.current = true;

          // Update URL after manual scroll completes
          if (onPageChange && pageNumber !== currentPage) {
            onPageChange(pageNumber);
          }
        }, delay);
      }
    },
    [changePage, currentPage, onPageChange]
  );

  // Handle initial page positioning
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized.current) return;

    let attemptCount = 0;
    const maxAttempts = 6;

    const attemptScroll = () => {
      if (attemptCount >= maxAttempts || isInitialized.current) return;

      attemptCount++;

      // Check if target page element exists
      if (pageElementsRef.current.has(initialPage)) {
        scrollToPage(initialPage);
      } else {
        // Retry with exponential backoff
        const delay = Math.min(150 * Math.pow(1.5, attemptCount), 2000);
        setTimeout(attemptScroll, delay);
      }
    };

    // Initial delay to allow first render
    setTimeout(attemptScroll, 100);

    // Cleanup
    return () => {
      // Mark as initialized to prevent further attempts
      isInitialized.current = true;
    };
  }, [initialPage, scrollToPage]);

  // Handle prop updates to currentPage
  useEffect(() => {
    // Only respond to external page changes when different from our internal active page
    if (currentPage === activePageNumber) return;

    // Always attempt to scroll when explicitly requested via props,
    // even if initialization is not complete
    if (Math.abs(currentPage - activePageNumber) > 0) {
      // First update our internal page tracking to prevent feedback loops
      setActivePageNumber(currentPage);
      activePageRef.current = currentPage;

      // Use a small delay to ensure the DOM has updated with any newly rendered pages
      setTimeout(() => {
        // Try to scroll to the requested page
        if (pageElementsRef.current.has(currentPage)) {
          scrollToPage(currentPage, "auto");
          isInitialized.current = true;
        } else {
          // If page element doesn't exist yet (might be outside render window),
          // expand the visible range and try again
          const newStartIdx = Math.max(0, currentPage - 5);
          const newEndIdx = Math.min(pages.length, currentPage + 5);
          setVisibleRange([newStartIdx, newEndIdx]);

          // Try again after the range update
          setTimeout(() => {
            if (pageElementsRef.current.has(currentPage)) {
              scrollToPage(currentPage, "auto");
            }
            isInitialized.current = true;
          }, 50);
        }
      }, 50);
    }
  }, [currentPage, activePageNumber, scrollToPage, pages.length]);

  // Render pages with efficient virtualization
  const renderedPages = useMemo(() => {
    const [startIdx, endIdx] = visibleRange;

    return pages.slice(startIdx, endIdx).map((page, relativeIdx) => {
      const pageIdx = startIdx + relativeIdx;
      const pageNumber = pageIdx + 1; // 1-indexed page number

      return (
        <div
          key={`page-${pageNumber}`}
          ref={(el) => {
            if (el) {
              pageElementsRef.current.set(pageNumber, el);
            } else if (pageElementsRef.current.has(pageNumber)) {
              // Clean up removed elements
              pageElementsRef.current.delete(pageNumber);
            }
          }}
          className="relative flex justify-center w-full"
          data-page-number={pageNumber}
          data-page-element="true"
        >
          <PageView
            page={page}
            settings={settings}
            pageNumber={pageNumber}
            priority={Math.abs(pageNumber - activePageNumber) < 3}
            mode="longStrip"
          />
        </div>
      );
    });
  }, [visibleRange, pages, settings, activePageNumber]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden bg-gray-900 scrollbar-hide"
    >
      <div className="min-h-full w-full flex flex-col items-center justify-start">
        {renderedPages}
      </div>
    </div>
  );
};

export default LongStripMode;
