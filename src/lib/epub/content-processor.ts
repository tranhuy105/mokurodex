import {
    EpubChapter,
    TocItem,
} from "@/components/reader/epub/types";
import { getScript } from "./template/script";
import { readerStyles } from "./template/style";
import { readerUIfromContent } from "./template/ui";
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

    // Remove or neutralize any viewport meta tags to prevent "view in browser mode"
    const metaViewportRegex =
        /<meta[^>]*name=["']viewport["'][^>]*>/gi;
    processedContent = processedContent.replace(
        metaViewportRegex,
        ""
    );

    // Also catch common variations of viewport tags
    const metaViewportVariationsRegex =
        /<meta[^>]*content=["'][^"']*viewport[^"']*["'][^>]*>/gi;
    processedContent = processedContent.replace(
        metaViewportVariationsRegex,
        ""
    );

    // Remove any meta tags that control width, scaling, or size
    const metaSizeRegex =
        /<meta[^>]*(width|scale|size|dpi|pixel-ratio)[^>]*>/gi;
    processedContent = processedContent.replace(
        metaSizeRegex,
        ""
    );

    // Remove or neutralize embedded style tags
    const styleTagRegex =
        /<style[^>]*>([\s\S]*?)<\/style>/gi;
    processedContent = processedContent.replace(
        styleTagRegex,
        (match, styleContent) => {
            // Keep user-scalability styles but remove anything that affects layouts
            if (
                styleContent.includes("user-scalable") ||
                styleContent.includes("text-size-adjust") ||
                styleContent.includes("viewport")
            ) {
                // Extract only the useful viewport and scaling rules
                const scalingRules = styleContent.match(
                    /([^{}]*?)(user-scalable|text-size-adjust|viewport)([^{}]*?)[:{][^{}]*?[;}]/gi
                );

                if (
                    scalingRules &&
                    scalingRules.length > 0
                ) {
                    return `<style>/* Preserved scaling rules */\n${scalingRules.join(
                        "\n"
                    )}</style>`;
                }
            }

            // Remove all other style tags
            return "";
        }
    );

    // Remove any fixed width/height inline styles that could break responsiveness
    processedContent = processedContent.replace(
        /style\s*=\s*["']([^"']*)["']/gi,
        (match, styleContent) => {
            // Remove fixed width/height but keep other styles
            const cleanedStyle = styleContent
                .replace(
                    /\b(width|height|min-width|min-height|max-width|max-height)\s*:\s*[^;]*(;|$)/gi,
                    ""
                )
                .replace(
                    /\b(position\s*:\s*fixed|position\s*:\s*absolute)\b[^;]*(;|$)/gi,
                    ""
                )
                .replace(
                    /\b(overflow(-[xy])?)\s*:\s*[^;]*(;|$)/gi,
                    ""
                )
                .trim();

            if (cleanedStyle) {
                return `style="${cleanedStyle}"`;
            } else {
                return ""; // Remove the style attribute if nothing remains
            }
        }
    );

    // Handle any mobile-specific attributes that might affect display
    processedContent = processedContent.replace(
        /\b(width|device-width|initial-scale|maximum-scale|user-scalable)\s*=/gi,
        "data-disabled-$1="
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
    initialPosition: number = 0,
    tocItems: TocItem[] = []
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
            reject(new Error("Processing aborted"));
            return;
        }

        // Add modern reader UI wrapper and styles

        const readerUI = readerUIfromContent(content);

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
                        ? getScript(initialPosition)
                        : "";

                // Add TOC data as a meta tag for the reader to use
                const tocDataMeta =
                    tocItems && tocItems.length > 0
                        ? `<meta name="toc-data" content='${JSON.stringify(
                              tocItems
                          )}'>`
                        : "";

                // Wrap the content with our reader UI with proper HTML document structure
                const finalContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    ${tocDataMeta}
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
