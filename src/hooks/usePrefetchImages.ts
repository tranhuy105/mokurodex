import { PageWithTextBlocks } from "@/types/content";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

interface PrefetchState {
    loadedImages: Set<string>;
    prefetchingImages: Set<string>;
    failedImages: Set<string>;
}

export function usePrefetchImages(
    pages: PageWithTextBlocks[],
    currentPage: number,
    prefetchDistance = 10, // Increased from 3 to match MangaDex behavior
    batchSize = 5 // Process images in batches to avoid overwhelming the browser
) {
    const [prefetchState, setPrefetchState] =
        useState<PrefetchState>({
            loadedImages: new Set(),
            prefetchingImages: new Set(),
            failedImages: new Set(),
        });

    // Keep track of active prefetch requests to avoid duplicates
    const activePrefetches = useRef<Set<string>>(new Set());

    // Batch processing queue
    const prefetchQueue = useRef<string[]>([]);
    const processingBatch = useRef<boolean>(false);

    // Function to preload a single image
    const preloadImage = useCallback(
        (imagePath: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                // Skip if already loaded, failed, or currently loading
                if (
                    prefetchState.loadedImages.has(
                        imagePath
                    ) ||
                    prefetchState.failedImages.has(
                        imagePath
                    ) ||
                    activePrefetches.current.has(imagePath)
                ) {
                    resolve();
                    return;
                }

                activePrefetches.current.add(imagePath);

                const img = new Image();

                img.onload = () => {
                    setPrefetchState((prev) => ({
                        ...prev,
                        loadedImages: new Set([
                            ...prev.loadedImages,
                            imagePath,
                        ]),
                        prefetchingImages: new Set(
                            [
                                ...prev.prefetchingImages,
                            ].filter((p) => p !== imagePath)
                        ),
                    }));
                    activePrefetches.current.delete(
                        imagePath
                    );
                    resolve();
                };

                img.onerror = () => {
                    setPrefetchState((prev) => ({
                        ...prev,
                        failedImages: new Set([
                            ...prev.failedImages,
                            imagePath,
                        ]),
                        prefetchingImages: new Set(
                            [
                                ...prev.prefetchingImages,
                            ].filter((p) => p !== imagePath)
                        ),
                    }));
                    activePrefetches.current.delete(
                        imagePath
                    );
                    reject(
                        new Error(
                            `Failed to load image: ${imagePath}`
                        )
                    );
                };

                // Mark as prefetching when we start loading
                setPrefetchState((prev) => ({
                    ...prev,
                    prefetchingImages: new Set([
                        ...prev.prefetchingImages,
                        imagePath,
                    ]),
                }));

                img.src = imagePath;
            });
        },
        [
            prefetchState.loadedImages,
            prefetchState.failedImages,
        ]
    );

    // Process prefetch queue in batches
    const processBatch = useCallback(async () => {
        if (
            processingBatch.current ||
            prefetchQueue.current.length === 0
        ) {
            return;
        }

        processingBatch.current = true;

        // Take a batch from the queue
        const batch = prefetchQueue.current.splice(
            0,
            batchSize
        );

        // Process batch concurrently but with error handling
        const promises = batch.map((imagePath) =>
            preloadImage(imagePath).catch((error) => {
                console.warn(
                    `Failed to prefetch image: ${imagePath}`,
                    error
                );
            })
        );

        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error(
                "Error in batch processing:",
                error
            );
        }

        processingBatch.current = false;

        // Continue processing if there are more items in queue
        if (prefetchQueue.current.length > 0) {
            // Small delay to prevent overwhelming the browser
            setTimeout(processBatch, 100);
        }
    }, [preloadImage, batchSize]);

    // Main prefetch effect
    useEffect(() => {
        if (!pages.length || currentPage <= 0) {
            return;
        }

        // Calculate which images to prefetch
        const imagesToPrefetch: string[] = [];

        // Always ensure current page is loaded first
        const currentPageImage =
            pages[currentPage - 1]?.imagePath;
        if (
            currentPageImage &&
            !prefetchState.loadedImages.has(
                currentPageImage
            )
        ) {
            imagesToPrefetch.push(currentPageImage);
        }

        // Then prefetch ahead
        for (let i = 1; i <= prefetchDistance; i++) {
            const pageIndex = currentPage - 1 + i;
            if (pageIndex < pages.length) {
                const imagePath =
                    pages[pageIndex]?.imagePath;
                if (
                    imagePath &&
                    !prefetchState.loadedImages.has(
                        imagePath
                    ) &&
                    !prefetchState.failedImages.has(
                        imagePath
                    ) &&
                    !activePrefetches.current.has(imagePath)
                ) {
                    imagesToPrefetch.push(imagePath);
                }
            }
        }

        // Also prefetch a few pages behind for better UX
        for (let i = 1; i <= 3; i++) {
            const pageIndex = currentPage - 1 - i;
            if (pageIndex >= 0) {
                const imagePath =
                    pages[pageIndex]?.imagePath;
                if (
                    imagePath &&
                    !prefetchState.loadedImages.has(
                        imagePath
                    ) &&
                    !prefetchState.failedImages.has(
                        imagePath
                    ) &&
                    !activePrefetches.current.has(imagePath)
                ) {
                    imagesToPrefetch.push(imagePath);
                }
            }
        }

        // Add new images to queue (avoid duplicates)
        const newImages = imagesToPrefetch.filter(
            (img) => !prefetchQueue.current.includes(img)
        );

        if (newImages.length > 0) {
            // Prioritize current page and nearby pages
            prefetchQueue.current = [
                ...newImages.filter((img) => {
                    const pageIndex = pages.findIndex(
                        (p) => p?.imagePath === img
                    );
                    return (
                        pageIndex >= currentPage - 1 &&
                        pageIndex <= currentPage + 1
                    );
                }),
                ...prefetchQueue.current,
                ...newImages.filter((img) => {
                    const pageIndex = pages.findIndex(
                        (p) => p?.imagePath === img
                    );
                    return (
                        pageIndex < currentPage - 1 ||
                        pageIndex > currentPage + 1
                    );
                }),
            ];

            // Start processing if not already running
            processBatch();
        }
    }, [
        pages,
        currentPage,
        prefetchDistance,
        prefetchState,
        processBatch,
    ]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            activePrefetches.current.clear();
            prefetchQueue.current = [];
            processingBatch.current = false;
        };
    }, []);

    return {
        loadedImages: prefetchState.loadedImages,
        prefetchingImages: prefetchState.prefetchingImages,
        failedImages: prefetchState.failedImages,
        // Helper functions
        isLoaded: (imagePath: string) =>
            prefetchState.loadedImages.has(imagePath),
        isPrefetching: (imagePath: string) =>
            prefetchState.prefetchingImages.has(
                imagePath
            ) || activePrefetches.current.has(imagePath),
        hasFailed: (imagePath: string) =>
            prefetchState.failedImages.has(imagePath),
    };
}
