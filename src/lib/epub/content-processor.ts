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

    return `<div class="chapter" data-chapter-id="${chapter.id}">${processedContent}</div>`;
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

    return content.replace(linkRegex, (match, href) => {
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

        // For other internal links, prevent navigation
        return match.replace(href, "javascript:void(0)");
    });
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
    signal: AbortSignal
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
            reject(new Error("Processing aborted"));
            return;
        }

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
                    "scheduler" in window &&
                    "postTask" in (window as any).scheduler
                ) {
                    (window as any).scheduler.postTask(
                        processNextChunk,
                        {
                            priority: "background",
                        }
                    );
                } else if (
                    "requestIdleCallback" in window
                ) {
                    requestIdleCallback(processNextChunk);
                } else {
                    setTimeout(processNextChunk, 0);
                }
            } else {
                resolve(processedContent);
            }
        };

        if ("requestIdleCallback" in window) {
            requestIdleCallback(() => processNextChunk());
        } else {
            setTimeout(() => processNextChunk(), 0);
        }
    });
}
