import { EpubChapter } from "@/components/reader/epub/types";

/**
 * Process chapter HTML content to replace image sources with data URLs,
 * fix relative links, etc.
 */
export function processChapterContent(
    chapter: EpubChapter,
    imageMap: Record<string, string>,
    basePath: string
): string {
    if (!chapter.content) return "";

    let processedContent = chapter.content;

    // Replace image sources with data URLs
    processedContent = replaceImageSources(
        processedContent,
        imageMap,
        chapter.href,
        basePath
    );

    // Replace SVG image references
    processedContent = replaceSvgImages(
        processedContent,
        imageMap,
        chapter.href,
        basePath
    );

    // Fix internal links
    processedContent = fixInternalLinks(processedContent);

    return `<div class="chapter" data-chapter-id="${chapter.id}" id="chapter-${chapter.id}">${processedContent}</div>`;
}

/**
 * Replace image sources with data URLs
 */
function replaceImageSources(
    content: string,
    imageMap: Record<string, string>,
    chapterHref: string,
    basePath: string
): string {
    // Match img tags with src attributes
    const imgRegex =
        /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;

    return content.replace(imgRegex, (match, src) => {
        // Resolve relative path
        const resolvedSrc = resolveRelativePath(
            src,
            chapterHref,
            basePath
        );

        // Try to find the image in our image map
        const dataUrl = findImageInMap(
            resolvedSrc,
            imageMap
        );

        if (dataUrl) {
            return match.replace(src, dataUrl);
        }

        // If not found, replace with a placeholder
        const fileName = src.split("/").pop() || src;
        return `<div class="missing-image">Image not found: ${fileName}</div>`;
    });
}

/**
 * Replace SVG image references with data URLs
 */
function replaceSvgImages(
    content: string,
    imageMap: Record<string, string>,
    chapterHref: string,
    basePath: string
): string {
    // Match SVG image elements with xlink:href attributes
    const svgRegex =
        /<image[^>]*xlink:href=["']([^"']*)["'][^>]*>/gi;

    return content.replace(svgRegex, (match, href) => {
        // Resolve relative path
        const resolvedHref = resolveRelativePath(
            href,
            chapterHref,
            basePath
        );

        // Try to find the image in our image map
        const dataUrl = findImageInMap(
            resolvedHref,
            imageMap
        );

        if (dataUrl) {
            return match.replace(href, dataUrl);
        }

        // Keep original if not found
        return match;
    });
}

/**
 * Resolve a relative path based on chapter location
 */
function resolveRelativePath(
    path: string,
    chapterHref: string,
    basePath: string
): string {
    // If it's not a relative path, return as is
    if (!path.startsWith("../") && !path.startsWith("./")) {
        return path;
    }

    // Get the chapter directory
    const chapterDir = chapterHref
        .split("/")
        .slice(0, -1)
        .join("/");

    if (path.startsWith("../")) {
        // Get the parent directory
        const parentDir = chapterDir
            .split("/")
            .slice(0, -1)
            .join("/");
        // Use basePath if needed for resolving
        const resolvedBase = basePath ? `${basePath}/` : "";
        return path.replace(
            /^\.\.\//,
            `${parentDir ? parentDir + "/" : resolvedBase}`
        );
    }

    if (path.startsWith("./")) {
        return path.replace(
            /^\.\//,
            `${chapterDir ? chapterDir + "/" : ""}`
        );
    }

    return path;
}

/**
 * Find an image in the image map, trying various possible paths
 */
function findImageInMap(
    path: string,
    imageMap: Record<string, string>
): string | null {
    // Direct match
    if (imageMap[path]) {
        return imageMap[path];
    }

    // Try just the filename
    const fileName = path.split("/").pop() || "";
    if (imageMap[fileName]) {
        return imageMap[fileName];
    }

    // Try common directories
    const commonPaths = [
        `images/${fileName}`,
        `Images/${fileName}`,
        `OEBPS/images/${fileName}`,
        `OEBPS/Images/${fileName}`,
        `OEBPS/${fileName}`,
    ];

    for (const tryPath of commonPaths) {
        if (imageMap[tryPath]) {
            return imageMap[tryPath];
        }
    }

    return null;
}

