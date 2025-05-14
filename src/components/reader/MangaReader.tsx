"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronUp, Settings2, Home, List, BookOpen } from "lucide-react";
import SettingsSidebar from "./SettingsSidebar";
import { useSettings, useMangaReader, useReaderControls } from "@/hooks";
import { MangaPage, Volume } from "@/types/manga";
import Link from "next/link";

// Import reading modes components
import SinglePageMode from "./reading-modes/SinglePageMode";
import DoublePageMode from "./reading-modes/DoublePageMode";
import LongStripMode from "./reading-modes/LongStripMode";
import ProgressBar from "./ProgressBar";

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

  // Added states for volume navigation UI
  const [showVolumeSelector, setShowVolumeSelector] = useState(false);

  const navigateToVolume = (volumeUuid: string) => {
    if (volumeUuid !== currentVolume.mokuroData.volume_uuid) {
      window.location.href = `/manga/${encodeURIComponent(
        manga
      )}/${encodeURIComponent(volumeUuid)}/1`;
    }
    setShowVolumeSelector(false);
  };

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

  // Close volume selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        showVolumeSelector &&
        !target.closest(".volume-selector") &&
        !target.closest(".volume-button")
      ) {
        setShowVolumeSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVolumeSelector]);

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
        <div className="fixed top-0 right-0 h-full z-[1000]">
          <SettingsSidebar onClose={toggleSidebar} />
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

      {/* Navigation buttons - New layout with manga/volume controls */}
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
        </div>

        {/* Volume navigation */}
        <div className="flex items-center space-x-2">
          <div className="relative volume-selector-container">
            <button
              onClick={() => setShowVolumeSelector(!showVolumeSelector)}
              className="flex items-center justify-center px-4 py-2 bg-gray-800 bg-opacity-80 hover:bg-opacity-90 text-white rounded-lg shadow-lg transition-all volume-button"
              aria-label="Select volume"
            >
              <BookOpen size={16} className="mr-2" />
              <span className="text-sm font-medium mr-1 max-w-[100px] truncate">
                {currentVolume.mokuroData.volume ||
                  `Volume ${currentVolume.mokuroData.volume_uuid}`}
              </span>
              <ChevronDown
                size={14}
                className={`transform transition-transform ${
                  showVolumeSelector ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Volume dropdown */}
            {showVolumeSelector && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 bg-opacity-95 border border-gray-700 rounded-lg shadow-lg overflow-y-auto max-h-60 volume-selector z-[1001]">
                <div className="py-1">
                  {volumes.map((vol) => (
                    <button
                      key={vol.mokuroData.volume_uuid}
                      onClick={() =>
                        navigateToVolume(vol.mokuroData.volume_uuid)
                      }
                      className={`w-full text-left px-4 py-2 text-sm ${
                        vol.mokuroData.volume_uuid ===
                        currentVolume.mokuroData.volume_uuid
                          ? "bg-orange-500 text-white"
                          : "text-white hover:bg-gray-700"
                      }`}
                    >
                      {vol.mokuroData.volume ||
                        `Volume ${vol.mokuroData.volume_uuid}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}

// ChevronDown component
function ChevronDown(props: { size: number; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
