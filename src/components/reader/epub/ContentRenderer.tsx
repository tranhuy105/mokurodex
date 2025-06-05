"use client";

import { SaveIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ContentRendererProps } from "./types";

export function ContentRenderer({
    content,
    isLoading,
    error,
    containerRef,
    saveReadingPosition,
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
                // Force mobile viewport mode through additional DOM manipulation
                const documentElement =
                    containerRef.current?.ownerDocument
                        ?.documentElement;
                const bodyElement =
                    containerRef.current?.ownerDocument
                        ?.body;

                if (
                    documentElement &&
                    bodyElement &&
                    containerRef.current?.ownerDocument
                ) {
                    // Apply critical styles to ensure mobile rendering
                    documentElement.style.cssText +=
                        "width: 100% !important; max-width: 100% !important; min-width: unset !important; zoom: 1 !important; -webkit-text-size-adjust: 100% !important;";
                    bodyElement.style.cssText +=
                        "width: 100% !important; max-width: 100% !important; min-width: unset !important; zoom: 1 !important; overflow-x: hidden !important;";

                    // Find and disable any problematic viewport settings
                    const viewportMeta =
                        containerRef.current.ownerDocument.querySelector(
                            'meta[name="viewport"]'
                        );
                    if (viewportMeta) {
                        viewportMeta.setAttribute(
                            "content",
                            "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, shrink-to-fit=no"
                        );
                    }

                    // Ensure mobile rendering by adding a style tag
                    const mobileStyle =
                        document.createElement("style");
                    mobileStyle.innerHTML = `
                        @-ms-viewport { width: device-width !important; }
                        @viewport { width: device-width !important; }
                        html, body {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-width: unset !important;
                            overflow-x: hidden !important;
                        }
                    `;
                    containerRef.current.ownerDocument.head.appendChild(
                        mobileStyle
                    );
                }

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

                // Initialize draggable progress handle
                initializeProgressHandle();

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
        const progressHandle = document.getElementById(
            "progress-handle"
        );

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

        // Update progress handle position
        if (progressHandle) {
            progressHandle.style.left = `${percentage}%`;
        }

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
            // Try to get TOC data from meta tag
            const tocDataMeta = document.querySelector(
                'meta[name="toc-data"]'
            );

            let tocItems = [];

            if (
                tocDataMeta &&
                tocDataMeta.getAttribute("content")
            ) {
                try {
                    tocItems = JSON.parse(
                        tocDataMeta.getAttribute(
                            "content"
                        ) || "[]"
                    );
                } catch (err) {
                    console.error(
                        "Failed to parse TOC data:",
                        err
                    );
                }
            }

            // If we have TOC data, use it
            if (tocItems.length > 0) {
                tocList.innerHTML = "";

                // Filter to only show top-level items and their immediate children
                // This focuses on major book parts rather than every small chapter
                const filteredTocItems = tocItems.filter(
                    (item: TocItemType) => {
                        // Keep all top-level items
                        return (
                            item.level === 0 ||
                            item.level === 1
                        );
                    }
                );

                renderTocItems(filteredTocItems, tocList);
            } else {
                // Fallback to part-based TOC instead of chapter-based
                const chapters =
                    document.querySelectorAll(".chapter");
                tocList.innerHTML = "";

                // Define types for our part structure
                interface BookPart {
                    id: string;
                    title: string;
                    element: Element;
                    chapters: BookChapter[];
                }

                interface BookChapter {
                    id: string;
                    title: string | null;
                    element: Element;
                }

                // Group chapters by their headings to identify major parts
                const parts: BookPart[] = [];
                let currentPart: BookPart | null = null;

                chapters.forEach((chapter, index) => {
                    const chapterId = chapter.getAttribute(
                        "data-chapter-id"
                    );

                    // Try to find a heading that indicates a major part
                    const partHeading =
                        chapter.querySelector("h1") ||
                        chapter.querySelector("h2") ||
                        chapter.querySelector("h3");

                    const headingText = partHeading
                        ? partHeading.textContent?.trim()
                        : null;

                    // Check if this is a new part based on heading text
                    if (
                        headingText &&
                        (headingText
                            .toLowerCase()
                            .includes("part") ||
                            headingText
                                .toLowerCase()
                                .includes("section") ||
                            headingText
                                .toLowerCase()
                                .includes("book") ||
                            headingText
                                .toLowerCase()
                                .includes("volume") ||
                            headingText
                                .toLowerCase()
                                .includes("chapter") ||
                            // If we don't have a current part yet, start with this one
                            currentPart === null)
                    ) {
                        // Start a new part
                        currentPart = {
                            id:
                                chapterId ||
                                `part-${parts.length + 1}`,
                            title:
                                headingText ||
                                `Part ${parts.length + 1}`,
                            element: chapter,
                            chapters: [],
                        };
                        parts.push(currentPart);
                    } else if (currentPart) {
                        // Add this as a sub-chapter to the current part
                        currentPart.chapters.push({
                            id:
                                chapterId ||
                                `chapter-${index}`,
                            title:
                                headingText ||
                                `Section ${
                                    currentPart.chapters
                                        .length + 1
                                }`,
                            element: chapter,
                        });
                    } else {
                        // If we don't have a current part, create a default one
                        currentPart = {
                            id: `part-${parts.length + 1}`,
                            title: `Part ${
                                parts.length + 1
                            }`,
                            element: chapter,
                            chapters: [],
                        };
                        parts.push(currentPart);
                    }
                });

                // Create TOC items from parts
                parts.forEach((part) => {
                    const li = document.createElement("li");
                    li.className = "toc-item";
                    li.setAttribute(
                        "data-chapter-id",
                        part.id
                    );
                    li.textContent = part.title;

                    li.addEventListener("click", () => {
                        // Scroll to part
                        part.element.scrollIntoView({
                            behavior: "smooth",
                        });
                        // Close sidebar
                        sidebar?.classList.remove("active");
                        overlay?.classList.remove("active");
                    });

                    tocList.appendChild(li);

                    // Add sub-chapters if there are any meaningful ones
                    // Only add sub-chapters if there are more than 1 to avoid redundancy
                    if (part.chapters.length > 1) {
                        part.chapters.forEach((chapter) => {
                            // Skip chapters with no meaningful title
                            if (
                                !chapter.title ||
                                chapter.title === part.title
                            ) {
                                return;
                            }

                            const subLi =
                                document.createElement(
                                    "li"
                                );
                            subLi.className =
                                "toc-item toc-child-level-1";
                            subLi.setAttribute(
                                "data-chapter-id",
                                chapter.id
                            );
                            subLi.textContent =
                                chapter.title;
                            subLi.style.paddingLeft =
                                "30px";

                            subLi.addEventListener(
                                "click",
                                () => {
                                    // Scroll to chapter
                                    chapter.element.scrollIntoView(
                                        {
                                            behavior:
                                                "smooth",
                                        }
                                    );
                                    // Close sidebar
                                    sidebar?.classList.remove(
                                        "active"
                                    );
                                    overlay?.classList.remove(
                                        "active"
                                    );
                                }
                            );

                            tocList.appendChild(subLi);
                        });
                    }
                });
            }

            // Initialize chapter markers on progress bar
            initializeChapterMarkers();
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

    // Define TOC item type to avoid 'any'
    type TocItemType = {
        id: string;
        title: string;
        href: string;
        level: number;
        position: number;
        children?: TocItemType[];
    };

    // Render TOC items recursively
    const renderTocItems = (
        items: TocItemType[],
        container: HTMLElement,
        level = 0
    ) => {
        items.forEach((item) => {
            const li = document.createElement("li");
            li.className = `toc-item ${
                level > 0 ? "toc-child-level-" + level : ""
            }`;
            li.setAttribute("data-href", item.href || "");
            li.setAttribute(
                "data-position",
                item.position.toString()
            );

            // Indent nested items
            if (level > 0) {
                li.style.paddingLeft = `${
                    level * 15 + 15
                }px`;
            }

            li.textContent = item.title || "Untitled";

            li.addEventListener("click", () => {
                // If href contains a fragment, try to scroll to that element
                if (item.href && item.href.includes("#")) {
                    const parts = item.href.split("#");
                    const fragment = parts[1];

                    if (fragment) {
                        const target =
                            document.getElementById(
                                fragment
                            ) ||
                            document.querySelector(
                                `[name="${fragment}"]`
                            );

                        if (target) {
                            target.scrollIntoView({
                                behavior: "smooth",
                            });

                            // Close sidebar
                            const sidebar =
                                document.getElementById(
                                    "reader-sidebar"
                                );
                            const overlay =
                                document.getElementById(
                                    "sidebar-overlay"
                                );
                            sidebar?.classList.remove(
                                "active"
                            );
                            overlay?.classList.remove(
                                "active"
                            );
                            return;
                        }
                    }
                }

                // If we have a position, scroll to it
                if (typeof item.position === "number") {
                    const readerContent =
                        document.getElementById(
                            "reader-content"
                        );
                    if (readerContent) {
                        const scrollHeight =
                            readerContent.scrollHeight -
                            readerContent.clientHeight;
                        const scrollPosition =
                            (item.position / 100) *
                            scrollHeight;
                        readerContent.scrollTo({
                            top: scrollPosition,
                            behavior: "smooth",
                        });

                        // Update progress bar
                        const progressBar =
                            document.getElementById(
                                "progress-bar"
                            );
                        if (progressBar) {
                            progressBar.style.width = `${item.position}%`;
                        }

                        // Update progress handle
                        const progressHandle =
                            document.getElementById(
                                "progress-handle"
                            );
                        if (progressHandle) {
                            progressHandle.style.left = `${item.position}%`;
                        }
                    }

                    // Close sidebar
                    const sidebar = document.getElementById(
                        "reader-sidebar"
                    );
                    const overlay = document.getElementById(
                        "sidebar-overlay"
                    );
                    sidebar?.classList.remove("active");
                    overlay?.classList.remove("active");
                }
            });

            container.appendChild(li);

            // Render children if any
            if (item.children && item.children.length > 0) {
                renderTocItems(
                    item.children,
                    container,
                    level + 1
                );
            }
        });
    };

    // Initialize chapter markers on the progress bar
    const initializeChapterMarkers = () => {
        const progressChapters = document.getElementById(
            "progress-chapters"
        );
        const tocItems =
            document.querySelectorAll(".toc-item");

        if (!progressChapters || tocItems.length === 0)
            return;

        progressChapters.innerHTML = "";

        // Only add markers for top-level items to avoid clutter
        tocItems.forEach((item) => {
            // Skip nested items
            if (
                item.classList.contains(
                    "toc-child-level-1"
                ) ||
                item.classList.contains("toc-child-level-2")
            ) {
                return;
            }

            const position = parseFloat(
                item.getAttribute("data-position") || "0"
            );
            const title = item.textContent || "Chapter";

            const marker = document.createElement("div");
            marker.className = "chapter-marker";
            marker.style.left = `${position}%`;
            marker.setAttribute("data-title", title);

            progressChapters.appendChild(marker);
        });
    };

    // Initialize draggable progress handle
    const initializeProgressHandle = () => {
        const progressContainer = document.getElementById(
            "progress-container"
        );
        const progressHandle = document.getElementById(
            "progress-handle"
        );
        const progressBar =
            document.getElementById("progress-bar");
        const progressInfo =
            document.getElementById("progress-info");
        const readerContent = document.getElementById(
            "reader-content"
        );

        if (
            !progressContainer ||
            !progressHandle ||
            !progressBar ||
            !readerContent
        )
            return;

        let isDragging = false;

        // Function to update handle position
        const updateHandlePosition = (clientX: number) => {
            const rect =
                progressContainer.getBoundingClientRect();
            const containerWidth = rect.width;
            const offsetX = clientX - rect.left;

            // Calculate percentage (constrained between 0-100)
            const percentage = Math.min(
                100,
                Math.max(
                    0,
                    (offsetX / containerWidth) * 100
                )
            );

            // Update handle position
            progressHandle.style.left = `${percentage}%`;

            // Update progress bar width
            progressBar.style.width = `${percentage}%`;

            // Update progress info
            if (progressInfo) {
                progressInfo.textContent = `${Math.round(
                    percentage
                )}% of book`;
                progressInfo.classList.add("active");
            }

            return percentage;
        };

        // Function to scroll to position
        const scrollToPosition = (percentage: number) => {
            if (!readerContent) return;

            const scrollHeight =
                readerContent.scrollHeight -
                readerContent.clientHeight;
            const scrollPosition =
                (percentage / 100) * scrollHeight;

            readerContent.scrollTo({
                top: scrollPosition,
                behavior: "auto", // Use "auto" for immediate response during dragging
            });

            // Dispatch position change event
            const positionChangeEvent = new CustomEvent(
                "reader-position-change",
                {
                    detail: { position: percentage },
                }
            );
            document.dispatchEvent(positionChangeEvent);
        };

        // Mouse events
        progressHandle.addEventListener(
            "mousedown",
            (e) => {
                e.preventDefault();
                isDragging = true;
                document.body.style.userSelect = "none"; // Prevent text selection during drag
            }
        );

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            const percentage = updateHandlePosition(
                e.clientX
            );
            scrollToPosition(percentage);
        });

        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = "";

            // Hide progress info after a delay
            if (progressInfo) {
                setTimeout(() => {
                    progressInfo.classList.remove("active");
                }, 2000);
            }
        });

        // Touch events for mobile
        progressHandle.addEventListener(
            "touchstart",
            (e) => {
                e.preventDefault();
                isDragging = true;
                document.body.style.userSelect = "none";
            },
            { passive: false }
        );

        document.addEventListener(
            "touchmove",
            (e) => {
                if (!isDragging || !e.touches[0]) return;

                const percentage = updateHandlePosition(
                    e.touches[0].clientX
                );
                scrollToPosition(percentage);
            },
            { passive: true }
        );

        document.addEventListener("touchend", () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = "";

            // Hide progress info after a delay
            if (progressInfo) {
                setTimeout(() => {
                    progressInfo.classList.remove("active");
                }, 2000);
            }
        });

        // Click on progress bar to jump to position
        progressContainer.addEventListener("click", (e) => {
            // Ignore if the click was on the handle
            if (
                e.target === progressHandle ||
                (e.target instanceof Node &&
                    progressHandle.contains(e.target))
            ) {
                return;
            }

            const percentage = updateHandlePosition(
                e.clientX
            );
            scrollToPosition(percentage);

            // Hide progress info after a delay
            if (progressInfo) {
                setTimeout(() => {
                    progressInfo.classList.remove("active");
                }, 2000);
            }
        });

        // Add to window.literaReader
        if (typeof window !== "undefined") {
            if (!window.literaReader) {
                window.literaReader = {
                    updateProgressBar: () => {},
                    toggleSidebar: () => {},
                    scrollToChapter: () => {},
                    appendChapter: () => {},
                    setSpine: () => {},
                    updateProgressHandle: () => {},
                };
            }

            window.literaReader.updateProgressHandle = (
                position: number
            ) => {
                if (progressHandle) {
                    progressHandle.style.left = `${position}%`;
                }
            };
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
        <>
            <div
                ref={containerRef}
                className="h-full overflow-hidden max-w-3xl mx-auto"
                style={{
                    willChange: "scroll-position",
                    contain: "layout style paint",
                }}
            />
            {/* Clean save button - top right, icon only */}
            <button
                onClick={saveReadingPosition}
                className="fixed bottom-4 left-4 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-105 cursor-pointer opacity-20 hover:opacity-100"
                aria-label="Save reading progress"
            >
                <SaveIcon className="w-5 h-5" />
            </button>
        </>
    );
}