/**
 * Fix internal links to prevent navigation issues
 */
function fixInternalLinks(content: string): string {
    // Match anchor tags with href attributes
    const linkRegex =
        /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;

    // First replace anchor links
    let processedContent = content.replace(
        linkRegex,
        (match, href) => {
            // If it's an external link, leave it alone
            if (
                href.startsWith("http://") ||
                href.startsWith("https://")
            ) {
                return match;
            }

            // If it's an internal link with a hash, convert to anchor link
            if (href.includes("#")) {
                const hashPart = href.split("#")[1];
                return match.replace(href, `#${hashPart}`);
            }

            // Skip CSS files - don't attempt to load them
            if (
                href.endsWith(".css") ||
                href.toLowerCase().includes("/css/") ||
                href.toLowerCase().includes("/styles/")
            ) {
                return match.replace(
                    href,
                    "javascript:void(0)"
                );
            }

            // For other internal links, prevent navigation
            return match.replace(
                href,
                "javascript:void(0)"
            );
        }
    );

    // Now remove all link tags that reference CSS files
    const cssLinkRegex =
        /<link[^>]*href=["']([^"']*)["'][^>]*>/gi;
    processedContent = processedContent.replace(
        cssLinkRegex,
        (match, href) => {
            // If it's a CSS file, remove the entire link tag
            if (
                href.endsWith(".css") ||
                href.toLowerCase().includes("/css/") ||
                href.toLowerCase().includes("/styles/")
            ) {
                return ""; // Remove the link tag completely
            }
            return match; // Keep other link tags
        }
    );

    return processedContent;
}

/**
 * Extract body content from HTML
 */
export function extractBodyContent(html: string): string {
    const bodyContentRegex =
        /<body[^>]*>([\s\S]*?)<\/body>/gi;
    let bodyContent = "";
    let match;

    while ((match = bodyContentRegex.exec(html)) !== null) {
        bodyContent += match[1];
    }

    // If we couldn't extract body content, use all content
    return bodyContent || html;
}

/**
 * Process content in chunks for better performance
 */
