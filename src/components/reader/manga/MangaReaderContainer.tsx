"use client";

import { OfflineManager } from "@/components/pwa/OfflineManager";
import {
    useUpdateReadingHistory,
    useVolumePages,
} from "@/hooks/use-manga-reader";
import { useSettings } from "@/hooks/useSettings";
import {
    MangaReaderProps,
    navigateToPage,
} from "@/lib/reader-utils";
import { Volume } from "@prisma/client";
import {
    useCallback,
    useEffect,
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
    initialPage,
}: MangaReaderProps) {
    // State to track the current volume and pages
    const [currentVolume, setCurrentVolume] =
        useState<Volume>(initialVolume);
    const [currentPage, setCurrentPage] =
        useState<number>(initialPage);
    const [isLoading, setIsLoading] =
        useState<boolean>(false);

    // Settings for reading mode and saving position
    const { autoSavePosition } = useSettings();

    // Use React Query hook to fetch pages for the current volume
    const { data: pages = [], isLoading: isPagesLoading } =
        useVolumePages(currentVolume.id);

    // Use React Query hook for updating reading history
    const { mutate: updateReadingHistory } =
        useUpdateReadingHistory();

    // Use refs to track data needed for preventing unnecessary updates
    const lastSavedPosition = useRef<{
        page: number;
        volumeId: string;
    }>({
        page: initialPage,
        volumeId: initialVolume.id,
    });

    // Track if this is the first render to avoid double URL updates on mount
    const isFirstRender = useRef(true);

    // Listen for browser history navigation (back/forward buttons)
    useEffect(() => {
        function handlePopState() {
            // Parse the current URL to get the page
            const pathParts =
                window.location.pathname.split("/");
            if (
                pathParts.length >= 6 &&
                pathParts[1] === "reader" &&
                pathParts[2] === "manga"
            ) {
                const newMangaId = decodeURIComponent(
                    pathParts[3]
                );
                const newVolumeNumber = parseInt(
                    pathParts[4],
                    10
                );
                const newPageNum = parseInt(
                    pathParts[5],
                    10
                );

                if (newMangaId === mangaId) {
                    // Find volume by volume number
                    const newVolume = volumes.find(
                        (v) =>
                            v.volumeNumber ===
                            newVolumeNumber
                    );

                    if (newVolume) {
                        if (
                            newVolume.id ===
                            currentVolume.id
                        ) {
                            // Only page changed, update local state
                            if (
                                !isNaN(newPageNum) &&
                                newPageNum >= 1
                            ) {
                                setCurrentPage(newPageNum);
                            }
                        } else {
                            // Volume changed, update volume state
                            setCurrentVolume(newVolume);
                            setCurrentPage(newPageNum || 1);
                        }
                    }
                }
            }
        }

        window.addEventListener("popstate", handlePopState);
        return () =>
            window.removeEventListener(
                "popstate",
                handlePopState
            );
    }, [mangaId, currentVolume.id, volumes]);

    // Save reading position to database - simplified version
    const saveReadingPosition = useCallback(
        (page: number, volumeId: string) => {
            // Skip if auto-save is disabled
            if (!autoSavePosition) return;

            // Only save when:
            // 1. It's a different position than last saved
            // 2. It's a valid page number
            if (
                page >= 1 &&
                page <= pages.length &&
                (page !== lastSavedPosition.current.page ||
                    volumeId !==
                        lastSavedPosition.current.volumeId)
            ) {
                // Update last saved position immediately
                lastSavedPosition.current = {
                    page,
                    volumeId,
                };

                // Fire and forget - no callbacks, no waiting
                updateReadingHistory({
                    contentId: mangaId,
                    volumeId,
                    position: page,
                });
            }
        },
        [
            mangaId,
            autoSavePosition,
            pages.length,
            updateReadingHistory,
        ]
    );

    // Handle page change - simplified version
    const handlePageChange = useCallback(
        (newPage: number) => {
            // Skip invalid page numbers
            if (
                newPage < 1 ||
                (pages.length > 0 &&
                    newPage > pages.length) ||
                newPage === currentPage
            ) {
                return;
            }

            // Update state first for immediate feedback
            setCurrentPage(newPage);

            // Update URL using history API - no debouncing
            navigateToPage(
                mangaId,
                String(currentVolume.volumeNumber),
                newPage,
                true
            );

            // Save reading position directly
            saveReadingPosition(newPage, currentVolume.id);
        },
        [
            currentPage,
            pages.length,
            mangaId,
            currentVolume,
            saveReadingPosition,
        ]
    );

    // Handle volume change - simplified version
    const handleVolumeChange = useCallback(
        (volumeId: string, pageNum: number = 1) => {
            // Find the volume by id or volumeNumber
            let newVolume: Volume | undefined;

            // Try to parse as number first (might be volumeNumber)
            const volumeNumber = parseInt(volumeId, 10);
            if (!isNaN(volumeNumber)) {
                newVolume = volumes.find(
                    (v) => v.volumeNumber === volumeNumber
                );
            }

            // If not found, try as direct id
            if (!newVolume) {
                newVolume = volumes.find(
                    (v) => v.id === volumeId
                );
            }

            if (
                !newVolume ||
                newVolume.id === currentVolume.id
            ) {
                return; // Skip if invalid or same volume
            }

            // Set loading state
            setIsLoading(true);

            // Update the volume state
            setCurrentVolume(newVolume);

            // Reset to specified page for the new volume
            setCurrentPage(pageNum);

            // Update URL
            navigateToPage(
                mangaId,
                String(newVolume.volumeNumber),
                pageNum,
                false
            );

            // Save initial position in the new volume
            saveReadingPosition(pageNum, newVolume.id);

            // Clear loading state after a short delay to allow volume to load
            setTimeout(() => setIsLoading(false), 300);
        },
        [
            currentVolume.id,
            mangaId,
            saveReadingPosition,
            volumes,
        ]
    );

    // Save initial reading position on first render
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            saveReadingPosition(
                initialPage,
                initialVolume.id
            );
        }
    }, [
        initialPage,
        initialVolume.id,
        saveReadingPosition,
    ]);

    // Main render method
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
                <MangaReader
                    manga={mangaId}
                    volume={currentVolume}
                    pages={pages}
                    volumes={volumes}
                    initialPage={currentPage}
                    onPageChange={handlePageChange}
                    onVolumeChange={handleVolumeChange}
                    isLoading={isLoading || isPagesLoading}
                    showControls={true}
                />
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-4 bg-none flex justify-center z-10">
                <OfflineManager
                    contentId={mangaId}
                    contentTitle={
                        currentVolume.volumeTitle || "Manga"
                    }
                    contentType="manga"
                    volumeId={currentVolume.id}
                    volumeNumber={
                        currentVolume.volumeNumber
                    }
                    volumeTitle={currentVolume.volumeTitle}
                    coverImage={
                        currentVolume.coverImage ||
                        undefined
                    }
                />
            </div>
        </div>
    );
}
