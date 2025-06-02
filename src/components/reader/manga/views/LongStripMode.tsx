"use client";

import { Settings } from "@/hooks/useSettings";
import { PageWithTextBlocks } from "@/types/content";
import { debounce } from "lodash";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import PageView from "../PageView";

interface ReadingModeProps {
    pages: PageWithTextBlocks[];
    currentPage: number;
    settings: Settings;
    initialPage: number;
    onPageChange?: (page: number) => void;
    manga?: string;
    volumeId?: string;
    showControls?: boolean;
    isLoaded?: (imagePath: string) => boolean;
    isPrefetching?: (imagePath: string) => boolean;
}

const LongStripMode = ({
    pages,
    currentPage,
    settings,
    initialPage,
    onPageChange,
    isLoaded,
    isPrefetching,
}: ReadingModeProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<{
        [key: number]: HTMLDivElement;
    }>({});
    const lastReportedPage = useRef(initialPage);
    const isScrollingProgrammatically = useRef(false);
    const initialScrollDone = useRef(false);
    const isInitialPositioning = useRef(true); // NEW: Flag to prevent observer interference
    const observerRef = useRef<IntersectionObserver | null>(
        null
    );
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(
        null
    );
    const [visiblePages, setVisiblePages] = useState<
        Set<number>
    >(new Set([initialPage]));

    // Add state to track if component has mounted (client-side)
    const [isMounted, setIsMounted] = useState(false);

    // Set mounted state after hydration
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Memoize placeholder height calculation - consistent between server and client
    const placeholderHeights = useMemo(() => {
        const heights: { [key: number]: string } = {};
        // Use consistent default width for both server and client until mounted
        const windowWidth = isMounted
            ? window.innerWidth
            : 800;
        const containerWidth = windowWidth * 0.95;

        pages.forEach((page, index) => {
            if (page?.width && page?.height) {
                const aspectRatio =
                    page.height / page.width;
                heights[index + 1] = `${Math.min(
                    containerWidth * aspectRatio,
                    1200
                )}px`;
            } else {
                heights[index + 1] = "400px";
            }
        });

        return heights;
    }, [pages, isMounted]);

    // IMPROVED: Add more debugging context to page updates
    const updateCurrentPage = debounce((page: number) => {
        if (
            page !== lastReportedPage.current &&
            page >= 1 &&
            page <= pages.length
        ) {
            console.log(
                `LongStripMode: Updating page to ${page} from ${lastReportedPage.current}`,
                `(isInitialPositioning: ${isInitialPositioning.current}, isScrollingProgrammatically: ${isScrollingProgrammatically.current})`
            );
            lastReportedPage.current = page;
            onPageChange?.(page);
        }
    }, 100);

    // FIXED: Improved intersection observer with better page calculation
    useEffect(() => {
        if (!isMounted) return;

        const options = {
            root: containerRef.current,
            rootMargin: "100px 0px",
            threshold: 0.1,
        };

        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const observer = new IntersectionObserver(
            (entries) => {
                // CRITICAL FIX: Don't process during initial positioning or programmatic scrolling
                if (
                    isScrollingProgrammatically.current ||
                    isInitialPositioning.current
                ) {
                    return;
                }

                const visiblePageNumbers =
                    new Set<number>();
                let centerPage = lastReportedPage.current; // Use last known page as fallback

                // Batch process entries
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;

                    const pageNumber = parseInt(
                        entry.target.getAttribute(
                            "data-page-number"
                        ) || "0",
                        10
                    );

                    if (pageNumber > 0) {
                        visiblePageNumbers.add(pageNumber);
                    }
                }

                if (visiblePageNumbers.size === 0) return;

                // IMPROVED: Better center page calculation
                const visibleArray = Array.from(
                    visiblePageNumbers
                ).sort((a, b) => a - b);

                // Find the page closest to viewport center
                if (containerRef.current) {
                    const container = containerRef.current;
                    const scrollTop = container.scrollTop;
                    const containerHeight =
                        container.clientHeight;
                    const viewportCenter =
                        scrollTop + containerHeight / 2;

                    let bestPage = visibleArray[0];
                    let bestDistance =
                        Number.MAX_SAFE_INTEGER;

                    // Check each visible page to find closest to viewport center
                    visibleArray.forEach((pageNum) => {
                        const pageElement =
                            pageRefs.current[pageNum];
                        if (pageElement) {
                            const rect =
                                pageElement.getBoundingClientRect();
                            const containerRect =
                                container.getBoundingClientRect();
                            const elementCenter =
                                rect.top -
                                containerRect.top +
                                scrollTop +
                                rect.height / 2;
                            const distance = Math.abs(
                                elementCenter -
                                    viewportCenter
                            );

                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestPage = pageNum;
                            }
                        }
                    });

                    centerPage = bestPage;
                } else {
                    // Fallback to simple middle calculation
                    centerPage =
                        visibleArray[
                            Math.floor(
                                visibleArray.length / 2
                            )
                        ];
                }

                // Batch update visible pages
                setVisiblePages((prev) => {
                    const newSet = new Set(prev);

                    // Add newly visible pages
                    visiblePageNumbers.forEach((page) =>
                        newSet.add(page)
                    );

                    // Remove far pages in single pass
                    const toRemove: number[] = [];
                    newSet.forEach((page) => {
                        if (
                            Math.abs(centerPage - page) > 3
                        ) {
                            toRemove.push(page);
                        }
                    });

                    toRemove.forEach((page) =>
                        newSet.delete(page)
                    );
                    return newSet;
                });

                // Update current page
                if (
                    centerPage !== lastReportedPage.current
                ) {
                    updateCurrentPage(centerPage);
                }
            },
            options
        );

        observerRef.current = observer;

        // Observe existing elements
        Object.values(pageRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [initialPage, updateCurrentPage, isMounted]);

    // Optimize page ref registration
    const registerPageRef = useCallback(
        (el: HTMLDivElement | null, pageNumber: number) => {
            if (el) {
                pageRefs.current[pageNumber] = el;
                if (observerRef.current) {
                    observerRef.current.observe(el);
                }
            } else if (pageRefs.current[pageNumber]) {
                if (observerRef.current) {
                    observerRef.current.unobserve(
                        pageRefs.current[pageNumber]
                    );
                }
                delete pageRefs.current[pageNumber];
            }
        },
        []
    );

    // Optimize current page calculation with better caching
    const getCurrentPage = useCallback(() => {
        if (!containerRef.current) return 1;

        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const containerMidpoint =
            scrollTop + containerHeight / 2;

        let closestPage = 1;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        // Only check visible page refs for better performance
        const refsToCheck = Object.entries(
            pageRefs.current
        ).filter(
            ([pageNum]) =>
                visiblePages.has(parseInt(pageNum)) ||
                Math.abs(
                    parseInt(pageNum) -
                        lastReportedPage.current
                ) <= 2
        );

        for (const [pageNum, element] of refsToCheck) {
            if (!element) continue;

            const rect = element.getBoundingClientRect();
            const containerRect =
                container.getBoundingClientRect();
            const elementMidpoint =
                rect.top -
                containerRect.top +
                scrollTop +
                rect.height / 2;
            const distance = Math.abs(
                elementMidpoint - containerMidpoint
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPage = parseInt(pageNum);
            }
        }

        return closestPage;
    }, [visiblePages]);

    // Optimize scroll handler with RAF throttling
    const handleScroll = useCallback(() => {
        if (
            isScrollingProgrammatically.current ||
            isInitialPositioning.current
        )
            return;

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            requestAnimationFrame(() => {
                if (
                    !isScrollingProgrammatically.current &&
                    !isInitialPositioning.current
                ) {
                    const newPage = getCurrentPage();
                    updateCurrentPage(newPage);
                }
            });
        }, 50);
    }, [getCurrentPage, updateCurrentPage]);

    // IMPROVED: Better scrollToPage function with longer timeout for initial scroll
    const scrollToPage = useCallback(
        (pageNumber: number) => {
            const pageElement =
                pageRefs.current[pageNumber];
            if (!pageElement || !containerRef.current)
                return;

            isScrollingProgrammatically.current = true;

            const containerHeight =
                containerRef.current.clientHeight;
            const pageHeight = pageElement.offsetHeight;
            const targetPosition =
                pageElement.offsetTop -
                (containerHeight - pageHeight) / 2;

            containerRef.current.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: initialScrollDone.current
                    ? "smooth"
                    : "auto",
            });

            // Use longer timeout for initial scroll, shorter for subsequent
            const timeoutDuration =
                initialScrollDone.current ? 300 : 800;
            setTimeout(() => {
                isScrollingProgrammatically.current = false;
                if (!initialScrollDone.current) {
                    initialScrollDone.current = true;
                }
            }, timeoutDuration);
        },
        []
    );

    // Handle external page changes
    useEffect(() => {
        if (currentPage === lastReportedPage.current)
            return;

        if (pageRefs.current[currentPage]) {
            scrollToPage(currentPage);
            lastReportedPage.current = currentPage;
        }
    }, [currentPage, scrollToPage]);

    // FIXED: Improved initial scroll with proper timing and observer control
    useEffect(() => {
        if (initialScrollDone.current || !isMounted) return;

        const timer = setTimeout(() => {
            if (pageRefs.current[initialPage]) {
                // Set flag to prevent observer interference
                isInitialPositioning.current = true;

                scrollToPage(initialPage);
                lastReportedPage.current = initialPage;

                // Initialize visible pages more efficiently
                const initialVisible = new Set<number>();
                const start = Math.max(1, initialPage - 2);
                const end = Math.min(
                    pages.length,
                    initialPage + 2
                );

                for (let i = start; i <= end; i++) {
                    initialVisible.add(i);
                }
                setVisiblePages(initialVisible);

                // CRITICAL: Allow observer to work after initial positioning is complete
                setTimeout(() => {
                    isInitialPositioning.current = false;
                    console.log(
                        `LongStripMode: Initial positioning complete, enabling observer at page ${initialPage}`
                    );
                }, 1000); // Give enough time for scroll to complete
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [
        initialPage,
        scrollToPage,
        pages.length,
        isMounted,
    ]);

    // Optimize scroll listener with passive events
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isMounted) return;

        container.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            container.removeEventListener(
                "scroll",
                handleScroll
            );
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll, isMounted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-y-auto overflow-x-hidden"
            style={{
                scrollBehavior: "auto",
                WebkitOverflowScrolling: "touch",
                containIntrinsicSize: "0 500px",
            }}
        >
            <div className="flex flex-col items-center w-full">
                {pages.map((page, index) => {
                    const pageNumber = index + 1;
                    const isVisible =
                        visiblePages.has(pageNumber);
                    const isNearCurrent =
                        Math.abs(
                            pageNumber - currentPage
                        ) <= 1;
                    const shouldRender =
                        isVisible ||
                        isNearCurrent ||
                        pageNumber === initialPage;
                    const placeholderHeight =
                        placeholderHeights[pageNumber] ||
                        "400px";

                    return (
                        <div
                            key={`page-${pageNumber}`}
                            ref={(el) =>
                                registerPageRef(
                                    el,
                                    pageNumber
                                )
                            }
                            data-page-number={pageNumber}
                            className="w-full flex justify-center mb-2"
                            style={{
                                minHeight: shouldRender
                                    ? "auto"
                                    : placeholderHeight,
                                height: shouldRender
                                    ? "auto"
                                    : placeholderHeight,
                                contain:
                                    "layout style paint",
                            }}
                        >
                            {shouldRender ? (
                                <PageView
                                    page={page}
                                    settings={settings}
                                    pageNumber={pageNumber}
                                    priority={
                                        isNearCurrent ||
                                        pageNumber ===
                                            initialPage
                                    }
                                    mode="longStrip"
                                    pages={pages}
                                    isLoaded={isLoaded}
                                    isPrefetching={
                                        isPrefetching
                                    }
                                />
                            ) : (
                                <div
                                    className="w-full bg-gray-800 flex items-center justify-center"
                                    style={{
                                        height: placeholderHeight,
                                        aspectRatio:
                                            page?.width &&
                                            page?.height
                                                ? `${page.width} / ${page.height}`
                                                : "1 / 1",
                                        contain: "strict",
                                    }}
                                >
                                    <div className="text-gray-400 text-sm">
                                        Page {pageNumber}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LongStripMode;