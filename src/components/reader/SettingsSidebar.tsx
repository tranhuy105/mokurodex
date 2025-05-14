"use client";

import { Button } from "@/components/ui/button";
import {
  X,
  ChevronDown,
  Settings as SettingsIcon,
  Book,
  Monitor,
  Pencil,
  Trash,
  Loader2,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAnkiCards } from "@/hooks/useAnkiCards";
import { cleanCards, getLastCardId } from "@/lib/anki-connect";
import { toast } from "react-hot-toast";
import { useState } from "react";

interface SettingsSidebarProps {
  onClose: () => void;
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

export default function SettingsSidebar({ onClose }: SettingsSidebarProps) {
  const { isLoading, error, updateSettings, ...settings } = useSettings();
  const ankiCards = useAnkiCards();

  // Track which sections are open
  const [openSections, setOpenSections] = useState({
    ankiCleaning: true,
    readingMode: true,
    appearance: true,
    anki: true,
  });

  // Add a loading state
  const [isUpdating, setIsUpdating] = useState(false);

  // Update the handlers to check if we're on a manga reader page
  const isInReader =
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/settings");

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddLastCard = async () => {
    try {
      const lastId = await getLastCardId();
      if (lastId) {
        const numericId = parseInt(String(lastId), 10);
        ankiCards.addCardToClean(numericId);
        toast.success("Last card added to cleaning queue");
      } else {
        toast.error("No recent card found");
      }
    } catch (error) {
      console.error("Error adding card to clean:", error);
      toast.error("Failed to get last card");
    }
  };

  const handleCleanCards = async () => {
    if (ankiCards.cardsToClean.length === 0) {
      toast.error("No cards to clean");
      return;
    }

    try {
      const cleanedIds = await cleanCards(ankiCards.cardsToClean);
      cleanedIds.forEach((id) => ankiCards.removeCardFromClean(id));
    } catch (error) {
      console.error("Error during card cleaning:", error);
      toast.error("Failed to clean cards");
    }
  };

  const handleBooleanToggle = (key: string, value: boolean) => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setIsUpdating(true);
    }
    updateSettings({ [key]: value });
  };

  const handleReadingModeChange = (
    mode: "singlePage" | "doublePage" | "longStrip"
  ) => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setIsUpdating(true);
    }
    updateSettings({ readingMode: mode });
  };

  const handleFontSizeChange = (fontSize: number | "auto") => {
    // Only show loading when in reader (will cause reload)
    if (isInReader) {
      setIsUpdating(true);
    }
    updateSettings({ fontSize });
  };

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
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 z-99999">
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
    <div className="h-full w-80 bg-gray-800 text-white shadow-lg overflow-y-auto">
      <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 z-99999">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <SettingsIcon size={20} className="text-orange-400" />
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
        {/* Anki Card Cleaning Section - Moved to top */}
        <div className="space-y-3">
          <SectionHeader
            title="Card Cleaning"
            icon={<Pencil size={18} className="text-orange-400" />}
            isOpen={openSections.ankiCleaning}
            onClick={() => toggleSection("ankiCleaning")}
          />

          {openSections.ankiCleaning && (
            <div className="pt-2 space-y-4 pl-1">
              <div className="space-y-2">
                <button
                  className="w-full text-left px-3 py-2 rounded bg-orange-600 hover:bg-orange-700 text-sm flex items-center gap-2 transition-colors"
                  onClick={handleAddLastCard}
                >
                  <Pencil size={16} />
                  Add Last Card to Clean
                </button>

                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                    ankiCards.cardsToClean.length === 0
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={handleCleanCards}
                  disabled={ankiCards.cardsToClean.length === 0}
                >
                  <Pencil size={16} />
                  Clean {ankiCards.cardsToClean.length} Card(s)
                </button>

                <button
                  className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                    ankiCards.cardsToClean.length === 0
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                  onClick={ankiCards.clearCardsToClean}
                  disabled={ankiCards.cardsToClean.length === 0}
                >
                  <Trash size={16} />
                  Clear Cleaning Queue
                </button>
              </div>

              {ankiCards.cardsToClean.length > 0 && (
                <div className="p-2 bg-gray-700 rounded-md">
                  <p className="text-xs">
                    {ankiCards.cardsToClean.length} card(s) queued for cleaning
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reading Mode Section */}
        <div className="space-y-3">
          <SectionHeader
            title="Reading Mode"
            icon={<Book size={18} className="text-orange-400" />}
            isOpen={openSections.readingMode}
            onClick={() => toggleSection("readingMode")}
          />

          {openSections.readingMode && (
            <div className="pt-2 space-y-4 pl-1">
              <div className="flex flex-col gap-2">
                <ModeButton
                  label="Single Page"
                  isActive={settings.readingMode === "singlePage"}
                  onClick={() => handleReadingModeChange("singlePage")}
                />
                <ModeButton
                  label="Double Page"
                  isActive={settings.readingMode === "doublePage"}
                  onClick={() => handleReadingModeChange("doublePage")}
                />
                <ModeButton
                  label="Long Strip"
                  isActive={settings.readingMode === "longStrip"}
                  onClick={() => handleReadingModeChange("longStrip")}
                />
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="text-sm font-medium mb-2">
                  Reading Direction
                </div>
                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm">
                    Right to Left (Japanese style)
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.rightToLeft}
                      onChange={(e) =>
                        handleBooleanToggle("rightToLeft", e.target.checked)
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
            icon={<Monitor size={18} className="text-orange-400" />}
            isOpen={openSections.appearance}
            onClick={() => toggleSection("appearance")}
          />

          {openSections.appearance && (
            <div className="pt-2 space-y-4 pl-1">
              <div className="space-y-2">
                <div className="text-sm font-medium mb-1">Font Size</div>
                <div className="flex gap-2">
                  <ModeButton
                    label="Auto"
                    isActive={settings.fontSize === "auto"}
                    onClick={() => handleFontSizeChange("auto")}
                  />
                  <ModeButton
                    label="Small"
                    isActive={settings.fontSize === 12}
                    onClick={() => handleFontSizeChange(12)}
                  />
                  <ModeButton
                    label="Medium"
                    isActive={settings.fontSize === 16}
                    onClick={() => handleFontSizeChange(16)}
                  />
                  <ModeButton
                    label="Large"
                    isActive={settings.fontSize === 20}
                    onClick={() => handleFontSizeChange(20)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-sm font-medium">Display Options</div>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm">Dark Mode</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) =>
                        handleBooleanToggle("darkMode", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                  </div>
                </label>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm">Invert Colors</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.invertColors}
                      onChange={(e) =>
                        handleBooleanToggle("invertColors", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-orange-500" />
                    <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-all peer-checked:left-5" />
                  </div>
                </label>

                <label className="flex items-center justify-between py-1.5 cursor-pointer">
                  <span className="text-sm">Show Text on Hover</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={settings.showTooltips}
                      onChange={(e) =>
                        handleBooleanToggle("showTooltips", e.target.checked)
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
            icon={<Pencil size={18} className="text-orange-400" />}
            isOpen={openSections.anki}
            onClick={() => toggleSection("anki")}
          />

          {openSections.anki && (
            <div className="pt-2 space-y-4 pl-1">
              <label className="flex items-center justify-between py-1.5 cursor-pointer">
                <span className="text-sm">Enable Anki Integration</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.ankiEnabled}
                    onChange={(e) =>
                      handleBooleanToggle("ankiEnabled", e.target.checked)
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

      {isUpdating && isInReader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-400 mb-4" />
            <p className="text-lg font-medium text-white">
              Applying settings...
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Page will reload to update the reader
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
