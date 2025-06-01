"use client";

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
    Loader2,
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
    coverImage?: string;
}

export function OfflineManager({
    contentId,
    contentTitle,
    contentType,
    volumeId,
    volumeNumber,
    volumeTitle,
    coverImage,
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
                    STORES.HTML,
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
            STORES.HTML,
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

    // Add a function to convert image URL to data URL
    async function convertImageToDataUrl(
        imageUrl: string
    ): Promise<string> {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch image: ${response.status}`
                );
            }

            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () =>
                    resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error(
                "Error converting image to data URL:",
                error
            );
            return ""; // Return empty string if failed
        }
    }

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

        // Convert cover image to data URL if available
        let volumeCoverDataUrl = "";
        if (coverImage) {
            volumeCoverDataUrl =
                await convertImageToDataUrl(coverImage);
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
        let totalStorageSize = 0; // Track actual storage size

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

                // Add to total storage size (data URL includes base64 encoding overhead)
                totalStorageSize += dataUrl.length;

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

            // Add HTML size to total storage
            totalStorageSize += processedHtml.length;
        }

        if (failedPages > 0) {
            console.warn(
                `Failed to download ${failedPages} pages`
            );
        }

        // Record the download with correct storage size
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
            coverImage: volumeCoverDataUrl,
            storageSize: totalStorageSize, // Use actual calculated size
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

        // Convert cover image to data URL if available
        let volumeCoverDataUrl = "";
        if (coverImage) {
            volumeCoverDataUrl =
                await convertImageToDataUrl(coverImage);
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

            // Calculate actual HTML size (includes embedded images)
            const htmlSize = processedHtml.length;

            // Record the download with correct storage size
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
                coverImage: volumeCoverDataUrl,
                storageSize: htmlSize, // Use actual string length
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
        <div className="fixed top-4 right-4 z-50">
            {isDownloaded ? (
                // Downloaded state - show remove option
                <div className="relative group">
                    <button
                        onClick={removeDownload}
                        className="flex items-center justify-center w-8 h-8 bg-slate-900/95 hover:bg-red-600/90 border border-slate-700/50 hover:border-red-500/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm group"
                        title="Remove from offline storage"
                    >
                        <Trash2
                            size={14}
                            className="text-slate-300 group-hover:text-white transition-colors"
                        />
                    </button>
                    {/* Downloaded indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-slate-900">
                        <CheckCircle
                            size={14}
                            className="text-white"
                        />
                    </div>
                </div>
            ) : isDownloading ? (
                // Downloading state with progress
                <div className="relative">
                    {/* Progress percentage above button */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-slate-900/95 border border-slate-700/50 rounded-md shadow-lg backdrop-blur-sm">
                        <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
                            {downloadProgress}%
                        </span>
                    </div>
                    {/* Button - same size as others */}
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-900/95 border border-blue-500/50 rounded-xl shadow-lg backdrop-blur-sm">
                        <Loader2
                            size={14}
                            className="text-blue-400 animate-spin"
                        />
                    </div>
                    {/* Progress bar at bottom of button */}
                    <div className="absolute bottom-1 left-1 right-1 bg-slate-800/80 rounded-full h-1">
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300 ease-out"
                            style={{
                                width: `${Math.max(
                                    downloadProgress,
                                    4
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            ) : (
                // Download button
                <button
                    onClick={downloadContent}
                    className="flex items-center justify-center w-8 h-8 bg-slate-900/95 hover:bg-blue-600/90 border border-slate-700/50 hover:border-blue-500/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
                    title="Download for offline reading"
                >
                    <Download
                        size={14}
                        className="text-slate-300 group-hover:text-white transition-colors"
                    />
                </button>
            )}
        </div>
    );
}