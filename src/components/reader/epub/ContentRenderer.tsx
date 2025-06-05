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
    // Function to scroll to element while accounting for header height
    const scrollToElementWithHeaderOffset = (
        element: Element
    ) => {
        if (!element) return;

        const readerContent = document.getElementById(
            "reader-content"
        );
        const header = document.querySelector(
            ".reader-header"
        );

        if (readerContent && header) {
            const headerHeight =
                header.getBoundingClientRect().height;

            // Get the element's position relative to the document
            const elementRect =
                element.getBoundingClientRect();
            const readerRect =
                readerContent.getBoundingClientRect();

            // Calculate the actual position in the scrollable area
            // This is the element's position relative to the top of the reader content
            const elementPositionInReader =
                elementRect.top -
                readerRect.top +
                readerContent.scrollTop;

            // Apply the header offset (subtract header height)
            const offsetPosition =
                elementPositionInReader - headerHeight - 10; // 10px extra padding

            // Scroll with smooth behavior
            readerContent.scrollTo({
                top: offsetPosition,
                behavior: "smooth",
            });

            // Update position after scrolling (to fix any precision issues)
            setTimeout(() => {
                const newElementRect =
                    element.getBoundingClientRect();
                const newHeaderRect =
                    header.getBoundingClientRect();

                // Check if element is now properly below the header
                if (
                    newElementRect.top <
                    newHeaderRect.bottom + 5
                ) {
                    // Fine tune the position
                    readerContent.scrollBy({
                        top:
                            newElementRect.top -
                            newHeaderRect.bottom -
                            5,
                        behavior: "auto",
                    });
                }
            }, 400); // Wait for smooth scroll to finish
        } else {
            // Fallback to default behavior if elements not found
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

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

                // Set up font size button
                setupFontSizeButton();

                // Set up fullscreen button
                setupFullscreenButton();
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
        const progressHandle = document.getElementById(
            "progress-handle"
        );
        const tooltipPosition = document.getElementById(
            "tooltip-position"
        );
        const chapterProgress = document.getElementById(
            "chapter-progress"
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

        // Update progress bar
        progressBar.style.width = `${percentage}%`;

        // Update progress handle position
        if (progressHandle) {
            progressHandle.style.left = `${percentage}%`;
        }

        // Update tooltip position percentage
        if (tooltipPosition instanceof HTMLElement) {
            tooltipPosition.textContent = `${percentage}%`;
        }

        // Find current chapter and update chapter progress
        if (chapterProgress instanceof HTMLElement) {
            try {
                // Use the same logic as in script.ts to calculate chapter percentage
                const tocDataMeta = document.querySelector(
                    'meta[name="toc-data"]'
                );
                if (
                    tocDataMeta &&
                    tocDataMeta.getAttribute("content")
                ) {
                    const tocItems = JSON.parse(
                        tocDataMeta.getAttribute(
                            "content"
                        ) || "[]"
                    );
                    if (tocItems && tocItems.length > 0) {
                        // Filter to top-level items and sort by position
                        const chapters = tocItems
                            .filter(
                                (item: { level: number }) =>
                                    item.level === 0
                            )
                            .sort(
                                (
                                    a: { position: number },
                                    b: { position: number }
                                ) => a.position - b.position
                            );

                        // Find current chapter (the last chapter whose position is <= current position)
                        let currentChapter = chapters[0];
                        let currentChapterIndex = 0;

                        for (
                            let i = 0;
                            i < chapters.length;
                            i++
                        ) {
                            if (
                                chapters[i].position <=
                                percentage
                            ) {
                                currentChapter =
                                    chapters[i];
                                currentChapterIndex = i;
                            } else {
                                break;
                            }
                        }

                        // Get chapter bounds
                        const chapterStart =
                            currentChapter.position;
                        const chapterEnd =
                            currentChapterIndex <
                            chapters.length - 1
                                ? chapters[
                                      currentChapterIndex +
                                          1
                                  ].position
                                : 100;

                        // Calculate chapter percentage
                        const chapterLength =
                            chapterEnd - chapterStart;
                        const positionInChapter =
                            percentage - chapterStart;
                        const chapterPercentage =
                            Math.round(
                                (positionInChapter /
                                    chapterLength) *
                                    100
                            );
                        const chapterRemaining = Math.max(
                            0,
                            100 - chapterPercentage
                        );

                        chapterProgress.textContent = `${chapterRemaining}% of chapter left`;
                    }
                }
            } catch (error) {
                console.error(
                    "Error updating chapter progress:",
                    error
                );
            }
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
                        // Scroll to part with header offset
                        scrollToElementWithHeaderOffset(
                            part.element
                        );

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
                                    // Scroll to chapter with header offset
                                    scrollToElementWithHeaderOffset(
                                        chapter.element
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
                            scrollToElementWithHeaderOffset(
                                target
                            );

                            // Calculate and update progress bar based on scroll position
                            const readerContent =
                                document.getElementById(
                                    "reader-content"
                                );
                            if (readerContent) {
                                setTimeout(() => {
                                    const scrollHeight =
                                        readerContent.scrollHeight -
                                        readerContent.clientHeight;
                                    const scrollPosition =
                                        readerContent.scrollTop;
                                    const percentage =
                                        Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                Math.round(
                                                    (scrollPosition /
                                                        scrollHeight) *
                                                        100
                                                )
                                            )
                                        );

                                    // Update progress bar
                                    const progressBar =
                                        document.getElementById(
                                            "progress-bar"
                                        );
                                    if (progressBar) {
                                        progressBar.style.width = `${percentage}%`;
                                    }

                                    // Update progress handle
                                    const progressHandle =
                                        document.getElementById(
                                            "progress-handle"
                                        );
                                    if (progressHandle) {
                                        progressHandle.style.left = `${percentage}%`;
                                    }

                                    // Update tooltip
                                    const progressTooltip =
                                        document.getElementById(
                                            "progress-tooltip"
                                        );
                                    if (progressTooltip) {
                                        progressTooltip.textContent = `${percentage}%`;
                                    }
                                }, 100); // Small delay to ensure scrolling has completed
                            }

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

                // Instead of using the stored position, find the element in the DOM and scroll to it
                // This ensures position calculation is based on the same DOM heights as the progress bar
                const chapterId = item.id;
                const chapterElement =
                    document.getElementById(
                        `chapter-${chapterId}`
                    ) ||
                    document.querySelector(
                        `[data-chapter-id="${chapterId}"]`
                    );

                if (chapterElement) {
                    scrollToElementWithHeaderOffset(
                        chapterElement
                    );

                    // Calculate and update progress bar based on scroll position
                    const readerContent =
                        document.getElementById(
                            "reader-content"
                        );
                    if (readerContent) {
                        setTimeout(() => {
                            const scrollHeight =
                                readerContent.scrollHeight -
                                readerContent.clientHeight;
                            const scrollPosition =
                                readerContent.scrollTop;
                            const percentage = Math.min(
                                100,
                                Math.max(
                                    0,
                                    Math.round(
                                        (scrollPosition /
                                            scrollHeight) *
                                            100
                                    )
                                )
                            );

                            // Update progress bar
                            const progressBar =
                                document.getElementById(
                                    "progress-bar"
                                );
                            if (progressBar) {
                                progressBar.style.width = `${percentage}%`;
                            }

                            // Update progress handle
                            const progressHandle =
                                document.getElementById(
                                    "progress-handle"
                                );
                            if (progressHandle) {
                                progressHandle.style.left = `${percentage}%`;
                            }

                            // Update tooltip
                            const progressTooltip =
                                document.getElementById(
                                    "progress-tooltip"
                                );
                            if (progressTooltip) {
                                progressTooltip.textContent = `${percentage}%`;
                            }
                        }, 100); // Small delay to ensure scrolling has completed
                    }
                } else if (
                    typeof item.position === "number"
                ) {
                    // Fallback to position-based scrolling if DOM element not found
                    const readerContent =
                        document.getElementById(
                            "reader-content"
                        );
                    if (readerContent) {
                        // First try to find actual chapter content based on href
                        if (item.href) {
                            const href =
                                item.href.split("#")[0];
                            // Try to find chapter with this href
                            const chapters =
                                document.querySelectorAll(
                                    ".chapter"
                                );
                            let targetChapter = null;

                            // Find chapter by scanning content for matching href
                            for (
                                let i = 0;
                                i < chapters.length;
                                i++
                            ) {
                                const chapter = chapters[i];
                                const links =
                                    chapter.querySelectorAll(
                                        "a[href]"
                                    );

                                for (
                                    let j = 0;
                                    j < links.length;
                                    j++
                                ) {
                                    const link = links[j];
                                    if (
                                        link.getAttribute(
                                            "href"
                                        ) === href
                                    ) {
                                        targetChapter =
                                            chapter;
                                        break;
                                    }
                                }

                                if (targetChapter) break;
                            }

                            if (targetChapter) {
                                scrollToElementWithHeaderOffset(
                                    targetChapter
                                );

                                // Calculate and update progress bar
                                setTimeout(() => {
                                    const scrollHeight =
                                        readerContent.scrollHeight -
                                        readerContent.clientHeight;
                                    const scrollPosition =
                                        readerContent.scrollTop;
                                    const percentage =
                                        Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                Math.round(
                                                    (scrollPosition /
                                                        scrollHeight) *
                                                        100
                                                )
                                            )
                                        );

                                    // Update progress bar
                                    const progressBar =
                                        document.getElementById(
                                            "progress-bar"
                                        );
                                    if (progressBar) {
                                        progressBar.style.width = `${percentage}%`;
                                    }

                                    // Update progress handle
                                    const progressHandle =
                                        document.getElementById(
                                            "progress-handle"
                                        );
                                    if (progressHandle) {
                                        progressHandle.style.left = `${percentage}%`;
                                    }
                                }, 100);

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

                        // Last resort: use the metadata position
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
        if (!progressChapters) return;

        progressChapters.innerHTML = "";

        // Only create markers for TOC items, but calculate their positions based on DOM
        const readerContent = document.getElementById(
            "reader-content"
        );
        if (!readerContent) return;

        const totalHeight = readerContent.scrollHeight;
        const clientHeight = readerContent.clientHeight;
        const usableHeight = totalHeight - clientHeight;

        // Get TOC data from meta tag
        const tocDataMeta = document.querySelector(
            'meta[name="toc-data"]'
        );
        if (
            !tocDataMeta ||
            !tocDataMeta.getAttribute("content")
        )
            return;

        try {
            const tocData = JSON.parse(
                tocDataMeta.getAttribute("content") || "[]"
            );

            // Only use top-level items to avoid cluttering the progress bar
            const topLevelItems = tocData.filter(
                (item: { level: number }) =>
                    item.level === 0
            );

            if (topLevelItems.length === 0) return;

            console.log(
                "Calculating markers for TOC items:",
                topLevelItems.length
            );

            // Create a marker for each top-level TOC item
            topLevelItems.forEach(
                (item: {
                    id: string;
                    title?: string;
                    href?: string;
                    level: number;
                    position: number;
                }) => {
                    // First try to find the corresponding DOM element
                    const chapterId = item.id;
                    let foundElement = false;

                    // Try multiple methods to find the element

                    // 1. Try by chapter ID
                    const chapterElement =
                        document.getElementById(
                            `chapter-${chapterId}`
                        ) ||
                        document.querySelector(
                            `[data-chapter-id="${chapterId}"]`
                        );

                    if (chapterElement) {
                        // Calculate position based on DOM position
                        const rect =
                            chapterElement.getBoundingClientRect();
                        const chapterTop =
                            rect.top +
                            readerContent.scrollTop;
                        const percentage = Math.min(
                            100,
                            Math.max(
                                0,
                                (chapterTop /
                                    usableHeight) *
                                    100
                            )
                        );

                        // Create marker
                        const marker =
                            document.createElement("div");
                        marker.className = "chapter-marker";
                        marker.style.left = `${percentage}%`;
                        marker.setAttribute(
                            "data-title",
                            item.title || "Chapter"
                        );
                        progressChapters.appendChild(
                            marker
                        );
                        foundElement = true;
                    }

                    // 2. If not found, try by href if available
                    else if (item.href && !foundElement) {
                        const fragment = item.href.includes(
                            "#"
                        )
                            ? item.href.split("#")[1]
                            : null;

                        // First try to find the element by ID (fragment)
                        if (fragment) {
                            const fragmentElement =
                                document.getElementById(
                                    fragment
                                ) ||
                                document.querySelector(
                                    `[name="${fragment}"]`
                                );

                            if (fragmentElement) {
                                const rect =
                                    fragmentElement.getBoundingClientRect();
                                const elemTop =
                                    rect.top +
                                    readerContent.scrollTop;
                                const percentage = Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        (elemTop /
                                            usableHeight) *
                                            100
                                    )
                                );

                                const marker =
                                    document.createElement(
                                        "div"
                                    );
                                marker.className =
                                    "chapter-marker";
                                marker.style.left = `${percentage}%`;
                                marker.setAttribute(
                                    "data-title",
                                    item.title || "Chapter"
                                );
                                progressChapters.appendChild(
                                    marker
                                );
                                foundElement = true;
                            }
                        }

                        // If fragment not found, try to find chapter with matching href
                        if (!foundElement) {
                            // Use the original position from metadata as fallback
                            const marker =
                                document.createElement(
                                    "div"
                                );
                            marker.className =
                                "chapter-marker";
                            marker.style.left = `${item.position}%`;
                            marker.setAttribute(
                                "data-title",
                                item.title || "Chapter"
                            );
                            progressChapters.appendChild(
                                marker
                            );
                        }
                    }
                    // 3. If still not found, use original position from metadata
                    else if (!foundElement) {
                        const marker =
                            document.createElement("div");
                        marker.className = "chapter-marker";
                        marker.style.left = `${item.position}%`;
                        marker.setAttribute(
                            "data-title",
                            item.title || "Chapter"
                        );
                        progressChapters.appendChild(
                            marker
                        );
                    }
                }
            );
        } catch (err) {
            console.error(
                "Failed to parse TOC data for markers:",
                err
            );
        }
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

            // Update tooltip position
            const tooltipPosition = document.getElementById(
                "tooltip-position"
            );
            if (tooltipPosition) {
                tooltipPosition.textContent = `${Math.round(
                    percentage
                )}%`;
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

            // Update chapter progress
            updateChapterProgress(percentage);

            // Dispatch position change event
            const positionChangeEvent = new CustomEvent(
                "reader-position-change",
                {
                    detail: { position: percentage },
                }
            );
            document.dispatchEvent(positionChangeEvent);
        };

        // Function to update chapter progress
        const updateChapterProgress = (
            percentage: number
        ) => {
            const chapterProgress = document.getElementById(
                "chapter-progress"
            );
            if (!chapterProgress) return;

            try {
                // Use the same logic as in script.ts to calculate chapter percentage
                const tocDataMeta = document.querySelector(
                    'meta[name="toc-data"]'
                );
                if (
                    tocDataMeta &&
                    tocDataMeta.getAttribute("content")
                ) {
                    const tocItems = JSON.parse(
                        tocDataMeta.getAttribute(
                            "content"
                        ) || "[]"
                    );
                    if (tocItems && tocItems.length > 0) {
                        // Filter to top-level items and sort by position
                        const chapters = tocItems
                            .filter(
                                (item: { level: number }) =>
                                    item.level === 0
                            )
                            .sort(
                                (
                                    a: { position: number },
                                    b: { position: number }
                                ) => a.position - b.position
                            );

                        // Find current chapter
                        let currentChapter = chapters[0];
                        let currentChapterIndex = 0;

                        for (
                            let i = 0;
                            i < chapters.length;
                            i++
                        ) {
                            if (
                                chapters[i].position <=
                                percentage
                            ) {
                                currentChapter =
                                    chapters[i];
                                currentChapterIndex = i;
                            } else {
                                break;
                            }
                        }

                        // Calculate chapter percentage
                        const chapterStart =
                            currentChapter.position;
                        const chapterEnd =
                            currentChapterIndex <
                            chapters.length - 1
                                ? chapters[
                                      currentChapterIndex +
                                          1
                                  ].position
                                : 100;
                        const chapterLength =
                            chapterEnd - chapterStart;
                        const positionInChapter =
                            percentage - chapterStart;
                        const chapterPercentage =
                            Math.round(
                                (positionInChapter /
                                    chapterLength) *
                                    100
                            );
                        const chapterRemaining = Math.max(
                            0,
                            100 - chapterPercentage
                        );

                        chapterProgress.textContent = `${chapterRemaining}% of chapter left`;
                    }
                }
            } catch (error) {
                console.error(
                    "Error updating chapter progress:",
                    error
                );
            }
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
            { passive: false }
        );

        const endDragTouch = () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = "";
        };

        document.addEventListener(
            "touchend",
            endDragTouch,
            { passive: true }
        );
        document.addEventListener(
            "touchcancel",
            endDragTouch,
            { passive: true }
        );

        // Additional safety for mobile
        window.addEventListener("blur", endDragTouch, {
            passive: true,
        });
        window.addEventListener(
            "visibilitychange",
            () => {
                if (
                    document.visibilityState !== "visible"
                ) {
                    endDragTouch();
                }
            },
            { passive: true }
        );

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

    // Set up font size button
    const setupFontSizeButton = () => {
        const fontSizeBtn =
            document.getElementById("font-size-btn");
        const fontSizeMenu = document.getElementById(
            "font-size-menu"
        );
        const fontSizeOptions = document.querySelectorAll(
            ".font-size-option"
        );
        const readerContainer = document.querySelector(
            ".litera-reader"
        );

        if (
            !fontSizeBtn ||
            !fontSizeMenu ||
            !readerContainer
        )
            return;

        try {
            // Set default font size or restore from localStorage
            const savedFontSize =
                localStorage.getItem("reader-font-size") ||
                "medium";
            readerContainer.classList.add(
                `font-size-${savedFontSize}`
            );

            // Mark the active option
            fontSizeOptions.forEach((option) => {
                if (
                    option.getAttribute("data-size") ===
                    savedFontSize
                ) {
                    option.classList.add("active");
                }
            });

            // Toggle menu on button click
            fontSizeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                fontSizeMenu.classList.toggle("active");
            });

            // Handle font size selection
            fontSizeOptions.forEach((option) => {
                option.addEventListener("click", () => {
                    const size =
                        option.getAttribute("data-size");

                    // Remove all font size classes
                    readerContainer.classList.remove(
                        "font-size-small",
                        "font-size-medium",
                        "font-size-large",
                        "font-size-x-large"
                    );

                    // Add selected class
                    if (size) {
                        readerContainer.classList.add(
                            `font-size-${size}`
                        );
                        localStorage.setItem(
                            "reader-font-size",
                            size
                        );

                        // Update active state
                        fontSizeOptions.forEach((opt) =>
                            opt.classList.remove("active")
                        );
                        option.classList.add("active");
                    }

                    // Close menu
                    fontSizeMenu.classList.remove("active");

                    // Recalculate progress after font size change
                    setTimeout(() => {
                        handleScroll();
                    }, 100);
                });
            });

            // Close menu when clicking outside
            document.addEventListener("click", (e) => {
                if (
                    e.target !== fontSizeBtn &&
                    !fontSizeMenu.contains(e.target as Node)
                ) {
                    fontSizeMenu.classList.remove("active");
                }
            });
        } catch (error) {
            console.error(
                "Error setting up font size button:",
                error
            );
        }
    };

    // Set up fullscreen button
