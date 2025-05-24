"use client";

import { useMemo, useState } from "react";
import { ChevronUp, Settings2, Home, List, Layers } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import { useSettings, useMangaReader, useReaderControls } from "@/hooks";
import Link from "next/link";
import ImageCropper from "./ImageCropper";
import { updateLastCard } from "@/lib/anki-connect";

// Import reading modes components
import SinglePageMode from "./reading-modes/SinglePageMode";
import DoublePageMode from "./reading-modes/DoublePageMode";
import LongStripMode from "./reading-modes/LongStripMode";
import ProgressBar from "./ProgressBar";
import { Page, Volume } from "@prisma/client";

// Define a type for double page data
type DoublePageData = {
  left: string | null;
  right: string | null;
  currentPage: number;
};

interface Props {
  manga: string;
  volume: Volume;
  pages: Page[];
  volumes: Volume[];
  initialPage: number;
}

export default function MangaReader({
  manga,
  volume,
  pages,
  volumes,
  initialPage,
}: Props) {
  // Use custom hooks
  const settings = useSettings();
  const {
    currentPage,
    currentVolume,
    currentPages,
    isLoading,
    navigateToPage,
    navigateToVolume,
  } = useMangaReader({
    mangaId: manga,
    volume,
    pages,
    volumes,
    initialPage,
  });

  const {
    showControls,
    showScrollTop,
    showSidebar,
    toggleSidebar,
    containerRef,
  } = useReaderControls();

  // Calculate actual page count to use when pages is empty
  const actualPageCount = useMemo(() => {
    return currentPages.length || currentVolume.pageCount || 0;
  }, [currentPages, currentVolume]);

  // Memoize the page data to prevent unnecessary re-renders
  const memoizedPages = useMemo(() => currentPages, [currentPages]);

  // Scroll to top function
  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Add state for image cropper
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pageToDisplay, setPageToDisplay] = useState<string | null>(null);

  // Get current page image and potentially second page image for double page mode
  const getCurrentPageImage = (): string | DoublePageData | null => {
    if (
      !currentPages.length ||
      currentPage <= 0 ||
      currentPage > currentPages.length
    ) {
      return null;
    }

    // For single page mode or long strip mode, just return the current page
    if (settings.readingMode !== "doublePage") {
      return currentPages[currentPage - 1]?.imagePath || "";
    }

    // For double page mode, return both images if available
    // Use the same logic as DoublePageMode to ensure correct pages are shown
    const adjustedCurrentPage =
      currentPage % 2 === 0 && currentPage > 1 ? currentPage - 1 : currentPage;

    const leftPageIndex = adjustedCurrentPage - 1;
    const rightPageIndex = adjustedCurrentPage;

    const leftPage = currentPages[leftPageIndex];
    const rightPage = currentPages[rightPageIndex];

    return {
      left: leftPage?.imagePath || null,
      right: rightPage?.imagePath || null,
      currentPage: adjustedCurrentPage,
    };
  };

  // Handle opening the cropper
  const handleOpenCropper = () => {
    const pageImage = getCurrentPageImage();

    if (!pageImage) {
      return; // No pages available
    }

    // Handle double page mode differently
    if (
      settings.readingMode === "doublePage" &&
      typeof pageImage === "object"
    ) {
      // For double page mode, we'll default to the currently visible page
      // If both pages are available, let the user choose in the cropper
      if (pageImage.left && pageImage.right) {
        // Default to right page for right-to-left, left page for left-to-right
        setPageToDisplay(
          settings.rightToLeft ? pageImage.right : pageImage.left
        );
      } else {
        // If only one page is available, use that
        setPageToDisplay(pageImage.left || pageImage.right || null);
      }
    } else {
      // For single page modes, just use the current page
      setPageToDisplay(typeof pageImage === "string" ? pageImage : null);
    }

    setIsCropperOpen(true);
  };

  // Handle cropping
  const handleCrop = async (croppedImage: string) => {
    try {
      await updateLastCard(croppedImage);
      setIsCropperOpen(false);
    } catch (error) {
      console.error("Error updating Anki card:", error);
    }
  };

  // Render the appropriate content based on reading mode
  const renderContent = () => {
    const commonProps = {
      pages: memoizedPages,
      currentPage,
      settings,
      initialPage,
      onPageChange: navigateToPage,
      manga,
      volumeId: currentVolume.volumeUuid,
      showControls,
    };

    switch (settings.readingMode) {
      case "singlePage":
        return <SinglePageMode {...commonProps} />;
      case "doublePage":
        return <DoublePageMode {...commonProps} />;
      case "longStrip":
        return <LongStripMode {...commonProps} />;
      default:
        return <SinglePageMode {...commonProps} />;
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col no-scrollbar">
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Fixed sidebar - outside of the main content flow */}
      {showSidebar && (
        <div className="fixed top-0 right-0 h-full z-[1000]">
          <SettingsSidebar
            onClose={toggleSidebar}
            currentPage={currentPage}
            totalPages={actualPageCount}
            volumes={volumes}
            currentVolume={currentVolume}
            onPageChange={navigateToPage}
            onVolumeChange={navigateToVolume}
          />
        </div>
      )}

      {/* Settings button */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-16 right-4 z-20 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all"
        aria-label="Settings"
      >
        <Settings2 size={22} />
      </button>

      {/* Navigation buttons - Simple home/manga list navigation */}
      <div
        className={`fixed top-4 left-0 right-0 z-20 transition-opacity duration-300 flex justify-between items-center px-4 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Left side buttons */}
        <div className="flex items-center space-x-2">
          <Link
            href={`/manga`}
            className="flex items-center justify-center w-10 h-10 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full shadow-lg transition-all"
          >
            <Home size={18} />
          </Link>
          <Link
            href={`/manga/${encodeURIComponent(manga)}`}
            className="flex items-center justify-center w-10 h-10 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full shadow-lg transition-all"
          >
            <List size={18} />
          </Link>
          <button
            onClick={handleOpenCropper}
            className="flex items-center justify-center w-10 h-10 bg-[#fa9c34] bg-opacity-90 hover:bg-opacity-100 text-white rounded-full shadow-lg transition-all"
            aria-label="Open Anki Cropper"
          >
            <Layers size={18} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative overflow-hidden no-scrollbar">
        {/* Content area */}
        <div
          className="flex-1 relative h-full w-full overflow-hidden"
          ref={containerRef}
        >
          {renderContent()}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <ProgressBar currentPage={currentPage} totalPages={actualPageCount} />
      </div>

      {/* Scroll to top button - only for long strip mode */}
      {settings.readingMode === "longStrip" && showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-16 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp size={22} />
        </button>
      )}

      {/* Image Cropper with Page Selection */}
      {isCropperOpen && pageToDisplay && (
        <ImageCropper
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          image={pageToDisplay}
          onCrop={handleCrop}
          doublePage={settings.readingMode === "doublePage"}
          currentPages={
            settings.readingMode === "doublePage"
              ? (getCurrentPageImage() as DoublePageData | null)
              : null
          }
          onChangePage={(page: string) => setPageToDisplay(page)}
        />
      )}
    </div>
  );
}
