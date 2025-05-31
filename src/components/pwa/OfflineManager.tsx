"use client";

import { Button } from "@/components/ui/button";
import {
    STORES,
    initializeOfflineDB,
    verifyStoreExists,
} from "@/lib/db/indexeddb";
import { IDBPDatabase } from "idb";
import JSZip from "jszip";
import {
    CheckCircle,
    Download,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseStringPromise } from "xml2js";

interface OfflineManagerProps {
    contentId: string;
    contentTitle: string;
    contentType: "manga" | "lightnovel";
    volumeId: string;
    volumeNumber: number;
    volumeTitle: string;
}

export function OfflineManager({
    contentId,
    contentTitle,
    contentType,
    volumeId,
    volumeNumber,
    volumeTitle,
}: OfflineManagerProps) {
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isDownloading, setIsDownloading] =
        useState(false);
    const [downloadProgress, setDownloadProgress] =
        useState(0);
    const [db, setDb] = useState<IDBPDatabase | null>(null);
    const [dbError, setDbError] = useState(false);

    // Initialize IndexedDB
    useEffect(() => {
        let isMounted = true;

        const initDB = async () => {
            try {
                // Open the database with a schema upgrade function
                const database =
                    await initializeOfflineDB();

                // Verify all required stores exist
                const requiredStores = [
                    STORES.DOWNLOADS,
                    STORES.IMAGES,
                    STORES.EPUBS,
                ];
                const missingStores = requiredStores.filter(
                    (store) =>
                        !database.objectStoreNames.contains(
                            store
                        )
                );

                if (missingStores.length > 0) {
                    throw new Error(
                        `Missing required object stores: ${missingStores.join(
                            ", "
                        )}`
                    );
                }

                if (isMounted) {
                    setDb(database);

                    try {
                        const key = `${contentId}_${volumeId}`;
                        const downloaded =
                            await database.get(
                                STORES.DOWNLOADS,
                                key
                            );
                        if (isMounted) {
                            setIsDownloaded(!!downloaded);
                        }
                    } catch (error) {
                        console.warn(
                            "Error checking download status:",
                            error
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "Error initializing IndexedDB:",
                    error
                );
                if (isMounted) {
                    setDbError(true);
                    toast.error(
                        "Failed to initialize offline storage"
                    );
                }
            }
        };

        initDB();

        // Cleanup function
        return () => {
            isMounted = false;
            if (db) {
                db.close();
            }
        };
    }, [contentId, volumeId]);

    const downloadContent = async () => {
        if (!db) {
            toast.error("Offline storage not available");
            return;
        }

        // Verify all required stores exist
        const requiredStores = [
            STORES.DOWNLOADS,
            contentType === "manga"
                ? STORES.IMAGES
                : STORES.EPUBS,
        ];
        const missingStores = requiredStores.filter(
            (store) => !verifyStoreExists(db, store)
        );

        if (missingStores.length > 0) {
            toast.error(
                `Database missing required stores: ${missingStores.join(
                    ", "
                )}`
            );
            return;
        }

        try {
            setIsDownloading(true);
            setDownloadProgress(0);

            // Create a record in the downloads store
            const key = `${contentId}_${volumeId}`;

            if (contentType === "manga") {
                // For manga: Download all page images
                await downloadMangaVolume(key);
            } else {
                // For light novels: Download the EPUB file
                await downloadEpubVolume(key);
            }

            // Mark as downloaded
            setIsDownloaded(true);
            setIsDownloading(false);
            toast.success(
                `${volumeTitle} downloaded for offline reading`
            );
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download content");
            setIsDownloading(false);
        }
    };

    const downloadMangaVolume = async (key: string) => {
        if (
            !db ||
            !verifyStoreExists(db, STORES.HTML) ||
            !verifyStoreExists(db, STORES.DOWNLOADS)
        ) {
            throw new Error(
                "Required database stores not available"
            );
        }

        // Fetch volume pages
        const response = await fetch(
            `/api/pages?volumeId=${volumeId}`
        );
        if (!response.ok)
            throw new Error("Failed to fetch pages");

        const pages = await response.json();
        const totalPages = pages.length;

        if (totalPages === 0) {
            throw new Error(
                "No pages found for this volume"
            );
        }

        // Fetch the mokuro HTML file
        const mokuroHtmlResponse = await fetch(
            `/api/mokuro-html?volumeId=${volumeId}`
        );

        let mokuroHtml = "";
        let hasHtmlFile = false;

        if (mokuroHtmlResponse.ok) {
            mokuroHtml = await mokuroHtmlResponse.text();
            hasHtmlFile = true;
        } else {
            throw new Error(
                "Failed to fetch Mokuro HTML file"
            );
        }

        // Download each page and create a map of page numbers to data URLs
        let downloadedPages = 0;
        let failedPages = 0;
        const pageDataUrls = new Map(); // Map of page numbers to data URLs

        for (const page of pages) {
            try {
                // Fetch the image
                const imageResponse = await fetch(
                    page.imagePath
                );
                if (!imageResponse.ok) {
                    failedPages++;
                    continue;
                }

                // Convert to blob and then to data URL
                const blob = await imageResponse.blob();
                const reader = new FileReader();
                const dataUrl = await new Promise<string>(
                    (resolve) => {
                        reader.onloadend = () =>
                            resolve(
                                reader.result as string
                            );
                        reader.readAsDataURL(blob);
                    }
                );

                // Store the data URL by page number for structured replacement
                pageDataUrls.set(page.pageNumber, dataUrl);

                // Update progress
                downloadedPages++;
                setDownloadProgress(
                    Math.round(
                        (downloadedPages / totalPages) * 100
                    )
                );
            } catch (error) {
                failedPages++;
                console.error(
                    `Error downloading page ${page.pageNumber}:`,
                    error
                );
            }
        }

        if (downloadedPages === 0) {
            throw new Error("Failed to download any pages");
        }

        // Process HTML if we have the mokuro HTML file
        if (hasHtmlFile) {
            let processedHtml = mokuroHtml;

            // Process each page by its specific ID and replace background-image
            for (const page of pages) {
                if (pageDataUrls.has(page.pageNumber)) {
                    const dataUrl = pageDataUrls.get(
                        page.pageNumber
                    );

                    // Create a regex to target the specific page container
                    // This matches: <div id="pageX" class="page"><div class="pageContainer" style="...background-image:url(...)...">
                    const htmlPageId = page.pageNumber - 1;
                    const pagePattern = new RegExp(
                        `(<div id="page${htmlPageId}"[^>]*class="page"[^>]*>\\s*<div class="pageContainer"[^>]*style="[^"]*)(background-image:url\\(&quot;[^&]*&quot;\\))([^"]*"[^>]*>)`,
                        "gs"
                    );

                    console.log(
                        `Processing page ${page.pageNumber}`
                    );

                    processedHtml = processedHtml.replace(
                        pagePattern,
                        (
                            match,
                            beforeBg,
                            bgImagePart,
                            afterBg
                        ) => {
                            console.log(
                                `Replacing background image for page ${page.pageNumber}`
                            );
                            return `${beforeBg}background-image:url(&quot;${dataUrl}&quot;)${afterBg}`;
                        }
                    );
                }
            }

            // Store the processed HTML
            await db.put(STORES.HTML, {
                id: volumeId,
                contentType: "manga",
                html: processedHtml,
            });
        }

        if (failedPages > 0) {
            console.warn(
                `Failed to download ${failedPages} pages`
            );
        }

        // Record the download
        await db.put(STORES.DOWNLOADS, {
            id: key,
            contentId,
            contentTitle,
            contentType,
            volumeId,
            volumeNumber,
            volumeTitle,
            downloadDate: new Date(),
            pageCount: totalPages,
            downloadedPages,
            hasProcessedHtml: hasHtmlFile,
        });
    };

    const downloadEpubVolume = async (key: string) => {
        if (
            !db ||
            !verifyStoreExists(db, STORES.HTML) ||
            !verifyStoreExists(db, STORES.DOWNLOADS)
        ) {
            throw new Error(
                "Required database stores not available"
            );
        }

        // Fetch the EPUB file
        const epubUrl = `/api/epub?contentId=${contentId}&volumeNumber=${volumeNumber}`;
        const response = await fetch(epubUrl);
        if (!response.ok)
            throw new Error("Failed to fetch EPUB");

        // Get the EPUB as blob
        const blob = await response.blob();

        // Process EPUB content
        setDownloadProgress(30);

        try {
            // Convert blob to ArrayBuffer for processing
            const arrayBuffer = await blob.arrayBuffer();

            // Process EPUB to HTML
            const processedHtml = await processEpubToHtml(
                arrayBuffer
            );

            setDownloadProgress(80);

            // Store the processed HTML
            await db.put(STORES.HTML, {
                id: volumeId,
                contentType: "lightnovel",
                html: processedHtml,
            });

            // Record the download
            await db.put(STORES.DOWNLOADS, {
                id: key,
                contentId,
                contentTitle,
                contentType,
                volumeId,
                volumeNumber,
                volumeTitle,
                downloadDate: new Date(),
                hasProcessedHtml: true,
            });

            setDownloadProgress(100);
        } catch (error: unknown) {
            console.error("Error processing EPUB:", error);
            throw new Error(
                `Failed to process EPUB: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    };

    // Process EPUB to HTML with embedded images
    const processEpubToHtml = async (
        epubData: ArrayBuffer
    ): Promise<string> => {
        // Load the EPUB file using JSZip
        const zip = new JSZip();
        const epubZip = await zip.loadAsync(epubData);

        // Find the container.xml file
        const containerXml = await epubZip
            .file("META-INF/container.xml")
            ?.async("text");

        if (!containerXml) {
            throw new Error(
                "Invalid EPUB: container.xml not found"
            );
        }

        // Parse container.xml to find the OPF path
        const containerData = await parseStringPromise(
            containerXml
        );
        const opfPath =
            containerData.container.rootfiles[0].rootfile[0]
                .$["full-path"];

        // Read the OPF file
        const opfContent = await epubZip
            .file(opfPath)
            ?.async("text");

        if (!opfContent) {
            throw new Error(
                "Invalid EPUB: OPF file not found"
            );
        }

        // Parse the OPF file
        const opfData = await parseStringPromise(
            opfContent
        );
        const manifest = opfData.package.manifest[0].item;
        const spine = opfData.package.spine[0].itemref;

        // Get the base directory for resolving relative paths
        const basePath = opfPath
            .split("/")
            .slice(0, -1)
            .join("/");
        const basePathPrefix = basePath
            ? `${basePath}/`
            : "";

        interface ManifestItem {
            id: string;
            href: string;
            "media-type": string;
        }

        // Create a map of all manifest items
        const manifestMap = manifest.reduce(
            (
                acc: Record<string, ManifestItem>,
                item: { $: ManifestItem }
            ) => {
                acc[item.$.id] = item.$;
                return acc;
            },
            {}
        );

        // Extract all HTML content in spine order
        let allContent = "";
        const imageMap: Record<string, string> = {};

        // Find all image items in the manifest
        const imageItems = manifest.filter(
            (item: { $: ManifestItem }) => {
                return (
                    item.$ &&
                    item.$["media-type"] &&
                    item.$["media-type"].startsWith(
                        "image/"
                    )
                );
            }
        );

        // Process images and convert to data URLs
        for (const itemObj of imageItems) {
            const item = itemObj.$;
            try {
                // Normalize the image path
                const imagePath = `${basePathPrefix}${item.href}`;

                // Generate a list of possible paths for this image
                const fileName =
                    item.href.split("/").pop() || "";
                const possiblePaths = [
                    imagePath,
                    item.href,
                    fileName,
                    `images/${fileName}`,
                    `Images/${fileName}`,
                    `OEBPS/images/${fileName}`,
                    `OEBPS/Images/${fileName}`,
                ];

                let imageFile = null;
                for (const path of possiblePaths) {
                    imageFile = epubZip.file(path);
                    if (imageFile) break;
                }

                if (imageFile) {
                    const imageData = await imageFile.async(
                        "base64"
                    );
                    const mimeType =
                        item["media-type"] || "image/jpeg";
                    const dataUrl = `data:${mimeType};base64,${imageData}`;

                    // Store image with multiple possible paths for better lookup
                    for (const path of possiblePaths) {
                        imageMap[path] = dataUrl;
                    }
                    imageMap[fileName] = dataUrl;
                }
            } catch (err) {
                console.warn(
                    `Failed to process image: ${item.href}`,
                    err
                );
            }
        }

        // Process HTML content
        const spineItems = spine.map(
            (item: { $: { idref: string } }) => item.$.idref
        );

        for (const itemId of spineItems) {
            const item = manifestMap[itemId];
            if (!item || !item.href) continue;

            // Get the chapter content
            const chapterPath = `${basePathPrefix}${item.href}`;
            let chapterContent =
                (await epubZip
                    .file(chapterPath)
                    ?.async("text")) || "";

            if (chapterContent) {
                // Process the HTML to replace image sources with data URLs
                const imgRegex =
                    /<img[^>]*src=["']([^"']*)["'][^>]*>/gi;
                const svgRegex =
                    /<image[^>]*xlink:href=["']([^"']*)["'][^>]*>/gi;

                // Replace image references with data URLs
                chapterContent = chapterContent.replace(
                    imgRegex,
                    (match, src) => {
                        // Try to find the image in our map
                        const fileName =
                            src.split("/").pop() || "";
                        const possiblePaths = [
                            src,
                            fileName,
                            `images/${fileName}`,
                            `Images/${fileName}`,
                        ];

                        // Try each possible path
                        for (const path of possiblePaths) {
                            if (imageMap[path]) {
                                return match.replace(
                                    src,
                                    imageMap[path]
                                );
                            }
                        }

                        return match; // Keep original if not found
                    }
                );

                // Also handle SVG images
                chapterContent = chapterContent.replace(
                    svgRegex,
                    (match, href) => {
                        const fileName =
                            href.split("/").pop() || "";
                        if (
                            imageMap[href] ||
                            imageMap[fileName]
                        ) {
                            return match.replace(
                                href,
                                imageMap[href] ||
                                    imageMap[fileName] ||
                                    ""
                            );
                        }
                        return match;
                    }
                );

                allContent += `<div class="chapter" data-chapter-id="${item.id}">${chapterContent}</div>`;
            }
        }

        // Extract just the body content from each chapter
        const bodyContentRegex =
            /<body[^>]*>([\s\S]*?)<\/body>/gi;
        let bodyContent = "";
        let match;

        while (
            (match = bodyContentRegex.exec(allContent)) !==
            null
        ) {
            bodyContent += match[1];
        }

        // If we couldn't extract body content, use all content
        if (!bodyContent) {
            bodyContent = allContent;
        }

        // Create the final HTML with styles
        const finalHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${volumeTitle} - Offline Reader</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        margin: 0;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                        background-color: #0f172a;
                        color: #e2e8f0;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                    }
                    .chapter {
                        margin-bottom: 2rem;
                        padding-bottom: 2rem;
                        border-bottom: 1px solid #334155;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        color: #3b82f6;
                    }
                </style>
            </head>
            <body>
                <div id="reader-container">
                    ${bodyContent}
                </div>
            </body>
            </html>
        `;

        return finalHtml;
    };

    const removeDownload = async () => {
        if (!db) return;

        try {
            const key = `${contentId}_${volumeId}`;

            // Delete the download record if it exists
            if (verifyStoreExists(db, STORES.DOWNLOADS)) {
                await db.delete(STORES.DOWNLOADS, key);
            }

            // Delete HTML content
            if (verifyStoreExists(db, STORES.HTML)) {
                try {
                    await db.delete(STORES.HTML, volumeId);
                } catch (error) {
                    console.error(
                        "Error deleting HTML:",
                        error
                    );
                }
            }

            setIsDownloaded(false);
            toast.success(
                `${volumeTitle} removed from offline storage`
            );
        } catch (error) {
            console.error(
                "Error removing download:",
                error
            );
            toast.error("Failed to remove download");
        }
    };

    // If there was a database error, don't show anything to avoid disrupting the UI
    if (dbError) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {isDownloaded ? (
                <Button
                    onClick={removeDownload}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Trash2 size={16} />
                    <span>Remove Download</span>
                </Button>
            ) : isDownloading ? (
                <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{
                                width: `${downloadProgress}%`,
                            }}
                        />
                    </div>
                    <span className="text-sm">
                        {downloadProgress}%
                    </span>
                </div>
            ) : (
                <Button
                    onClick={downloadContent}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Download size={16} />
                    <span>Download for Offline</span>
                </Button>
            )}

            {isDownloaded && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle size={16} />
                    <span className="text-sm">
                        Available Offline
                    </span>
                </div>
            )}
        </div>
    );
}
