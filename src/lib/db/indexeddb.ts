import { IDBPDatabase, openDB } from "idb";

// Define the database name and version
export const DB_NAME = "mokurodex-offline";
export const DB_VERSION = 2;

// Define the required object stores
export const STORES = {
    DOWNLOADS: "downloads",
    IMAGES: "images",
    EPUBS: "epubs",
};

/**
 * Initialize the IndexedDB database
 */
export async function initializeOfflineDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
            console.log(
                `Upgrading DB from version ${oldVersion} to ${newVersion}`
            );

            // Create object stores if they don't exist
            if (
                !db.objectStoreNames.contains(
                    STORES.DOWNLOADS
                )
            ) {
                console.log("Creating downloads store");
                const downloadStore = db.createObjectStore(
                    STORES.DOWNLOADS,
                    {
                        keyPath: "id",
                    }
                );
                downloadStore.createIndex(
                    "contentId",
                    "contentId",
                    {
                        unique: false,
                    }
                );
            }

            if (
                !db.objectStoreNames.contains(STORES.IMAGES)
            ) {
                console.log("Creating images store");
                db.createObjectStore(STORES.IMAGES, {
                    keyPath: "id",
                });
            }

            if (
                !db.objectStoreNames.contains(STORES.EPUBS)
            ) {
                console.log("Creating epubs store");
                db.createObjectStore(STORES.EPUBS, {
                    keyPath: "id",
                });
            }
        },
        blocked() {
            console.warn("Database opening blocked");
        },
        blocking() {
            console.warn("Database is blocking an upgrade");
        },
        terminated() {
            console.error(
                "Database connection terminated unexpectedly"
            );
        },
    });
}

/**
 * Verify if a store exists in the database
 */
export function verifyStoreExists(
    db: IDBPDatabase | null,
    storeName: string
): boolean {
    if (!db) return false;
    return db.objectStoreNames.contains(storeName);
}

/**
 * Calculate the total storage size used by a specific store and prefix
 */
export async function calculateStorageSize(
    db: IDBPDatabase,
    storeName: string,
    prefix: string
): Promise<number> {
    if (!verifyStoreExists(db, storeName)) return 0;

    try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const keys = await store.getAllKeys();
        let totalSize = 0;

        for (const key of keys) {
            if (
                typeof key === "string" &&
                key.startsWith(prefix)
            ) {
                const item = await store.get(key);
                if (item?.blob) {
                    totalSize += item.blob.size;
                }
            }
        }

        return totalSize;
    } catch (error) {
        console.error(
            `Error calculating storage size for ${storeName}:`,
            error
        );
        return 0;
    }
}