export async function processContentInChunks(
    content: string,
    signal: AbortSignal,
    initialPosition: number = 0
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
            reject(new Error("Processing aborted"));
            return;
        }

        // Add modern reader UI wrapper and styles
        const readerStyles = `
        <style>
            /* Reader reset and base styles */
            html {
                font-size: 100%;
            }
            
            body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                width: 100%;
                height: 100%;
            }
            
            .litera-reader {
                --primary-color: #3498db;
                --secondary-color: #2980b9;
                --background-color: #0f1117;
                --text-color: #e6e6e6;
                --border-color: #333;
                --progress-bg: rgba(255, 255, 255, 0.1);
                --progress-fill: rgba(52, 152, 219, 0.8);
                --sidebar-bg: #161a24;
                --sidebar-text: #ddd;
                --highlight-color: #e74c3c;

                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background-color: var(--background-color);
                color: var(--text-color);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                line-height: 1.6;
                overflow: hidden;
                position: relative;
                font-size: 16px;
            }

            /* Header */
            .reader-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                background-color: rgba(15, 17, 23, 0.95);
                backdrop-filter: blur(10px);
                z-index: 10;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                min-height: 48px;
            }
            
            .reader-header-left {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                max-width: 70%;
                overflow: hidden;
            }

            .reader-title {
                font-size: 1rem;
                font-weight: 500;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 44px); /* Ensure space for back button */
            }

            .reader-controls {
                display: flex;
                align-items: center;
                min-width: 44px; /* Ensure minimum width for TOC button */
            }

            .reader-btn {
                background: none;
                border: none;
                color: var(--text-color);
                cursor: pointer;
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                min-width: 44px; /* Minimum touch target size */
                min-height: 44px;
                padding: 0;
                margin: 0;
            }

            .reader-btn:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .reader-btn:active {
                background-color: rgba(255, 255, 255, 0.2);
            }

            /* Content area */
            .reader-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0;
                position: relative;
                scroll-behavior: auto; /* Changed from smooth to auto for better position restoration */
                width: 100%;
                -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
            }

            .reader-content-inner {
                padding: 1.5rem;
                max-width: 800px;
                margin: 0 auto;
            }

            /* Progress bar */
            .reader-progress-container {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--progress-bg);
                z-index: 100;
            }

            .reader-progress-bar {
                height: 100%;
                width: 0%;
                background: var(--progress-fill);
                transition: width 0.3s ease;
            }

            .reader-progress-info {
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                z-index: 100;
            }

            .reader-progress-info.active {
                opacity: 1;
            }

            /* Sidebar */
            .reader-sidebar {
                position: absolute;
                top: 0;
                left: -300px;
                width: 300px;
                height: 100%;
                background-color: var(--sidebar-bg);
                transition: left 0.3s ease;
                z-index: 1000;
                overflow-y: auto;
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
            }

            .reader-sidebar.active {
                left: 0;
            }

            .sidebar-header {
                padding: 1.25rem;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sidebar-title {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 500;
            }

            .sidebar-close {
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 1.8rem;
                cursor: pointer;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                background-color: rgba(255, 255, 255, 0.05);
            }

            .sidebar-close:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .sidebar-close:active {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .toc-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .toc-item {
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                cursor: pointer;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                font-size: 1.1rem;
                min-height: 44px;
            }

            .toc-item:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }

            .toc-item:active {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .toc-item.active {
                background-color: rgba(52, 152, 219, 0.2);
                border-left: 3px solid var(--primary-color);
            }

            /* Overlay for sidebar */
            .sidebar-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 999;
                display: none;
            }

            .sidebar-overlay.active {
                display: block;
            }

            /* Content styling */
            .chapter {
                width: 100%;
                font-size: 1.2rem;
                line-height: 1.7;
            }

            .chapter p {
                margin-bottom: 1.2rem;
            }

            .chapter img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1rem auto;
            }

            /* Lazy loading indicators */
            .chapter-loading {
                padding: 2rem;
                text-align: center;
                color: var(--text-color);
            }

            .chapter-loading-spinner {
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                border-top-color: var(--primary-color);
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Mobile styles - Tablet */
            @media (max-width: 768px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 1.2rem;
                    max-width: 100%;
                }

                .chapter {
                    font-size: 1.2rem;
                    line-height: 1.7;
                }

                .reader-header {
                    padding: 0.75rem 1rem;
                }

                .reader-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 1.3rem;
                }

                .reader-controls {
                    gap: 0.75rem;
                }

                .reader-title {
                    max-width: calc(100% - 44px);
                    font-size: 1.1rem;
                }
                
                .reader-sidebar {
                    width: 85%;
                    left: -85%;
                }
            }

            /* Mobile styles - Phone */
            @media (max-width: 480px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 1rem;
                    max-width: 100%;
                    width: 100%;
                }
                
                .chapter {
                    font-size: 1.25rem;
                    line-height: 1.7;
                    width: 100%;
                }
                
                .chapter p {
                    margin-bottom: 1.4rem;
                    width: 100%;
                }
                
                .chapter h1 {
                    font-size: 1.8rem;
                }
                
                .chapter h2 {
                    font-size: 1.6rem;
                }
                
                .chapter h3 {
                    font-size: 1.4rem;
                }
                
                .reader-header {
                    padding: 0.8rem 1rem;
                }
                
                .reader-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 1.3rem;
                }
                
                .reader-header-left {
                    gap: 0.7rem;
                    max-width: 75%;
                }
                
                .reader-title {
                    font-size: 1.1rem;
                }
                
                .reader-sidebar {
                    width: 90%;
                    left: -90%;
                }
                
                .toc-item {
                    padding: 1.2rem 1rem;
                    font-size: 1.2rem;
                }
            }
            
            /* Extra small phones */
            @media (max-width: 360px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 0.8rem;
                    width: 100%;
                }
                
                .chapter {
                    font-size: 1.25rem;
                    width: 100%;
                }
                
                .reader-header {
                    padding: 0.7rem 0.8rem;
                }
                
                .reader-btn {
                    width: 44px;
                    height: 44px;
                }
                
                .reader-header-left {
                    max-width: 70%;
                }
                
                .reader-title {
                    max-width: calc(100% - 44px);
                }
            }

            /* Accessibility */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }

            /* Reader content styles */
            .chapter h1, .chapter h2, .chapter h3 {
                margin-top: 1.5em;
                margin-bottom: 0.8em;
                line-height: 1.3;
            }
        </style>
        `;

        const readerUI = `
        <div class="litera-reader">
            <div class="reader-header">
                <div class="reader-header-left">
                    <button class="reader-btn" id="back-button" aria-label="Go Back">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <h1 class="reader-title" id="reader-book-title">Loading Book...</h1>
                </div>
                <div class="reader-controls">
                    <button class="reader-btn" id="toggle-toc" aria-label="Table of Contents">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 5H21M3 12H21M3 19H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="reader-content" id="reader-content">
                <div class="reader-content-inner">
                    ${content}
                    <div id="chapter-loading" class="chapter-loading" style="display: none;">
                        <div class="chapter-loading-spinner"></div>
                        <div class="chapter-loading-text">Loading next chapter...</div>
                    </div>
                </div>
            </div>
            <div class="reader-progress-container">
                <div class="reader-progress-bar" id="progress-bar"></div>
            </div>
            <div class="reader-progress-info" id="progress-info">0% of chapter</div>
            <div class="reader-sidebar" id="reader-sidebar">
                <div class="sidebar-header">
                    <h2 class="sidebar-title">Table of Contents</h2>
                    <button class="sidebar-close" id="sidebar-close">×</button>
                </div>
                <ul class="toc-list" id="toc-list"></ul>
            </div>
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
        </div>
        `;

        // Process content in smaller chunks to avoid blocking
        const CHUNK_SIZE = 50000; // Process 50KB at a time
        let processedContent = "";
        let currentIndex = 0;

        const processNextChunk = () => {
            if (signal.aborted) {
                reject(new Error("Processing aborted"));
                return;
            }

            const chunk = content.slice(
                currentIndex,
                currentIndex + CHUNK_SIZE
            );

            if (chunk) {
                processedContent += chunk;
                currentIndex += CHUNK_SIZE;

                // Use scheduler API for better performance
                if (
                    typeof window !== "undefined" &&
                    "scheduler" in window &&
                    "postTask" in
                        (
                            window as Window & {
                                scheduler: {
                                    postTask: (
                                        callback: () => void,
                                        options: {
                                            priority: string;
                                        }
                                    ) => void;
                                };
                            }
                        ).scheduler
                ) {
                    (
                        window as Window & {
                            scheduler: {
                                postTask: (
                                    callback: () => void,
                                    options: {
                                        priority: string;
                                    }
                                ) => void;
                            };
                        }
                    ).scheduler.postTask(processNextChunk, {
                        priority: "background",
                    });
                } else if (
                    typeof window !== "undefined" &&
                    "requestIdleCallback" in window
                ) {
                    requestIdleCallback(processNextChunk);
                } else {
                    setTimeout(processNextChunk, 0);
                }
            } else {
                // Add script to handle initial position
                const positionScript =
                    initialPosition > 0
                        ? `
                <script>
                    // Function to restore position
                    function restorePosition(position) {
                        const readerContent = document.getElementById('reader-content');
                        if (!readerContent) return;
                        
                        // Calculate scroll position
                        const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                        const targetPosition = (${initialPosition} / 100) * scrollHeight;
                        
                        console.log('Setting initial position to ${initialPosition}%, scrollHeight:', scrollHeight, 'targetPosition:', targetPosition);
                        
                        // Force scroll to position - use both methods for compatibility
                        readerContent.scrollTo(0, targetPosition);
                        readerContent.scrollTop = targetPosition;
                        
                        // Update progress bar
                        const progressBar = document.getElementById('progress-bar');
                        if (progressBar) {
                            progressBar.style.width = '${initialPosition}%';
                        }
                    }
                    
                    // Try multiple times with increasing delays to ensure content is fully loaded
                    function attemptRestore(attempts = 0) {
                        if (attempts > 10) return; // Give up after 10 attempts
                        
                        const readerContent = document.getElementById('reader-content');
                        if (!readerContent) return setTimeout(() => attemptRestore(attempts + 1), 100);
                        
                        // Check if content has height
                        if (readerContent.scrollHeight <= readerContent.clientHeight) {
                            // Content not fully loaded yet, try again
                            console.log('Content not fully loaded yet, trying again...');
                            setTimeout(() => attemptRestore(attempts + 1), 200 * (attempts + 1));
                            return;
                        }
                        
                        // Content has height, restore position
                        restorePosition(${initialPosition});
                        
                        // Double-check position after a short delay
                        setTimeout(() => {
                            const currentPos = readerContent.scrollTop;
                            if (currentPos < 10 && ${initialPosition} > 10) {
                                console.log('Position restoration failed, trying again...');
                                restorePosition(${initialPosition});
                            }
                        }, 500);
                    }
                    
                    // Start attempting to restore position
                    document.addEventListener('DOMContentLoaded', function() {
                        // Add more responsive scroll position tracking
                        const readerContent = document.getElementById('reader-content');
                        const progressBar = document.getElementById('progress-bar');
                        const progressInfo = document.getElementById('progress-info');
                        
                        if (readerContent) {
                            let scrollTimeout;
                            
                            readerContent.addEventListener('scroll', function() {
                                // Clear previous timeout to implement debouncing
                                if (scrollTimeout) {
                                    clearTimeout(scrollTimeout);
                                }
                                
                                // Calculate current position
                                const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                const scrollPosition = readerContent.scrollTop;
                                const percentage = Math.round((scrollPosition / scrollHeight) * 100);
                                
                                // Update progress bar immediately for better visual feedback
                                if (progressBar) {
                                    progressBar.style.width = percentage + '%';
                                }
                                
                                // Show progress info with current percentage
                                if (progressInfo) {
                                    progressInfo.textContent = percentage + '% of book';
                                    progressInfo.classList.add('active');
                                    
                                    // Hide progress info after 2 seconds
                                    setTimeout(function() {
                                        progressInfo.classList.remove('active');
                                    }, 2000);
                                }
                                
                                // Debounce the position change event to avoid too many updates
                                scrollTimeout = setTimeout(function() {
                                    // Dispatch position change event for parent components
                                    const event = new CustomEvent('reader-position-change', {
                                        detail: { position: percentage }
                                    });
                                    document.dispatchEvent(event);
                                }, 200); // Reduced from longer delays for more responsive updates
                            }, { passive: true }); // Use passive event for better performance
                        }
                        
                        // Start the restoration process
                        setTimeout(() => attemptRestore(), 50);
                    });
                
                </script>
                `
                        : "";

                // Wrap the content with our reader UI with proper HTML document structure
                const finalContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    ${readerStyles}
    ${positionScript}
</head>
<body>
    ${readerUI.replace("${content}", processedContent)}
</body>
</html>
`;
                resolve(finalContent);
            }
        };

        if (
            typeof window !== "undefined" &&
            "requestIdleCallback" in window
        ) {
            requestIdleCallback(() => processNextChunk());
        } else {
            setTimeout(() => processNextChunk(), 0);
        }
    });
}
