import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MangaPage, Volume } from "@/types/manga";
import { MangaService } from "@/lib/services";
import { addReadingHistoryEntry } from "@/actions/manga-management-actions";
import { useSettings } from "./useSettings";

interface UseMangaReaderProps {
  mangaId: string;
  volume: Volume;
  pages: MangaPage[];
  volumes: Volume[];
  initialPage: number;
}

interface UseMangaReaderReturn {
  currentPage: number;
  currentVolume: Volume;
  currentPages: MangaPage[];
  isLoading: boolean;
  navigateToPage: (page: number) => void;
  navigateToVolume: (volumeId: string) => void;
}

/**
 * Hook for managing manga reader state
 */
export function useMangaReader({
  mangaId,
  volume,
  pages,
  volumes,
  initialPage,
}: UseMangaReaderProps): UseMangaReaderReturn {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [currentVolume, setCurrentVolume] = useState<Volume>(volume);
  const [currentPages, setCurrentPages] = useState<MangaPage[]>(pages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { autoSavePosition } = useSettings();

  // Use a ref to track the last URL update to prevent redundant updates
  const lastUrlUpdate = useRef<string>(
    `/manga/${mangaId}/${volume.mokuroData.volume_uuid}/${initialPage}`
  );
  const isUrlUpdatePending = useRef<boolean>(false);

  // Track last saved position to prevent saving the same position multiple times
  const lastSavedPosition = useRef<{ page: number; volumeId: string } | null>(
    null
  );

  // Save reading position to database
  const saveReadingPosition = useCallback(
    async (page: number, volumeId: string) => {
      if (!autoSavePosition) return;

      // Don't save if it's the same position we just saved
      if (
        lastSavedPosition.current?.page === page &&
        lastSavedPosition.current?.volumeId === volumeId
      ) {
        return;
      }

      try {
        // Save the reading position
        await addReadingHistoryEntry({
          mangaId,
          volumeId,
          page,
        });

        // Update last saved position
        lastSavedPosition.current = { page, volumeId };
      } catch (error) {
        console.error("Error saving reading position:", error);
      }
    },
    [mangaId, autoSavePosition]
  );

  // Utility function to update the URL efficiently
  const updateUrl = useCallback((path: string, replace: boolean = true) => {
    // Skip if we're already updating or the URL is unchanged
    if (isUrlUpdatePending.current || lastUrlUpdate.current === path) return;

    try {
      isUrlUpdatePending.current = true;
      lastUrlUpdate.current = path;

      if (replace) {
        window.history.replaceState({ path }, "", path);
      } else {
        window.history.pushState({ path }, "", path);
      }
    } catch (error) {
      console.error("Error updating URL:", error);
    } finally {
      // Allow new updates after a short delay to prevent rapid consecutive updates
      setTimeout(() => {
        isUrlUpdatePending.current = false;
      }, 50);
    }
  }, []);

  // Navigate to a specific page in the current volume
  const navigateToPage = useCallback(
    (page: number) => {
      // Safety check - ensure pages exist and page is within bounds
      if (!currentPages || currentPages.length === 0) {
        console.warn("No pages available to navigate to");
        return;
      }

      // Ensure page is within bounds
      const validPage = Math.max(1, Math.min(page, currentPages.length));

      if (page !== validPage) {
        console.warn(`Page ${page} out of bounds, using ${validPage} instead`);
      }

      // Update current page state (this will cause components to re-render)
      setCurrentPage(validPage);

      // Update URL without navigation
      const newPath = `/manga/${mangaId}/${currentVolume.mokuroData.volume_uuid}/${validPage}`;
      updateUrl(newPath);

      // Save reading position if auto-save is enabled
      saveReadingPosition(validPage, currentVolume.mokuroData.volume_uuid);
    },
    [
      currentPages,
      currentVolume.mokuroData.volume_uuid,
      mangaId,
      updateUrl,
      saveReadingPosition,
    ]
  );

  // Navigate to a specific volume
  const navigateToVolume = useCallback(
    async (volumeId: string) => {
      // Skip if it's the current volume
      if (volumeId === currentVolume.mokuroData.volume_uuid) return;

      try {
        // Set loading state immediately to prevent UI flicker
        setIsLoading(true);

        // For reliable volume switching, especially in long strip mode,
        // use a full page navigation for all manga pages
        if (window.location.pathname.includes("/manga/")) {
          // Save the initial position in the new volume before navigating
          if (autoSavePosition) {
            saveReadingPosition(1, volumeId);
          }

          // Use setTimeout to ensure the loading state is applied before navigating
          setTimeout(() => {
            window.location.href = `/manga/${mangaId}/${volumeId}/1`;
          }, 10);
          return;
        }

        // Only continue with client-side state update if we're not in the manga reader
        // (e.g., if we're in settings or another page that shows manga volumes)

        // Find the new volume from the volumes array
        const newVolume = volumes.find(
          (v) => v.mokuroData.volume_uuid === volumeId
        );

        if (!newVolume) {
          console.error(`Volume with ID ${volumeId} not found`);
          router.push(`/manga/${mangaId}/${volumeId}/1`);
          return;
        }

        // Get pages for the new volume before updating state
        const newPages = MangaService.getVolumePages(mangaId, newVolume);

        // Safety check that pages were loaded
        if (!newPages || newPages.length === 0) {
          console.error(
            "No pages loaded for volume:",
            newVolume.mokuroData.volume
          );
          router.push(`/manga/${mangaId}/${volumeId}/1`);
          return;
        }

        // Now that we have the pages, update the state
        setCurrentVolume(newVolume);
        setCurrentPages(newPages);
        setCurrentPage(1);

        // Save initial position in the new volume
        saveReadingPosition(1, volumeId);

        // Update URL using pushState for non-reader pages
        const newPath = `/manga/${mangaId}/${volumeId}/1`;
        updateUrl(newPath, false);
      } catch (error) {
        console.error("Error navigating to volume:", error);
        // Handle fatal errors by doing a full page reload
        router.push(`/manga/${mangaId}/${volumeId}/1`);
      } finally {
        // If we haven't already triggered a navigation, clear loading state
        if (!window.location.pathname.includes("/manga/")) {
          setIsLoading(false);
        }
      }
    },
    [
      currentVolume.mokuroData.volume_uuid,
      mangaId,
      router,
      volumes,
      updateUrl,
      autoSavePosition,
      saveReadingPosition,
    ]
  );

  // Update URL when volume changes
  useEffect(() => {
    if (currentVolume !== volume) {
      const newPath = `/manga/${mangaId}/${currentVolume.mokuroData.volume_uuid}/1`;
      updateUrl(newPath);
    }
  }, [currentVolume, mangaId, volume, updateUrl]);

  // Save initial reading position when component mounts
  useEffect(() => {
    if (autoSavePosition) {
      saveReadingPosition(initialPage, volume.mokuroData.volume_uuid);
    }
  }, [
    autoSavePosition,
    initialPage,
    volume.mokuroData.volume_uuid,
    saveReadingPosition,
  ]);

  return {
    currentPage,
    currentVolume,
    currentPages,
    isLoading,
    navigateToPage,
    navigateToVolume,
  };
}
