"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ContentRendererProps } from "./types";

export function ContentRenderer({
    content,
    isLoading,
    error,
    containerRef,
}: ContentRendererProps) {
    // Keep track of whether content has been rendered
    const contentRenderedRef = useRef(false);
    const touchStartXRef = useRef(0);
    const touchStartYRef = useRef(0);
    const progressTimeoutRef = useRef<
        ReturnType<typeof setTimeout> | undefined
    >(undefined);
    const positionChangeTimerRef = useRef<
        ReturnType<typeof setTimeout> | undefined
    >(undefined);

    // Use useLayoutEffect to ensure DOM manipulation happens before browser paint
    // This prevents flickering and excessive re-renders
    useLayoutEffect(() => {
        if (
            content &&
            containerRef.current &&
            !contentRenderedRef.current
        ) {
            // Set content directly to avoid React's reconciliation
            containerRef.current.innerHTML = content;
            contentRenderedRef.current = true;

            // Run initialization after content is set
            setTimeout(() => {
                // Initialize event listeners for the reader UI
                const readerContent =
                    document.getElementById(
                        "reader-content"
                    );
                if (readerContent) {
                    // Make sure we don't re-add listeners
                    readerContent.removeEventListener(
                        "scroll",
                        handleScroll
                    );
                    readerContent.addEventListener(
                        "scroll",
                        handleScroll,
                        { passive: true }
                    );
                }

                // Set book title
                const bookTitleElement =
                    document.getElementById(
                        "reader-book-title"
                    );
                const metaTitle = document.querySelector(
                    'meta[name="book-title"]'
                );
                if (
                    bookTitleElement &&
                    metaTitle &&
                    metaTitle.getAttribute("content")
                ) {
                    bookTitleElement.textContent =
                        metaTitle.getAttribute("content");
                }

                // Set up back button
                const backButton =
                    document.getElementById("back-button");
                if (backButton) {
                    backButton.addEventListener(
                        "click",
                        () => {
                            window.history.back();
                        }
                    );
                }

                // Initialize TOC
                initializeTOC();

                // Set up touch gestures for mobile
                setupTouchGestures();
            }, 100);
        }
    }, [content]);

    // Set up touch gestures for mobile navigation
    const setupTouchGestures = () => {
        const readerContent = document.getElementById(
            "reader-content"
        );
        const sidebar = document.getElementById(
            "reader-sidebar"
        );
        const overlay = document.getElementById(
            "sidebar-overlay"
        );

        if (!readerContent || !sidebar || !overlay) return;

        // Touch start - record initial position
        readerContent.addEventListener(
            "touchstart",
            (e) => {
                touchStartXRef.current =
                    e.touches[0].clientX;
                touchStartYRef.current =
                    e.touches[0].clientY;
            },
            { passive: true }
        );

        // Touch end - detect swipe
        readerContent.addEventListener(
            "touchend",
            (e) => {
                if (!e.changedTouches[0]) return;

                const touchEndX =
                    e.changedTouches[0].clientX;
                const touchEndY =
                    e.changedTouches[0].clientY;

                const deltaX =
                    touchEndX - touchStartXRef.current;
                const deltaY =
                    touchEndY - touchStartYRef.current;

                // Horizontal swipe detection (only if vertical movement is minimal)
                if (
                    Math.abs(deltaX) > 100 &&
                    Math.abs(deltaY) < 50
                ) {
                    // Right swipe - open TOC
                    if (deltaX > 0) {
                        sidebar.classList.add("active");
                        overlay.classList.add("active");
                    }
                }
            },
            { passive: true }
        );

        // Add swipe to close for sidebar
        sidebar.addEventListener(
            "touchstart",
            (e) => {
                touchStartXRef.current =
                    e.touches[0].clientX;
            },
            { passive: true }
        );

        sidebar.addEventListener(
            "touchend",
            (e) => {
                if (!e.changedTouches[0]) return;

                const touchEndX =
                    e.changedTouches[0].clientX;
                const deltaX =
                    touchEndX - touchStartXRef.current;

                // Left swipe - close TOC
                if (deltaX < -50) {
                    sidebar.classList.remove("active");
                    overlay.classList.remove("active");
                }
            },
            { passive: true }
        );
    };

    // Handle scroll without causing React re-renders
    const handleScroll = () => {
        const readerContent = document.getElementById(
            "reader-content"
        );
        const progressBar =
            document.getElementById("progress-bar");
        const progressInfo =
            document.getElementById("progress-info");

        if (!readerContent || !progressBar) return;

        const scrollHeight =
            readerContent.scrollHeight -
            readerContent.clientHeight;
        const scrollPosition = readerContent.scrollTop;
        const percentage = Math.min(
            100,
            Math.max(
                0,
                Math.round(
                    (scrollPosition / scrollHeight) * 100
                )
            )
        );

        // Update progress bar without state updates
        progressBar.style.width = `${percentage}%`;

        if (progressInfo) {
            progressInfo.textContent = `${percentage}% of book`;
            progressInfo.classList.add("active");

            // Use a ref-based timeout to avoid React state
            if (progressTimeoutRef.current) {
                clearTimeout(progressTimeoutRef.current);
            }
            progressTimeoutRef.current = setTimeout(() => {
                if (progressInfo) {
                    progressInfo.classList.remove("active");
                }
            }, 2000);
        }

        // Dispatch a custom event to notify parent components about position change
        // Simple debounce to reduce frequency of updates
        if (positionChangeTimerRef.current) {
            clearTimeout(positionChangeTimerRef.current);
        }
        positionChangeTimerRef.current = setTimeout(() => {
            const positionChangeEvent = new CustomEvent(
                "reader-position-change",
                {
                    detail: { position: percentage },
                }
            );
            document.dispatchEvent(positionChangeEvent);
        }, 200);
    };

    // Initialize table of contents
    const initializeTOC = () => {
        const tocList = document.getElementById("toc-list");
        const sidebar = document.getElementById(
            "reader-sidebar"
        );
        const overlay = document.getElementById(
            "sidebar-overlay"
        );
        const toggleTocBtn =
            document.getElementById("toggle-toc");
        const sidebarClose =
            document.getElementById("sidebar-close");

        if (tocList) {
            const chapters =
                document.querySelectorAll(".chapter");
            tocList.innerHTML = "";

            chapters.forEach((chapter, index) => {
                const chapterId = chapter.getAttribute(
                    "data-chapter-id"
                );
                // Try to find a title within the chapter
                const titleEl =
                    chapter.querySelector("h1") ||
                    chapter.querySelector("h2");
                const title = titleEl
                    ? titleEl.textContent
                    : `Chapter ${index + 1}`;

                const li = document.createElement("li");
                li.className = "toc-item";
                li.setAttribute(
                    "data-chapter-id",
                    chapterId || ""
                );
                li.textContent =
                    title || `Chapter ${index + 1}`;

                li.addEventListener("click", () => {
                    // Scroll to chapter
                    chapter.scrollIntoView({
                        behavior: "smooth",
                    });
                    // Close sidebar
                    sidebar?.classList.remove("active");
                    overlay?.classList.remove("active");
                });

                tocList.appendChild(li);
            });
        }

        // Add sidebar toggle functionality
        if (toggleTocBtn && sidebar && overlay) {
            toggleTocBtn.addEventListener("click", () => {
                sidebar.classList.toggle("active");
                overlay.classList.toggle("active");
            });
        }

        if (sidebarClose && sidebar && overlay) {
            sidebarClose.addEventListener("click", () => {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
            });
        }

        if (overlay && sidebar) {
            overlay.addEventListener("click", () => {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
            });
        }
    };

    // Cleanup function
    useEffect(() => {
        return () => {
            const readerContent = document.getElementById(
                "reader-content"
            );
            if (readerContent) {
                readerContent.removeEventListener(
                    "scroll",
                    handleScroll
                );
                readerContent.removeEventListener(
                    "touchstart",
                    () => {}
                );
                readerContent.removeEventListener(
                    "touchend",
                    () => {}
                );
            }

            // Clean up back button event listener
            const backButton =
                document.getElementById("back-button");
            if (backButton) {
                backButton.removeEventListener(
                    "click",
                    () => {
                        window.history.back();
                    }
                );
            }

            const sidebar = document.getElementById(
                "reader-sidebar"
            );
            if (sidebar) {
                sidebar.removeEventListener(
                    "touchstart",
                    () => {}
                );
                sidebar.removeEventListener(
                    "touchend",
                    () => {}
                );
            }

            if (progressTimeoutRef.current) {
                clearTimeout(progressTimeoutRef.current);
            }
            if (positionChangeTimerRef.current) {
                clearTimeout(
                    positionChangeTimerRef.current
                );
            }
        };
    }, []);

    if (isLoading) {
        return null;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500 p-4">{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden"
            style={{
                willChange: "scroll-position",
                contain: "layout style paint",
            }}
        />
    );
}
