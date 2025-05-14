"use client";

import { useMemo } from "react";
import { ChevronUp, Settings2, Home, List } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import { SinglePageMode, DoublePageMode, LongStripMode } from "./ReadingModes";
import ProgressBar from "./ProgressBar";
import { useSettings, useMangaReader, useReaderControls } from "@/hooks";
import { MangaPage, Volume } from "@/types/manga";
import Link from "next/link";

interface Props {
  manga: string;
  volume: Volume;
  pages: MangaPage[];
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
    return currentPages.length || currentVolume.metadata?.pageCount || 0;
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

  // Render the appropriate content based on reading mode
  const renderContent = () => {
    const commonProps = {
      pages: memoizedPages,
      currentPage,
      settings,
      initialPage,
      onPageChange: navigateToPage,
      manga,
      volumeId: currentVolume.mokuroData.volume_uuid,
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
        <div className="fixed top-0 right-0 h-full z-9999">
          <SettingsSidebar onClose={toggleSidebar} />
        </div>
      )}

      {/* Settings button - MangaDex style */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-16 right-4 z-20 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all"
        aria-label="Settings"
      >
        <Settings2 size={22} />
      </button>

      {/* Navigation buttons - MangaDex style */}
      <div
        className={`fixed top-20 left-4 z-20 transition-opacity duration-300 flex flex-col ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          href={`/manga`}
          className="flex items-center justify-center w-10 h-10 mb-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full shadow-lg transition-all"
        >
          <Home size={18} />
        </Link>
        <Link
          href={`/manga/${encodeURIComponent(manga)}`}
          className="flex items-center justify-center w-10 h-10 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full shadow-lg transition-all"
        >
          <List size={18} />
        </Link>
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

      {/* Progress bar - MangaDex style */}
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
          className="fixed bottom-20 right-4 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all"
          aria-label="Scroll to top"
        >
          <ChevronUp size={22} />
        </button>
      )}
    </div>
  );
}