const setupFullscreenButton = () => {
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const readerContainer = document.querySelector(".litera-reader");

    if (!fullscreenBtn || !readerContainer) return;

    try {
        fullscreenBtn.addEventListener("click", () => {
            const readerContent = document.getElementById("reader-content");
            
            if (!document.fullscreenElement) {
                // Store current scroll position before entering fullscreen
                let currentScrollTop = 0;
                let currentScrollPercentage = 0;
                
                if (readerContent) {
                    currentScrollTop = readerContent.scrollTop;
                    const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                    currentScrollPercentage = scrollHeight > 0 ? (currentScrollTop / scrollHeight) * 100 : 0;
                }

                // Enter fullscreen
                const enterFullscreen = async () => {
                    try {
                        if (readerContainer.requestFullscreen) {
                            await readerContainer.requestFullscreen();
                        } else if ("webkitRequestFullscreen" in readerContainer) {
                            await (readerContainer as HTMLElement & {
                                webkitRequestFullscreen(): Promise<void>;
                            }).webkitRequestFullscreen();
                        } else if ("msRequestFullscreen" in readerContainer) {
                            await (readerContainer as HTMLElement & {
                                msRequestFullscreen(): Promise<void>;
                            }).msRequestFullscreen();
                        }

                        readerContainer.classList.add("fullscreen");

                        // Restore scroll position after layout settles
                        setTimeout(() => {
                            if (readerContent) {
                                const newScrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                const newScrollTop = (currentScrollPercentage / 100) * newScrollHeight;
                                
                                readerContent.scrollTo({
                                    top: newScrollTop,
                                    behavior: "auto"
                                });

                                // Update progress bar and handle to match new position
                                const percentage = Math.min(100, Math.max(0, Math.round(currentScrollPercentage)));
                                
                                const progressBar = document.getElementById("progress-bar");
                                if (progressBar) {
                                    progressBar.style.width = `${percentage}%`;
                                }

                                const progressHandle = document.getElementById("progress-handle");
                                if (progressHandle) {
                                    progressHandle.style.left = `${percentage}%`;
                                }

                                // Update tooltip
                                const tooltipPosition = document.getElementById("tooltip-position");
                                if (tooltipPosition) {
                                    tooltipPosition.textContent = `${Math.round(percentage)}%`;
                                }
                            }
                        }, 100); // Small delay to allow layout to complete

                    } catch (error) {
                        console.error("Error entering fullscreen:", error);
                        readerContainer.classList.add("fullscreen");
                    }
                };

                enterFullscreen();

            } else {
                // Store current scroll position before exiting fullscreen
                let currentScrollTop = 0;
                let currentScrollPercentage = 0;
                
                if (readerContent) {
                    currentScrollTop = readerContent.scrollTop;
                    const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                    currentScrollPercentage = scrollHeight > 0 ? (currentScrollTop / scrollHeight) * 100 : 0;
                }

                // Exit fullscreen
                const exitFullscreen = async () => {
                    try {
                        if (document.exitFullscreen) {
                            await document.exitFullscreen();
                        } else if ("webkitExitFullscreen" in document) {
                            await (document as Document & {
                                webkitExitFullscreen(): Promise<void>;
                            }).webkitExitFullscreen();
                        } else if ("msExitFullscreen" in document) {
                            await (document as Document & {
                                msExitFullscreen(): Promise<void>;
                            }).msExitFullscreen();
                        }

                        readerContainer.classList.remove("fullscreen");

                        // Restore scroll position after layout settles
                        setTimeout(() => {
                            if (readerContent) {
                                const newScrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                const newScrollTop = (currentScrollPercentage / 100) * newScrollHeight;
                                
                                readerContent.scrollTo({
                                    top: newScrollTop,
                                    behavior: "auto"
                                });

                                // Update progress bar and handle to match new position
                                const percentage = Math.min(100, Math.max(0, Math.round(currentScrollPercentage)));
                                
                                const progressBar = document.getElementById("progress-bar");
                                if (progressBar) {
                                    progressBar.style.width = `${percentage}%`;
                                }

                                const progressHandle = document.getElementById("progress-handle");
                                if (progressHandle) {
                                    progressHandle.style.left = `${percentage}%`;
                                }

                                // Update tooltip
                                const tooltipPosition = document.getElementById("tooltip-position");
                                if (tooltipPosition) {
                                    tooltipPosition.textContent = `${Math.round(percentage)}%`;
                                }
                            }
                        }, 100); // Small delay to allow layout to complete

                    } catch (error) {
                        console.error("Error exiting fullscreen:", error);
                        readerContainer.classList.remove("fullscreen");
                    }
                };

                exitFullscreen();
            }
        });

        // Update button when fullscreen state changes (backup handler)
        document.addEventListener("fullscreenchange", () => {
            // Small delay to ensure layout is stable
            setTimeout(() => {
                if (document.fullscreenElement) {
                    readerContainer.classList.add("fullscreen");
                } else {
                    readerContainer.classList.remove("fullscreen");
                }
                
                // Trigger a scroll event to update progress indicators
                const readerContent = document.getElementById("reader-content");
                if (readerContent) {
                    handleScroll();
                }
            }, 50);
        });

        // Also listen for other fullscreen change events for cross-browser compatibility
        ["webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"].forEach(eventType => {
            document.addEventListener(eventType, () => {
                setTimeout(() => {
                    const isFullscreen = !!(
                        document.fullscreenElement ||
                        (document as any).webkitFullscreenElement ||
                        (document as any).mozFullScreenElement ||
                        (document as any).msFullscreenElement
                    );
                    
                    if (isFullscreen) {
                        readerContainer.classList.add("fullscreen");
                    } else {
                        readerContainer.classList.remove("fullscreen");
                    }
                    
                    // Trigger a scroll event to update progress indicators
                    const readerContent = document.getElementById("reader-content");
                    if (readerContent) {
                        handleScroll();
                    }
                }, 50);
            });
        });

    } catch (error) {
        console.error("Error setting up fullscreen button:", error);
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

            // Clean up touch event listeners
            document.removeEventListener(
                "touchend",
                () => {}
            );
            document.removeEventListener(
                "touchcancel",
                () => {}
            );
            window.removeEventListener("blur", () => {});
            window.removeEventListener(
                "visibilitychange",
                () => {}
            );

            // Clean up font size button listener
            const fontSizeBtn =
                document.getElementById("font-size-btn");
            if (fontSizeBtn) {
                fontSizeBtn.removeEventListener(
                    "click",
                    () => {}
                );
            }

            // Clean up fullscreen button listener
            const fullscreenBtn = document.getElementById(
                "fullscreen-btn"
            );
            if (fullscreenBtn) {
                fullscreenBtn.removeEventListener(
                    "click",
                    () => {}
                );
            }

            // Clean up fullscreen change listener
            document.removeEventListener(
                "fullscreenchange",
                () => {}
            );

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
