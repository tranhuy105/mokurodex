"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "@/components/ui/SettingsNav";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    STORES,
    initializeOfflineDB,
    verifyStoreExists,
} from "@/lib/db/indexeddb";
import { formatDistanceToNow } from "date-fns";
import { IDBPDatabase } from "idb";
import {
    Database,
    Download,
    HardDrive,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OfflineContent {
    id: string;
    contentId: string;
    contentTitle: string;
    contentType: "manga" | "lightnovel";
    volumeId: string;
    volumeNumber: number;
    volumeTitle: string;
    downloadDate: Date;
    coverImage?: string;
    storageSize?: number;
}

// Helper function to format bytes to a human-readable format
const formatBytes = (
    bytes: number,
    decimals: number = 2
) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
        parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
        " " +
        sizes[i]
    );
};

export default function OfflineSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [downloads, setDownloads] = useState<
        OfflineContent[]
    >([]);
    const [db, setDb] = useState<IDBPDatabase | null>(null);
    const [totalSize, setTotalSize] = useState<number>(0);

    console.log(downloads);

    useEffect(() => {
        const initDB = async () => {
            try {
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
                    console.warn(
                        `Missing required object stores: ${missingStores.join(
                            ", "
                        )}`
                    );
                }

                setDb(database);
                await loadDownloads(database);
            } catch (error) {
                console.error(
                    "Error initializing IndexedDB:",
                    error
                );
                toast.error(
                    "Failed to initialize offline storage"
                );
            } finally {
                setIsLoading(false);
            }
        };

        initDB();

        return () => {
            if (db) {
                db.close();
            }
        };
    }, []);

    const loadDownloads = async (
        database: IDBPDatabase
    ) => {
        try {
            // Check if the downloads store exists
            if (
                !verifyStoreExists(
                    database,
                    STORES.DOWNLOADS
                )
            ) {
                setDownloads([]);
                return;
            }

            const allDownloads = await database.getAll(
                STORES.DOWNLOADS
            );

            // Convert dates from strings to Date objects
            const processedDownloads = allDownloads.map(
                (download) => ({
                    ...download,
                    downloadDate: new Date(
                        download.downloadDate
                    ),
                })
            );

            setDownloads(processedDownloads);

            // Calculate total size
            const totalSizeCalc = processedDownloads.reduce(
                (total, item) =>
                    total + (item.storageSize || 0),
                0
            );
            setTotalSize(totalSizeCalc);
        } catch (error) {
            console.error(
                "Error loading downloads:",
                error
            );
            toast.error("Failed to load offline content");
        }
    };

    const removeDownload = async (item: OfflineContent) => {
        if (!db) return;

        try {
            // Delete the download record
            if (verifyStoreExists(db, STORES.DOWNLOADS)) {
                await db.delete(STORES.DOWNLOADS, item.id);
            }

            if (verifyStoreExists(db, STORES.HTML)) {
                try {
                    const tx = db.transaction(
                        STORES.HTML,
                        "readwrite"
                    );
                    const store = tx.objectStore(
                        STORES.HTML
                    );
                    const keys = await store.getAllKeys();

                    for (const key of keys) {
                        if (
                            typeof key === "string" &&
                            key.startsWith(item.volumeId)
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
            }

            // Refresh the downloads list
            await loadDownloads(db);
            toast.success(
                `${item.volumeTitle} removed from offline storage`
            );
        } catch (error) {
            console.error(
                "Error removing download:",
                error
            );
            toast.error("Failed to remove download");
        }
    };

    const clearAllDownloads = async () => {
        if (!db) return;

        try {
            // Clear all object stores
            if (verifyStoreExists(db, STORES.DOWNLOADS)) {
                await db.clear(STORES.DOWNLOADS);
            }

            if (verifyStoreExists(db, STORES.HTML)) {
                await db.clear(STORES.HTML);
            }

            // Refresh the downloads list
            await loadDownloads(db);
            toast.success(
                "All offline content has been removed"
            );
        } catch (error) {
            console.error(
                "Error clearing downloads:",
                error
            );
            toast.error("Failed to clear offline content");
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Offline Content"
                subtitle="Manage your downloaded content for offline reading"
            />

            <SettingsNav />

            <div className="mt-8">
                <div className="md:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5" />
                                Offline Storage
                            </CardTitle>
                            <CardDescription>
                                Manage content downloaded
                                for offline reading
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Storage Used:{" "}
                                        <span className="font-medium">
                                            {formatBytes(
                                                totalSize
                                            )}
                                        </span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Downloaded Items:{" "}
                                        <span className="font-medium">
                                            {
                                                downloads.length
                                            }
                                        </span>
                                    </p>
                                </div>

                                {downloads.length > 0 && (
                                    <Button
                                        onClick={
                                            clearAllDownloads
                                        }
                                        variant="destructive"
                                        size="sm"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="py-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Loading offline
                                        content...
                                    </p>
                                </div>
                            ) : downloads.length === 0 ? (
                                <div className="py-8 text-center border rounded-md">
                                    <Download className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="mt-2 text-muted-foreground">
                                        No offline content
                                        downloaded yet
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Visit a manga or
                                        light novel to
                                        download it for
                                        offline reading
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {downloads.map(
                                        (item) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="flex justify-between items-center p-4 border rounded-md"
                                            >
                                                <div className="flex gap-4">
                                                    {item.coverImage && (
                                                        <div className="h-16 w-12 rounded overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={
                                                                    item.coverImage
                                                                }
                                                                alt={
                                                                    item.volumeTitle
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-medium">
                                                            <Link
                                                                href={`/content/${item.contentId}`}
                                                                className="hover:underline"
                                                            >
                                                                {
                                                                    item.contentTitle
                                                                }
                                                            </Link>
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                item.volumeTitle
                                                            }{" "}
                                                            •{" "}
                                                            {item.storageSize
                                                                ? formatBytes(
                                                                      item.storageSize
                                                                  )
                                                                : "Unknown size"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Downloaded{" "}
                                                            {formatDistanceToNow(
                                                                new Date(
                                                                    item.downloadDate
                                                                ),
                                                                {
                                                                    addSuffix:
                                                                        true,
                                                                }
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        removeDownload(
                                                            item
                                                        )
                                                    }
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                About Offline Mode
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="mb-2">
                                Offline mode allows you to
                                read your manga and light
                                novels without an internet
                                connection. Downloaded
                                content is stored in your
                                browser&apos;s storage and
                                will remain available until
                                you remove it.
                            </p>
                            <p className="mb-2">
                                To download content for
                                offline reading, visit a
                                manga or light novel page
                                and click the &quot;Download
                                for Offline&quot; button.
                            </p>
                            <p>
                                <strong>Note:</strong>{" "}
                                Storage space is limited by
                                your browser and device.
                                Large manga volumes with
                                many images may use
                                significant storage.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
