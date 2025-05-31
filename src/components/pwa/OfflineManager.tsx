"use client";

import { Button } from "@/components/ui/button";
import {
    STORES,
    calculateStorageSize,
    initializeOfflineDB,
    verifyStoreExists,
} from "@/lib/db/indexeddb";
import { IDBPDatabase } from "idb";
import {
    CheckCircle,
    Download,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
            !verifyStoreExists(db, STORES.IMAGES) ||
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

        // Download each page
        let downloadedPages = 0;
        let failedPages = 0;

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

                // Convert to blob
                const blob = await imageResponse.blob();

                // Store in IndexedDB
                const imageKey = `${volumeId}_page_${page.pageNumber}`;
                await db.put(STORES.IMAGES, {
                    id: imageKey,
                    volumeId,
                    pageNumber: page.pageNumber,
                    blob,
                    textBlocks: page.textBlocks || [],
                });

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

        if (failedPages > 0) {
            console.warn(
                `Failed to download ${failedPages} pages`
            );
        }

        // Record the download
        const size = await calculateStorageSize(
            db,
            STORES.IMAGES,
            volumeId
        );
        await db.put(STORES.DOWNLOADS, {
            id: key,
            contentId,
            contentTitle,
            contentType,
            volumeId,
            volumeNumber,
            volumeTitle,
            size,
            downloadDate: new Date(),
            pageCount: totalPages,
            downloadedPages,
        });
    };

    const downloadEpubVolume = async (key: string) => {
        if (
            !db ||
            !verifyStoreExists(db, STORES.EPUBS) ||
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

        // Store in IndexedDB
        await db.put(STORES.EPUBS, {
            id: volumeId,
            contentId,
            volumeNumber,
            blob,
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
            size: blob.size,
            downloadDate: new Date(),
        });

        setDownloadProgress(100);
    };

    const removeDownload = async () => {
        if (!db) return;

        try {
            const key = `${contentId}_${volumeId}`;

            // Delete the download record if it exists
            if (verifyStoreExists(db, STORES.DOWNLOADS)) {
                await db.delete(STORES.DOWNLOADS, key);
            }

            // Delete associated data
            if (
                contentType === "manga" &&
                verifyStoreExists(db, STORES.IMAGES)
            ) {
                // Delete all page images for this volume
                try {
                    const tx = db.transaction(
                        STORES.IMAGES,
                        "readwrite"
                    );
                    const store = tx.objectStore(
                        STORES.IMAGES
                    );
                    const keys = await store.getAllKeys();

                    for (const key of keys) {
                        if (
                            typeof key === "string" &&
                            key.startsWith(volumeId)
                        ) {
                            await store.delete(key);
                        }
                    }

                    await tx.done;
                } catch (error) {
                    console.error(
                        "Error deleting images:",
                        error
                    );
                }
            } else if (
                verifyStoreExists(db, STORES.EPUBS)
            ) {
                // Delete EPUB file
                try {
                    await db.delete(STORES.EPUBS, volumeId);
                } catch (error) {
                    console.error(
                        "Error deleting EPUB:",
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
