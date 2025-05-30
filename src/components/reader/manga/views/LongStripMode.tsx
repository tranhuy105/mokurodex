"use client";

import { Settings } from "@/hooks/useSettings";
import { Page } from "@prisma/client";
import { debounce } from "lodash";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import PageView from "../PageView";

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
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<{
        [key: number]: HTMLDivElement;
    }>({});
    const lastReportedPage = useRef(initialPage);
    const isInitialized = useRef(false);
    const isScrollingProgrammatically = useRef(false);

    // Track visible pages to optimize rendering
    const [visibleRange, setVisibleRange] = useState<
        [number, number]
    >([Math.max(1, initialPage - 3), initialPage + 5]);

    // Get which page is currently most visible
    const getCurrentPage = useCallback(() => {
        if (!containerRef.current) return 1;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const centerY = scrollTop + containerHeight / 2;

        let closestPage = 1;
        let minDistance = Infinity;

        Object.entries(pageRefs.current).forEach(
            ([pageNum, element]) => {
                const rect =
                    element.getBoundingClientRect();
                const containerRect =
                    container.getBoundingClientRect();
                const elementTop =
                    rect.top -
                    containerRect.top +
                    scrollTop;
                const elementCenter =
                    elementTop + rect.height / 2;
                const distance = Math.abs(
                    centerY - elementCenter
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPage = parseInt(pageNum);
                }
            }
        );

        return closestPage;
    }, []);

    // Update URL without causing scroll
    const updatePageUrl = useCallback(
        (page: number) => {
            if (
                page !== lastReportedPage.current &&
                onPageChange
            ) {
                lastReportedPage.current = page;
                onPageChange(page);
            }
        },
        [onPageChange]
    );

    // Update visible range based on current scroll position
    const updateVisibleRange = useCallback(() => {
        if (!containerRef.current) return;

        // Calculate which pages should be rendered based on scroll position
        const currentPage = getCurrentPage();
        const newVisibleRange: [number, number] = [
            Math.max(1, currentPage - 3),
            Math.min(pages.length, currentPage + 5),
        ];

        setVisibleRange(newVisibleRange);
    }, [getCurrentPage, pages.length]);

    // Handle scroll events - but ignore programmatic scrolls with increased debounce
    const handleScroll = debounce(() => {
        // Don't process scroll events during programmatic scrolling
        if (isScrollingProgrammatically.current) return;

        const newPage = getCurrentPage();
        updatePageUrl(newPage);
        updateVisibleRange();
    }, 100);

    // Scroll to specific page
    const scrollToPage = useCallback(
        (pageNumber: number) => {
            const pageElement =
                pageRefs.current[pageNumber];
            if (!pageElement || !containerRef.current)
                return;

            isScrollingProgrammatically.current = true;

            pageElement.scrollIntoView({
                behavior: "auto",
                block: "start",
            });

            // Update visible range immediately for the new position
            const newVisibleRange: [number, number] = [
                Math.max(1, pageNumber - 3),
                Math.min(pages.length, pageNumber + 5),
            ];
            setVisibleRange(newVisibleRange);

            // Clear the flag after a short delay
            setTimeout(() => {
                isScrollingProgrammatically.current = false;
            }, 150);
        },
        [pages.length]
    );

    // Handle external page changes (navigation)
    useEffect(() => {
        // Skip during initialization
        if (!isInitialized.current) return;

        // Skip if this page change came from our own scroll detection
        if (currentPage === lastReportedPage.current)
            return;

        // Only scroll for significant page jumps (real navigation)
        const pageDiff = Math.abs(
            currentPage - lastReportedPage.current
        );
        if (pageDiff > 1 && pageRefs.current[currentPage]) {
            scrollToPage(currentPage);
            lastReportedPage.current = currentPage;
        }
    }, [currentPage, scrollToPage]);

    // One-time initialization - scroll to initial page
    useEffect(() => {
        if (isInitialized.current) return;

        const initializeScroll = () => {
            if (pageRefs.current[initialPage]) {
                scrollToPage(initialPage);
                lastReportedPage.current = initialPage;
                isInitialized.current = true;
            } else {
                // If page refs aren't ready, try again next frame
                requestAnimationFrame(initializeScroll);
            }
        };

        // Wait for next frame to ensure all page refs are set
        requestAnimationFrame(initializeScroll);
    }, [initialPage, scrollToPage]);

    // Cleanup function for memory management
    useEffect(() => {
        return () => {
            // Cleanup when component unmounts
            handleScroll.cancel();
        };
    }, [handleScroll]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto overflow-x-hidden bg-gray-900 scrollbar-hide"
            onScroll={handleScroll}
        >
            <div className="w-full flex flex-col items-center space-y-4 py-4">
                {pages.map((page, index) => {
                    const pageNumber = index + 1;
                    const isInVisibleRange =
                        pageNumber >= visibleRange[0] &&
                        pageNumber <= visibleRange[1];

                    // Determine if this page should be loaded with priority
                    const isPriority =
                        pageNumber === currentPage ||
                        Math.abs(
                            pageNumber - currentPage
                        ) <= 1;

                    return (
                        <div
                            key={page.id}
                            ref={(el) => {
                                if (el) {
                                    pageRefs.current[
                                        pageNumber
                                    ] = el;
                                } else {
                                    delete pageRefs.current[
                                        pageNumber
                                    ];
                                }
                            }}
                            className="w-full flex justify-center"
                        >
                            {isInVisibleRange && (
                                <PageView
                                    page={page}
                                    settings={settings}
                                    pageNumber={pageNumber}
                                    priority={isPriority}
                                    mode="longStrip"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LongStripMode;
