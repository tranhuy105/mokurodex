"use client";

import * as mangaReaderActions from "@/server/actions/manga-reader";
import {
    useMutation,
    useQuery,
} from "@tanstack/react-query";

// Query keys for better cache management
export const mangaReaderKeys = {
    all: ["manga-reader"] as const,
    content: (id: string) =>
        [...mangaReaderKeys.all, "content", id] as const,
    volume: (id: string) =>
        [...mangaReaderKeys.all, "volume", id] as const,
    pages: (volumeId: string) =>
        [
            ...mangaReaderKeys.all,
            "pages",
            volumeId,
        ] as const,
    history: (contentId: string) =>
        [
            ...mangaReaderKeys.all,
            "history",
            contentId,
        ] as const,
    latestHistory: (contentId: string) =>
        [
            ...mangaReaderKeys.all,
            "latest-history",
            contentId,
        ] as const,
};

/**
 * Hook to fetch content with volumes
 */
export function useContentWithVolumes(contentId: string) {
    return useQuery({
        queryKey: mangaReaderKeys.content(contentId),
        queryFn: () =>
            mangaReaderActions.getContentWithVolumes({
                id: contentId,
            }),
        enabled: !!contentId,
    });
}

/**
 * Hook to fetch volume details
 */
export function useVolumeById(volumeId: string) {
    return useQuery({
        queryKey: mangaReaderKeys.volume(volumeId),
        queryFn: () =>
            mangaReaderActions.getVolumeById({
                id: volumeId,
            }),
        enabled: !!volumeId,
    });
}

/**
 * Hook to fetch pages for a volume
 */
export function useVolumePages(volumeId: string) {
    return useQuery({
        queryKey: mangaReaderKeys.pages(volumeId),
        queryFn: () =>
            mangaReaderActions.getVolumePages({
                id: volumeId,
            }),
        enabled: !!volumeId,
    });
}

/**
 * Hook to update reading history
 */
export function useUpdateReadingHistory() {
    return useMutation({
        mutationFn: (data: {
            contentId: string;
            volumeId: string;
            position: number;
            chapterHref?: string;
        }) => mangaReaderActions.updateReadingHistory(data),
        // Completely silent operation - no success or error messages
        // No query invalidation to prevent page refresh
    });
}

/**
 * Hook to fetch reading history for a content
 */
export function useReadingHistory(contentId: string) {
    return useQuery({
        queryKey: mangaReaderKeys.history(contentId),
        queryFn: () =>
            mangaReaderActions.getReadingHistory({
                id: contentId,
            }),
        enabled: !!contentId,
    });
}

/**
 * Hook to fetch the latest reading history for a content
 */
export function useLatestReadingHistory(contentId: string) {
    return useQuery({
        queryKey: mangaReaderKeys.latestHistory(contentId),
        queryFn: () =>
            mangaReaderActions.getLatestReadingHistory({
                id: contentId,
            }),
        enabled: !!contentId,
    });
}
