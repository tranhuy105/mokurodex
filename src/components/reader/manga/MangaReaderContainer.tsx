"use client";

import { OfflineManager } from "@/components/pwa/OfflineManager";
import { useUpdateReadingHistory } from "@/hooks/use-manga-reader";
import { useSettings } from "@/hooks/useSettings";
import {
    MangaReaderProps,
    navigateToPage,
} from "@/lib/reader-utils";
import { PageWithTextBlocks } from "@/types/content";
import { Volume } from "@prisma/client";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import MangaReader from "./MangaReader";

/**
 * Container component that handles the state management for the manga reader
 * This separates the concerns between URL handling and rendering
 */
export default function MangaReaderContainer({
    mangaId,
    volume: initialVolume,
    volumes,
    pages: initialPages,
    initialPage,
}: MangaReaderProps) {
    // State to track the current volume and pages
    const [currentVolume, setCurrentVolume] =
        useState<Volume>(initialVolume);
    const [currentPage, setCurrentPage] =
        useState<number>(initialPage);
    const [isLoading, setIsLoading] =
        useState<boolean>(false);
    const [pages, setPages] = useState<
        PageWithTextBlocks[]
    >(initialPages || []);
    const [isPagesLoading, setIsPagesLoading] =
        useState(false);

    // Settings for reading mode and saving position
    const { autoSavePosition } = useSettings();

    // Use React Query hook for updating reading history
    const { mutate: updateReadingHistory } =
        useUpdateReadingHistory();

    // Use refs to prevent rerenders and track state without causing updates
    const currentPageRef = useRef<number>(initialPage);
    const currentVolumeRef = useRef<Volume>(initialVolume);
    const lastSavedPosition = useRef<{
        page: number;
        volumeId: string;
    }>({
        page: initialPage,
        volumeId: initialVolume.id,
    });
    const isNavigatingRef = useRef<boolean>(false);
    const pendingUpdatesRef = useRef<{
        urlUpdate: number | null;
        dbSave: number | null;
    }>({
        urlUpdate: null,
        dbSave: null,
    });

    // Track if this is the first render
    const isFirstRender = useRef(true);

    // Memoize the MangaReader props to prevent unnecessary rerenders
    const readerProps = useMemo(
        () => ({
            manga: mangaId,
            volume: currentVolume,
            pages,
            volumes,
            initialPage: currentPage,
            isLoading: isLoading || isPagesLoading,
            showControls: true,
        }),
        [
            mangaId,
            currentVolume,
            pages,
            volumes,
            currentPage,
            isLoading,
            isPagesLoading,
        ]
    );

    // Batch URL updates using RAF + timeout
    const scheduleUrlUpdate = useCallback(
        (page: number, volumeNumber: number) => {
            if (pendingUpdatesRef.current.urlUpdate) {
                cancelAnimationFrame(
                    pendingUpdatesRef.current.urlUpdate
                );
            }

            pendingUpdatesRef.current.urlUpdate =
                requestAnimationFrame(() => {
                    // Add small delay to batch rapid updates
                    setTimeout(() => {
                        if (
                            currentPageRef.current === page
                        ) {
                            navigateToPage(
                                mangaId,
                                String(volumeNumber),
                                page,
                                true
                            );
                        }
                        pendingUpdatesRef.current.urlUpdate =
                            null;
                    }, 100);
                });
        },
        [mangaId]
    );

    // Batch database saves using timeout
    const scheduleDbSave = useCallback(
        (page: number, volumeId: string) => {
            if (!autoSavePosition) return;

            if (pendingUpdatesRef.current.dbSave) {
                clearTimeout(
                    pendingUpdatesRef.current.dbSave
                );
            }

            pendingUpdatesRef.current.dbSave = setTimeout(
                () => {
                    // Only save if position actually changed and is still current
                    if (
                        currentPageRef.current === page &&
                        page >= 1 &&
                        page <= pages.length &&
                        (page !==
                            lastSavedPosition.current
                                .page ||
                            volumeId !==
                                lastSavedPosition.current
                                    .volumeId)
                    ) {
                        lastSavedPosition.current = {
                            page,
                            volumeId,
                        };
                        updateReadingHistory({
                            contentId: mangaId,
                            volumeId,
                            position: page,
                        });
                    }
                    pendingUpdatesRef.current.dbSave = null;
                },
                300
            );
        },
        [
            autoSavePosition,
            mangaId,
            pages.length,
            updateReadingHistory,
        ]
    );

    // Fetch pages effect - only when volume actually changes
    useEffect(() => {
        if (
            currentVolume.id === initialVolume.id &&
            initialPages?.length > 0
        ) {
            return;
        }

        async function fetchPages() {
            setIsPagesLoading(true);
            try {
                const response = await fetch(
                    `/api/pages?volumeId=${currentVolume.id}`
                );
                if (!response.ok) {
                    throw new Error(
                        "Failed to fetch pages"
                    );
                }
                const data = await response.json();
                setPages(data);
            } catch (error) {
                console.error(
                    "Error fetching pages:",
                    error
                );
            } finally {
                setIsPagesLoading(false);
            }
        }

        fetchPages();
    }, [currentVolume.id, initialVolume.id, initialPages]);

    // Handle page change - MINIMAL state updates
    const handlePageChange = useCallback(
        (newPage: number) => {
            // Skip invalid page numbers or same page
            if (
                newPage < 1 ||
                (pages.length > 0 &&
                    newPage > pages.length) ||
                newPage === currentPageRef.current ||
                isNavigatingRef.current
            ) {
                return;
            }

            // Prevent rapid navigation
            isNavigatingRef.current = true;

            // Update refs immediately (no rerender)
            currentPageRef.current = newPage;

            // Update state in next tick to batch with other updates
            Promise.resolve().then(() => {
                setCurrentPage(newPage);
                isNavigatingRef.current = false;
            });

            // Schedule async updates
            scheduleUrlUpdate(
                newPage,
                currentVolumeRef.current.volumeNumber
            );
            scheduleDbSave(
                newPage,
                currentVolumeRef.current.id
            );
        },
        [pages.length, scheduleUrlUpdate, scheduleDbSave]
    );

    // Handle volume change
    const handleVolumeChange = useCallback(
        (volumeId: string, pageNum: number = 1) => {
            let newVolume: Volume | undefined;

            const volumeNumber = parseInt(volumeId, 10);
            if (!isNaN(volumeNumber)) {
                newVolume = volumes.find(
                    (v) => v.volumeNumber === volumeNumber
                );
            }

            if (!newVolume) {
                newVolume = volumes.find(
                    (v) => v.id === volumeId
                );
            }

            if (
                !newVolume ||
                newVolume.id === currentVolumeRef.current.id
            ) {
                return;
            }

            // Cancel any pending updates for the old volume
            if (pendingUpdatesRef.current.urlUpdate) {
                cancelAnimationFrame(
                    pendingUpdatesRef.current.urlUpdate
                );
                pendingUpdatesRef.current.urlUpdate = null;
            }
            if (pendingUpdatesRef.current.dbSave) {
                clearTimeout(
                    pendingUpdatesRef.current.dbSave
                );
                pendingUpdatesRef.current.dbSave = null;
            }

            // Update refs
            currentVolumeRef.current = newVolume;
            currentPageRef.current = pageNum;

            // Update state
            setIsLoading(true);
            setCurrentVolume(newVolume);
            setCurrentPage(pageNum);

            // Update URL immediately for volume changes
            navigateToPage(
                mangaId,
                String(newVolume.volumeNumber),
                pageNum,
                false
            );

            // Save position immediately for volume changes
            if (autoSavePosition) {
                lastSavedPosition.current = {
                    page: pageNum,
                    volumeId: newVolume.id,
                };
                updateReadingHistory({
                    contentId: mangaId,
                    volumeId: newVolume.id,
                    position: pageNum,
                });
            }

            setTimeout(() => setIsLoading(false), 300);
        },
        [
            volumes,
            mangaId,
            autoSavePosition,
            updateReadingHistory,
        ]
    );

    // Initialize refs and save initial position
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            currentPageRef.current = initialPage;
            currentVolumeRef.current = initialVolume;

            if (autoSavePosition) {
                lastSavedPosition.current = {
                    page: initialPage,
                    volumeId: initialVolume.id,
                };
                updateReadingHistory({
                    contentId: mangaId,
                    volumeId: initialVolume.id,
                    position: initialPage,
                });
            }
        }
    }, [
        initialPage,
        initialVolume.id,
        mangaId,
        autoSavePosition,
        updateReadingHistory,
        initialVolume,
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pendingUpdatesRef.current.urlUpdate) {
                cancelAnimationFrame(
                    pendingUpdatesRef.current.urlUpdate
                );
            }
            if (pendingUpdatesRef.current.dbSave) {
                clearTimeout(
                    pendingUpdatesRef.current.dbSave
                );
            }
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
                <MangaReader
                    {...readerProps}
                    onPageChange={handlePageChange}
                    onVolumeChange={handleVolumeChange}
                />
            </div>

            <OfflineManager
                contentId={mangaId}
                contentTitle={
                    currentVolume.volumeTitle || "Manga"
                }
                contentType="manga"
                volumeId={currentVolume.id}
                volumeNumber={currentVolume.volumeNumber}
                volumeTitle={currentVolume.volumeTitle}
                coverImage={
                    currentVolume.coverImage || undefined
                }
            />
        </div>
    );
}