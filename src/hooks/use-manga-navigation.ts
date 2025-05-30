"use client";

import { Volume } from "@prisma/client";
import { throttle } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useUpdateReadingHistory } from "./use-manga-reader";

/**
 * Hook for manga navigation with reading history
 */
export function useMangaNavigation(
    contentId: string,
    volume: Volume,
    volumes: Volume[],
    pageCount: number
) {
    const router = useRouter();
    const { mutate: updateReadingHistory } =
        useUpdateReadingHistory();

    // Throttled function to update reading history
    const saveReadingPosition = throttle((page: number) => {
        updateReadingHistory({
            contentId,
            volumeId: volume.id,
            position: page,
        });
    }, 1000);

    // Navigate to a specific page
    const navigateToPage = useCallback(
        (page: number, updateHistory: boolean = true) => {
            // Validate page number
            const validPage = Math.min(
                Math.max(1, page),
                pageCount
            );

            // Update URL
            const newUrl = `/reader/manga/${encodeURIComponent(
                contentId
            )}/${volume.volumeNumber}/${validPage}`;

            if (updateHistory) {
                router.push(newUrl);
            } else {
                // Replace current history entry instead of adding a new one
                window.history.replaceState(
                    { path: newUrl },
                    "",
                    newUrl
                );
            }

            // Save reading position
            saveReadingPosition(validPage);
        },
        [
            contentId,
            volume,
            pageCount,
            router,
            saveReadingPosition,
        ]
    );

    // Navigate to a specific volume
    const navigateToVolume = useCallback(
        (volumeNumber: number, page: number = 1) => {
            const targetVolume = volumes.find(
                (v) => v.volumeNumber === volumeNumber
            );
            if (targetVolume) {
                router.push(
                    `/reader/manga/${encodeURIComponent(
                        contentId
                    )}/${volumeNumber}/${page}`
                );
            }
        },
        [contentId, volumes, router]
    );

    // Navigate to next volume
    const navigateToNextVolume = useCallback(() => {
        const currentIndex = volumes.findIndex(
            (v) => v.id === volume.id
        );
        if (
            currentIndex !== -1 &&
            currentIndex < volumes.length - 1
        ) {
            const nextVolume = volumes[currentIndex + 1];
            navigateToVolume(nextVolume.volumeNumber);
        }
    }, [volume.id, volumes, navigateToVolume]);

    // Navigate to previous volume
    const navigateToPreviousVolume = useCallback(() => {
        const currentIndex = volumes.findIndex(
            (v) => v.id === volume.id
        );
        if (currentIndex > 0) {
            const prevVolume = volumes[currentIndex - 1];
            navigateToVolume(prevVolume.volumeNumber);
        }
    }, [volume.id, volumes, navigateToVolume]);

    return {
        navigateToPage,
        navigateToVolume,
        navigateToNextVolume,
        navigateToPreviousVolume,
        saveReadingPosition,
    };
}
