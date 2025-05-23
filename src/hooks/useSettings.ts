"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  getSettings,
  updateSettings as updateSettingsAction,
} from "@/actions/settings-actions";

// Reading modes similar to MangaDex
export type ReadingMode = "singlePage" | "doublePage" | "longStrip";

// This type mirrors the SettingsEntity from DatabaseInterface.ts but for client use
interface Settings {
  darkMode: boolean;
  invertColors: boolean;
  rightToLeft: boolean;
  hasCover: boolean;
  showTooltips: boolean;
  ankiEnabled: boolean;
  fontSize: number | "auto";
  readingMode: ReadingMode;
  // New settings
  animatePageTurns: boolean;
  highlightColor: string;
  readerBackground: string;
  pageMargin: number;
  furiganaDisplay: "always" | "hover" | "never";
  autoSavePosition: boolean;
  dictionaryProvider: "jisho" | "google" | "custom";
  customDictionaryUrl: string | null;
  pageNavigationMethod: "click" | "tap" | "swipe" | "arrows";
}

// Default settings to use before DB settings are loaded
const defaultSettings: Settings = {
  darkMode: true,
  invertColors: false,
  rightToLeft: false,
  hasCover: false,
  showTooltips: true,
  ankiEnabled: true,
  fontSize: "auto",
  readingMode: "singlePage",
  // New settings with defaults
  animatePageTurns: true,
  highlightColor: "#FFD700", // Gold
  readerBackground: "#FFFFFF", // White
  pageMargin: 20,
  furiganaDisplay: "hover",
  autoSavePosition: true,
  dictionaryProvider: "jisho",
  customDictionaryUrl: null,
  pageNavigationMethod: "click",
};

/**
 * Hook to access and update application settings
 * Uses a database backend instead of client-side storage
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings from database on component mount
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        setIsLoading(true);
        const dbSettings = await getSettings();

        if (isMounted) {
          if (!dbSettings) {
            // If no settings in DB, use defaults
            console.log("No settings found in database, using defaults");
            setSettings(defaultSettings);
          } else {
            // Convert the database settings to our local Settings type
            const loadedSettings: Settings = {
              darkMode: dbSettings.darkMode,
              invertColors: dbSettings.invertColors,
              rightToLeft: dbSettings.rightToLeft,
              hasCover: dbSettings.hasCover,
              showTooltips: dbSettings.showTooltips,
              ankiEnabled: dbSettings.ankiEnabled,
              fontSize: dbSettings.fontSize as number,
              readingMode: dbSettings.readingMode as ReadingMode,
              // New settings
              animatePageTurns:
                dbSettings.animatePageTurns ?? defaultSettings.animatePageTurns,
              highlightColor:
                dbSettings.highlightColor ?? defaultSettings.highlightColor,
              readerBackground:
                dbSettings.readerBackground ?? defaultSettings.readerBackground,
              pageMargin: dbSettings.pageMargin ?? defaultSettings.pageMargin,
              furiganaDisplay:
                dbSettings.furiganaDisplay ?? defaultSettings.furiganaDisplay,
              autoSavePosition:
                dbSettings.autoSavePosition ?? defaultSettings.autoSavePosition,
              dictionaryProvider:
                dbSettings.dictionaryProvider ??
                defaultSettings.dictionaryProvider,
              customDictionaryUrl:
                dbSettings.customDictionaryUrl ??
                defaultSettings.customDictionaryUrl,
              pageNavigationMethod:
                dbSettings.pageNavigationMethod ??
                defaultSettings.pageNavigationMethod,
            };
            setSettings(loadedSettings);
            console.log("Settings loaded from database:", loadedSettings);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading settings:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          toast.error("Failed to load settings");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    // Cleanup function for unmounting
    return () => {
      isMounted = false;
    };
  }, []);

  // Function to update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      try {
        // Log the settings change for debugging
        if (process.env.NODE_ENV !== "production") {
          console.log(
            "Updating settings:",
            newSettings,
            "Current settings:",
            settings
          );
        }

        // First update local state immediately for better UX feedback
        setSettings((currentSettings) => ({
          ...currentSettings,
          ...newSettings,
        }));

        // Then update in the database
        const updatedSettings = await updateSettingsAction(newSettings);

        if (!updatedSettings) {
          throw new Error("Failed to update settings in database");
        }

        console.log("Settings updated in database:", updatedSettings);

        // Only reload the page if we're not on a settings page
        // This ensures we only reload when changing settings from the manga reader
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/settings")
        ) {
          // We're in the reader - reload to get fresh settings
          console.log("Reloading page to refresh settings");
          window.location.reload();
        } else {
          console.log("On settings page - not reloading");
        }
      } catch (err) {
        console.error("Error updating settings:", err);
        toast.error("Failed to save settings");
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [settings]
  );

  return {
    ...settings,
    updateSettings,
    isLoading,
    error,
  };
}

// Export settings type for use in components
export type { Settings };
