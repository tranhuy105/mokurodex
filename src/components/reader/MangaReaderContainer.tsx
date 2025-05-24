"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { MangaReaderProps, navigateToPage } from "@/lib/reader-utils";
import { useSettings } from "@/hooks/useSettings";
import { Page, Volume } from "@prisma/client";
import { fetchVolumePages } from "@/actions/manga-api-prisma";
import MangaReader from "./MangaReader";
import { addReadingHistory } from "@/actions/manga-management-api-prisma";
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
  const [currentVolume, setCurrentVolume] = useState<Volume>(initialVolume);
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Settings for reading mode and saving position
  const { autoSavePosition } = useSettings();

  // Use refs to track data needed for debouncing and preventing unnecessary updates
  const lastSavedPosition = useRef<{ page: number; volumeId: string }>({
    page: initialPage,
    volumeId: initialVolume.volumeUuid,
  });
  const isNavigating = useRef(false);

  // Track if this is the first render to avoid double URL updates on mount
  const isFirstRender = useRef(true);

  // Listen for browser history navigation (back/forward buttons)
  useEffect(() => {
    function handlePopState() {
      // Parse the current URL to get the page
      const pathParts = window.location.pathname.split("/");
      if (pathParts.length >= 5 && pathParts[1] === "manga") {
        const newMangaId = decodeURIComponent(pathParts[2]);
        const newVolumeId = pathParts[3];
        const newPageNum = parseInt(pathParts[4], 10);

        if (newMangaId === mangaId) {
          if (newVolumeId === currentVolume.volumeUuid) {
            // Only page changed, update local state
            if (
              !isNaN(newPageNum) &&
              newPageNum >= 1 &&
              newPageNum <= pages.length
            ) {
              setCurrentPage(newPageNum);
            }
          } else {
            // Volume changed, we need to fetch new pages
            handleVolumeChange(newVolumeId, newPageNum);
          }
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [mangaId, currentVolume.volumeUuid, pages.length]);

  // Save reading position to database
  const saveReadingPosition = useCallback(
    async (page: number, volumeId: string) => {
      if (!autoSavePosition) return;

      // Don't save if it's the same position we just saved
      if (
        lastSavedPosition.current.page === page &&
        lastSavedPosition.current.volumeId === volumeId
      ) {
        return;
      }

      // Only save when:
      // 1. Volume has changed
      // 2. Page has changed by at least 5 pages
      // 3. It's the first or last page of the volume
      const isVolumeChange = lastSavedPosition.current.volumeId !== volumeId;
      const pageChange = Math.abs(lastSavedPosition.current.page - page);
      const isSignificantPageChange = pageChange >= 3;
      const isFirstOrLastPage = page === 1 || page === pages.length;

      if (isVolumeChange || isSignificantPageChange || isFirstOrLastPage) {
        try {
          // Save the reading position
          await addReadingHistory({
            mangaId,
            volumeId,
            page,
          });

          // Update last saved position
          lastSavedPosition.current = { page, volumeId };
        } catch (error) {
          console.error("Error saving reading position:", error);
        }
      }
    },
    [mangaId, autoSavePosition, pages.length]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Skip invalid page numbers
      if (newPage < 1 || newPage > pages.length || newPage === currentPage) {
        return;
      }

      // Update state first for immediate feedback
      setCurrentPage(newPage);

      // Debounce URL updates to prevent excessive history entries
      if (!isNavigating.current) {
        isNavigating.current = true;

        // Update URL using history API
        navigateToPage(mangaId, currentVolume.volumeUuid, newPage, true);

        // Save reading position
        saveReadingPosition(newPage, currentVolume.volumeUuid);

        // Reset the navigation lock after a short delay
        setTimeout(() => {
          isNavigating.current = false;
        }, 100);
      } else {
        // If we're already navigating, queue the URL update for after the lock is released
        setTimeout(() => {
          navigateToPage(mangaId, currentVolume.volumeUuid, newPage, true);
          saveReadingPosition(newPage, currentVolume.volumeUuid);
        }, 150);
      }
    },
    [
      currentPage,
      pages.length,
      mangaId,
      currentVolume.volumeUuid,
      saveReadingPosition,
    ]
  );

  // Handle volume change
  const handleVolumeChange = useCallback(
    async (volumeId: string, pageNum: number = 1) => {
      // Skip if it's the current volume
      if (volumeId === currentVolume.volumeUuid) return;

      try {
        // Set loading state immediately
        setIsLoading(true);

        // Find the new volume from the volumes array
        const newVolume = volumes.find((v) => v.volumeUuid === volumeId);

        if (!newVolume) {
          console.error(`Volume with ID ${volumeId} not found`);
          return;
        }

        // Get pages for the new volume before updating state
        const newPages = await fetchVolumePages(volumeId);

        // Safety check that pages were loaded
        if (!newPages || newPages.length === 0) {
          console.error("No pages loaded for volume:", volumeId);
          return;
        }

        // Now that we have the pages, update the state
        setCurrentVolume(newVolume);
        setPages(newPages);

        // Ensure page number is valid for the new volume
        const validPage = Math.min(pageNum, newPages.length);
        setCurrentPage(validPage);

        // Update URL
        navigateToPage(mangaId, volumeId, validPage, false);

        // Save initial position in the new volume
        saveReadingPosition(validPage, volumeId);
      } catch (error) {
        console.error("Error navigating to volume:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [currentVolume, mangaId, saveReadingPosition, volumes]
  );

  // Update URL when component mounts if it differs from initial state
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      // Save initial reading position
      saveReadingPosition(initialPage, initialVolume.volumeUuid);
    }
  }, [initialPage, initialVolume.volumeUuid, saveReadingPosition]);

  // Main render method
  return (
    <MangaReader
      manga={mangaId}
      volume={currentVolume}
      pages={pages}
      volumes={volumes}
      initialPage={currentPage}
      onPageChange={handlePageChange}
      onVolumeChange={handleVolumeChange}
      isLoading={isLoading}
      showControls={true}
    />
  );
}
