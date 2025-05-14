import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MangaPage, Volume } from "@/types/manga";
import { MangaService } from "@/lib/services";

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

      setCurrentPage(validPage);

      // Update URL without navigation
      window.history.replaceState(
        {},
        "",
        `/manga/${mangaId}/${currentVolume.mokuroData.volume_uuid}/${validPage}`
      );
    },
    [currentPages, currentVolume.mokuroData.volume_uuid, mangaId]
  );

  // Navigate to a specific volume
  const navigateToVolume = useCallback(
    async (volumeId: string) => {
      // Skip if it's the current volume
      if (volumeId === currentVolume.mokuroData.volume_uuid) return;

      try {
        setIsLoading(true);

        // Find the new volume from the volumes array
        const newVolume = volumes.find(
          (v) => v.mokuroData.volume_uuid === volumeId
        );

        if (newVolume) {
          // Update current volume
          setCurrentVolume(newVolume);
          setCurrentPage(1);

          // Get pages for the new volume
          const newPages = await MangaService.getVolumePages(
            mangaId,
            newVolume
          );

          // Safety check that pages were loaded
          if (!newPages || newPages.length === 0) {
            console.error(
              "No pages loaded for volume:",
              newVolume.mokuroData.volume
            );
          }

          setCurrentPages(newPages || []);

          // Update URL
          window.history.pushState({}, "", `/manga/${mangaId}/${volumeId}/1`);
        } else {
          // If not found in current data, navigate to the new volume page
          router.push(`/manga/${mangaId}/${volumeId}/1`);
        }
      } catch (error) {
        console.error("Error navigating to volume:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentVolume.mokuroData.volume_uuid, mangaId, router, volumes]
  );

  // Update URL when volume changes
  useEffect(() => {
    if (currentVolume !== volume) {
      window.history.replaceState(
        {},
        "",
        `/manga/${mangaId}/${currentVolume.mokuroData.volume_uuid}/1`
      );
    }
  }, [currentVolume, mangaId, volume]);

  return {
    currentPage,
    currentVolume,
    currentPages,
    isLoading,
    navigateToPage,
    navigateToVolume,
  };
}
