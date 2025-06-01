"use client";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { Volume } from "@prisma/client";
import {
    Book,
    BookOpen,
    ChevronDown,
    Loader2,
    Monitor,
    Pencil,
    Settings as SettingsIcon,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface SettingsSidebarProps {
  onClose: () => void;
  // Add props for volume navigation and page navigation
  currentPage?: number;
  totalPages?: number;
  volumes?: Volume[];
  currentVolume?: Volume;
  onPageChange?: (page: number) => void;
  onVolumeChange?: (volumeId: string) => void;
}

// Section header component with toggle functionality
function SectionHeader({
  title,
  icon,
  isOpen,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-2 px-1 border-b border-gray-700 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium">{title}</h4>
      </div>
      <ChevronDown
        className={`h-4 w-4 transition-transform ${
          isOpen ? "transform rotate-180" : ""
        }`}
      />
    </div>
  );
}

// Option button component for mode selection
function ModeButton({
  label,
  isActive,
  onClick,
  disabled = false,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-orange-600 text-white"
          : disabled
          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );
}

export default function SettingsSidebar({
  onClose,
  currentPage = 1,
  totalPages = 0,
  volumes = [],
  currentVolume,
  onPageChange,
  onVolumeChange,
}: SettingsSidebarProps) {
  const { isLoading, error, updateSettings, ...settings } = useSettings();

  // Track which sections are open
  const [openSections, setOpenSections] = useState({
    navigation: true,
    readingMode: true,
    appearance: true,
    anki: true,
  });

  // Add a loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // State for page input
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Update the handlers to check if we're on a manga reader page
  const isInReader =
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/settings");

  // Add a state to track the current loading operation type
  const [loadingOperation, setLoadingOperation] = useState<
    "settings" | "page" | "volume"
  >("settings");

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBooleanToggle = (key: string, value: boolean) => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setLoadingOperation("settings");
      setIsUpdating(true);
    }
    updateSettings({ [key]: value });
  };

  const handleReadingModeChange = (
    mode: "singlePage" | "doublePage" | "longStrip"
  ) => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setLoadingOperation("settings");
      setIsUpdating(true);
    }
    updateSettings({ readingMode: mode });
  };

  const handleFontSizeChange = (fontSize: number | "auto") => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setLoadingOperation("settings");
      setIsUpdating(true);
    }
    updateSettings({ fontSize });
  };

  // Handle page navigation
  const handlePageChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onPageChange) return;

    const newPage = parseInt(pageInput);
    if (isNaN(newPage) || newPage < 1 || newPage > totalPages) {
      toast.error(`Please enter a page number between 1 and ${totalPages}`);
      setPageInput(currentPage.toString());
      return;
    }

    // For long strip mode, show loading indicator immediately
    if (settings.readingMode === "longStrip") {
      setLoadingOperation("page");
      setIsUpdating(true);
    }

    // Call the page change callback
    onPageChange(newPage);

    // For all modes, give some visual feedback
    if (settings.readingMode === "longStrip") {
      // Remove loading after a reasonable time
      setTimeout(() => {
        setIsUpdating(false);
      }, 800); // Longer timeout to allow for page scrolling
    }
  };

  // Helper function for page navigation with loading indicator
  const navigateToPage = (newPage: number) => {
    if (!onPageChange) return;

    // For long strip mode, show loading indicator immediately
    if (settings.readingMode === "longStrip") {
      setLoadingOperation("page");
      setIsUpdating(true);
    }

    // Call the page change callback
    onPageChange(newPage);

    // For long strip mode, give some visual feedback
    if (settings.readingMode === "longStrip") {
      // Remove loading after a reasonable time
      setTimeout(() => {
        setIsUpdating(false);
      }, 800); // Longer timeout to allow for page scrolling
    }
  };

  // Handle volume change
  const handleVolumeChange = (volumeId: string) => {
    if (!onVolumeChange || isUpdating) return;

    // Show loading overlay immediately to block UI interaction
    setLoadingOperation("volume");
    setIsUpdating(true);

    // Use setTimeout to ensure the loading indicator is visible before any potential errors occur
    setTimeout(() => {
      try {
        // Call the volume change callback
        onVolumeChange(volumeId);

        // Keep loading state active during the page transition
        // It will be cleared on the new page load
      } catch (error) {
        console.error("Error changing volume:", error);

        // In case of error, remove loading state after a delay
        setTimeout(() => {
          setIsUpdating(false);
          toast.error("Failed to switch volume. Please try again.");
        }, 500);
      }
    }, 10);
  };

  // Update page input when currentPage changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Display a loading state while settings are being fetched
  if (isLoading) {
    return (
      <div className="h-full w-80 bg-gray-800 text-white shadow-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400 mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  // Display an error state if settings couldn't be loaded
  if (error) {
    return (
      <div className="h-full w-80 bg-gray-800 text-white shadow-lg p-4">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 z-99999 no-scrollbar">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <SettingsIcon size={20} className="text-orange-400" />
              Settings Error
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        <div className="p-4 text-red-400">
          <p>Failed to load settings: {error.message}</p>
          <Button
            variant="default"
            className="mt-4 bg-red-600 hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="h-full w-80 bg-gray-800 text-white shadow-lg overflow-y-auto no-scrollbar">
          <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 z-99999">
              <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                      <SettingsIcon
                          size={20}
                          className="text-orange-400"
                      />
                      Reader Settings
                  </h3>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1"
                  >
                      <X size={20} />
                  </Button>
              </div>
          </div>

          <div className="p-4 space-y-6">
              {/* Navigation Section */}
              <div className="space-y-3">
                  <SectionHeader
                      title="Navigation"
                      icon={
                          <BookOpen
                              size={18}
                              className="text-orange-400"
                          />
                      }
                      isOpen={openSections.navigation}
                      onClick={() =>
                          toggleSection("navigation")
                      }
                  />

                  {openSections.navigation && (
                      <div className="pt-2 space-y-4 pl-1">
                          {/* Page Navigation */}
                          <div className="space-y-2">
                              <div className="text-sm font-medium mb-1">
                                  Page Navigation
                              </div>
                              <div className="bg-gray-700 rounded-md p-2 border border-gray-600">
                                  <div className="flex items-center justify-between mb-3">
                                      <button
                                          onClick={() => {
                                              if (
                                                  !onPageChange
                                              )
                                                  return;
                                              const newPage =
                                                  Math.max(
                                                      1,
                                                      currentPage -
                                                          1
                                                  );
                                              navigateToPage(
                                                  newPage
                                              );
                                          }}
                                          disabled={
                                              currentPage <=
                                              1
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-gray-300 bg-gray-800 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                          aria-label="Previous page"
                                      >
                                          <ChevronDown className="w-4 h-4 transform rotate-90" />
                                      </button>

                                      <div className="flex items-center gap-2">
                                          <span className="text-sm">
                                              {currentPage}{" "}
                                              / {totalPages}
                                          </span>
                                      </div>

                                      <button
                                          onClick={() => {
                                              if (
                                                  !onPageChange
                                              )
                                                  return;
                                              const newPage =
                                                  Math.min(
                                                      totalPages,
                                                      currentPage +
                                                          1
                                                  );
                                              navigateToPage(
                                                  newPage
                                              );
                                          }}
                                          disabled={
                                              currentPage >=
                                              totalPages
                                          }
                                          className="w-8 h-8 flex items-center justify-center text-gray-300 bg-gray-800 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                          aria-label="Next page"
                                      >
                                          <ChevronDown className="w-4 h-4 transform -rotate-90" />
                                      </button>
                                  </div>

                                  <form
                                      onSubmit={
                                          handlePageChange
                                      }
                                      className="flex gap-2 items-center"
                                  >
                                      <input
                                          type="number"
                                          value={pageInput}
                                          onChange={(e) =>
                                              setPageInput(
                                                  e.target
                                                      .value
                                              )
                                          }
                                          min={1}
                                          max={totalPages}
                                          className="bg-gray-800 text-white rounded-md px-2 py-1 text-sm flex-1 h-8 border border-gray-600 focus:border-orange-500 focus:outline-none"
                                          aria-label="Go to page"
                                      />
                                      <Button
                                          type="submit"
                                          variant="secondary"
                                          size="sm"
                                          className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                      >
                                          Go
                                      </Button>
                                  </form>
                              </div>
                          </div>

                          {/* Volume Selection */}
                          {volumes.length > 0 && (
                              <div className="space-y-2">
                                  <div className="text-sm font-medium mb-1">
                                      Volume
                                  </div>
                                  <div className="bg-gray-700 rounded-md p-2 border border-gray-600">
                                      <div className="flex items-center justify-between mb-2">
                                          <button
                                              onClick={() => {
                                                  if (
                                                      !currentVolume ||
                                                      volumes.length <=
                                                          1
                                                  )
                                                      return;
                                                  const currentIndex =
                                                      volumes.findIndex(
                                                          (
                                                              vol
                                                          ) =>
                                                              vol.volumeUuid ===
                                                              currentVolume.volumeUuid
                                                      );
                                                  if (
                                                      currentIndex >
                                                      0
                                                  ) {
                                                      handleVolumeChange(
                                                          volumes[
                                                              currentIndex -
                                                                  1
                                                          ]
                                                              .volumeUuid
                                                      );
                                                  }
                                              }}
                                              disabled={
                                                  !currentVolume ||
                                                  volumes.findIndex(
                                                      (
                                                          vol
                                                      ) =>
                                                          vol.volumeUuid ===
                                                          currentVolume.volumeUuid
                                                  ) <= 0
                                              }
                                              className="w-8 h-8 flex items-center justify-center text-gray-300 bg-gray-800 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                              aria-label="Previous volume"
                                          >
                                              <ChevronDown className="w-4 h-4 transform rotate-90" />
                                          </button>

                                          <div className="relative flex-1 mx-2">
                                              <select
                                                  value={
                                                      currentVolume?.volumeUuid
                                                  }
                                                  onChange={(
                                                      e
                                                  ) =>
                                                      handleVolumeChange(
                                                          e
                                                              .target
                                                              .value
                                                      )
                                                  }
                                                  className="w-full bg-gray-800 text-white rounded-md px-2 py-1 text-sm h-8 border border-gray-600 focus:border-orange-500 focus:outline-none appearance-none"
                                              >
                                                  {volumes.map(
                                                      (
                                                          vol
                                                      ) => (
                                                          <option
                                                              key={
                                                                  vol.volumeUuid
                                                              }
                                                              value={
                                                                  vol.volumeUuid
                                                              }
                                                          >
                                                              {vol.volumeTitle ||
                                                                  `Volume ${vol.volumeUuid}`}
                                                          </option>
                                                      )
                                                  )}
                                              </select>
                                              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                          </div>

                                          <button
                                              onClick={() => {
                                                  if (
                                                      !currentVolume ||
                                                      volumes.length <=
                                                          1
                                                  )
                                                      return;
                                                  const currentIndex =
                                                      volumes.findIndex(
                                                          (
                                                              vol
                                                          ) =>
                                                              vol.volumeUuid ===
                                                              currentVolume.volumeUuid
                                                      );
                                                  if (
                                                      currentIndex <
                                                      volumes.length -
                                                          1
                                                  ) {
                                                      handleVolumeChange(
                                                          volumes[
                                                              currentIndex +
                                                                  1
                                                          ]
                                                              .volumeUuid
                                                      );
                                                  }
                                              }}
                                              disabled={
                                                  !currentVolume ||
                                                  volumes.findIndex(
                                                      (
                                                          vol
                                                      ) =>
                                                          vol.volumeUuid ===
                                                          currentVolume.volumeUuid
                                                  ) >=
                                                      volumes.length -
                                                          1
                                              }
                                              className="w-8 h-8 flex items-center justify-center text-gray-300 bg-gray-800 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                              aria-label="Next volume"
                                          >
                                              <ChevronDown className="w-4 h-4 transform -rotate-90" />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Quick Actions */}
                          <div className="space-y-2">
                              <div className="text-sm font-medium mb-1">
                                  Quick Actions
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                  <Button
                                      className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
                                      onClick={() => {
                                          if (!onPageChange)
                                              return;
                                          navigateToPage(1);
                                      }}
                                      size="sm"
                                  >
                                      First Page
                                  </Button>

                                  <Button
                                      className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm"
                                      onClick={() => {
                                          if (!onPageChange)
                                              return;
                                          navigateToPage(
                                              totalPages
                                          );
                                      }}
                                      size="sm"
                                  >
                                      Last Page
                                  </Button>
                              </div>
                          </div>

                          {/* Uploader Information */}
                          {currentVolume && (
                              <div className="space-y-2">
                                  <div className="text-sm font-medium mb-1">
                                      Uploaded By
                                  </div>
                                  <div className="bg-gray-700 rounded-md p-2 border border-gray-600 space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                          <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                                              <svg
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  className="w-4 h-4"
                                              >
                                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                  <circle
                                                      cx="12"
                                                      cy="7"
                                                      r="4"
                                                  ></circle>
                                              </svg>
                                          </span>
                                          <span className="flex-1">
                                              MokuroDexScan
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                          <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                                              <svg
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  className="w-4 h-4"
                                              >
                                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                                  <circle
                                                      cx="12"
                                                      cy="7"
                                                      r="4"
                                                  ></circle>
                                              </svg>
                                          </span>
                                          <span className="flex-1 text-blue-400">
                                              tranhuy105
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              {/* Reading Mode Section */}
              <div className="space-y-3">
                  <SectionHeader
                      title="Reading Mode"
                      icon={
                          <Book
                              size={18}
                              className="text-orange-400"
                          />
                      }
                      isOpen={openSections.readingMode}
                      onClick={() =>
                          toggleSection("readingMode")
                      }
                  />

                  {openSections.readingMode && (
                      <div className="pt-2 space-y-4 pl-1">
                          <div className="flex flex-col gap-2">
                              <ModeButton
                                  label="Single Page"
                                  isActive={
                                      settings.readingMode ===
                                      "singlePage"
                                  }
                                  onClick={() =>
                                      handleReadingModeChange(
                                          "singlePage"
                                      )
                                  }
                              />
                              <ModeButton
                                  label="Double Page"
                                  isActive={
                                      settings.readingMode ===
                                      "doublePage"
                                  }
                                  onClick={() =>
                                      handleReadingModeChange(
                                          "doublePage"
                                      )
                                  }
                              />
                              <ModeButton
                                  label="Long Strip"
                                  isActive={
                                      settings.readingMode ===
                                      "longStrip"
                                  }
                                  onClick={() =>
                                      handleReadingModeChange(
                                          "longStrip"
                                      )
                                  }
                              />
                          </div>

                          <div className="border-t border-gray-700 pt-3">
                              <div className="text-sm font-medium mb-2">
                                  Reading Direction
                              </div>
                              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                  <span className="text-sm">
                                      Right to Left
                                      (Japanese style)
                                  </span>
                                  <div className="relative">
                                      <input
                                          type="checkbox"
                                          checked={
                                              settings.rightToLeft
                                          }
                                          onChange={(e) =>
                                              handleBooleanToggle(
                                                  "rightToLeft",
                                                  e.target
                                                      .checked
                                              )
                                          }
                                          className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                                      <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                                  </div>
                              </label>
                          </div>
                      </div>
                  )}
              </div>

              {/* Appearance Section */}
              <div className="space-y-3">
                  <SectionHeader
                      title="Appearance"
                      icon={
                          <Monitor
                              size={18}
                              className="text-orange-400"
                          />
                      }
                      isOpen={openSections.appearance}
                      onClick={() =>
                          toggleSection("appearance")
                      }
                  />

                  {openSections.appearance && (
                      <div className="pt-2 space-y-4 pl-1">
                          <div className="space-y-2">
                              <div className="text-sm font-medium mb-1">
                                  Font Size
                              </div>
                              <div className="flex gap-2">
                                  <ModeButton
                                      label="Auto"
                                      isActive={
                                          settings.fontSize ===
                                          "auto"
                                      }
                                      onClick={() =>
                                          handleFontSizeChange(
                                              "auto"
                                          )
                                      }
                                  />
                                  <ModeButton
                                      label="Small"
                                      isActive={
                                          settings.fontSize ===
                                          12
                                      }
                                      onClick={() =>
                                          handleFontSizeChange(
                                              12
                                          )
                                      }
                                  />
                                  <ModeButton
                                      label="Medium"
                                      isActive={
                                          settings.fontSize ===
                                          16
                                      }
                                      onClick={() =>
                                          handleFontSizeChange(
                                              16
                                          )
                                      }
                                  />
                                  <ModeButton
                                      label="Large"
                                      isActive={
                                          settings.fontSize ===
                                          20
                                      }
                                      onClick={() =>
                                          handleFontSizeChange(
                                              20
                                          )
                                      }
                                  />
                              </div>
                          </div>

                          <div className="space-y-3 pt-2">
                              <div className="text-sm font-medium">
                                  Display Options
                              </div>

                              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                  <span className="text-sm">
                                      Dark Mode
                                  </span>
                                  <div className="relative">
                                      <input
                                          type="checkbox"
                                          checked={
                                              settings.darkMode
                                          }
                                          onChange={(e) =>
                                              handleBooleanToggle(
                                                  "darkMode",
                                                  e.target
                                                      .checked
                                              )
                                          }
                                          className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                                      <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                                  </div>
                              </label>

                              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                  <span className="text-sm">
                                      Invert Colors
                                  </span>
                                  <div className="relative">
                                      <input
                                          type="checkbox"
                                          checked={
                                              settings.invertColors
                                          }
                                          onChange={(e) =>
                                              handleBooleanToggle(
                                                  "invertColors",
                                                  e.target
                                                      .checked
                                              )
                                          }
                                          className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                                      <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                                  </div>
                              </label>

                              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                                  <span className="text-sm">
                                      Show Text on Hover
                                  </span>
                                  <div className="relative">
                                      <input
                                          type="checkbox"
                                          checked={
                                              settings.showTooltips
                                          }
                                          onChange={(e) =>
                                              handleBooleanToggle(
                                                  "showTooltips",
                                                  e.target
                                                      .checked
                                              )
                                          }
                                          className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                                      <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                                  </div>
                              </label>
                          </div>
                      </div>
                  )}
              </div>

              {/* Anki Integration Section */}
              <div className="space-y-3">
                  <SectionHeader
                      title="Anki Settings"
                      icon={
                          <Pencil
                              size={18}
                              className="text-orange-400"
                          />
                      }
                      isOpen={openSections.anki}
                      onClick={() => toggleSection("anki")}
                  />

                  {openSections.anki && (
                      <div className="pt-2 space-y-4 pl-1">
                          <label className="flex items-center justify-between py-1.5 cursor-pointer">
                              <span className="text-sm">
                                  Enable Anki Integration
                              </span>
                              <div className="relative">
                                  <input
                                      type="checkbox"
                                      checked={
                                          settings.ankiEnabled
                                      }
                                      onChange={(e) =>
                                          handleBooleanToggle(
                                              "ankiEnabled",
                                              e.target
                                                  .checked
                                          )
                                      }
                                      className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                                  <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                              </div>
                          </label>
                      </div>
                  )}
              </div>
          </div>

          {isUpdating && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999]">
                  <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm text-center">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-400 mb-4" />
                      <p className="text-lg font-medium text-white">
                          {loadingOperation === "volume"
                              ? "Changing Volume..."
                              : loadingOperation === "page"
                              ? "Changing Page..."
                              : "Applying Settings..."}
                      </p>
                      <p className="text-sm text-gray-300 mt-2">
                          {loadingOperation === "volume"
                              ? "Please wait while the reader reloads"
                              : "Please wait while the reader updates"}
                      </p>
                  </div>
              </div>
          )}
      </div>
  );
}
