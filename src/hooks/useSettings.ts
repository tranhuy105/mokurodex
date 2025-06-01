"use client";

import config from "@/config/settings";
import {
    getSettings,
    updateSettings as updateSettingsAction,
} from "@/server/actions/settings";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "react-hot-toast";

// Reading modes similar to MangaDex
export type ReadingMode =
    | "singlePage"
    | "doublePage"
    | "longStrip";
export type FuriganaDisplayType =
    | "always"
    | "hover"
    | "never";
export type DictionaryProviderType =
    | "jisho"
    | "google"
    | "custom";
export type PageNavigationMethodType =
    | "click"
    | "tap"
    | "swipe"
    | "arrows";

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
    furiganaDisplay: FuriganaDisplayType;
    autoSavePosition: boolean;
    dictionaryProvider: DictionaryProviderType;
    customDictionaryUrl: string | null;
    pageNavigationMethod: PageNavigationMethodType;
    // Data directory setting
    mangaDir: string;
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
    // Data directory default from config
    mangaDir: config.mangaDir,
};

/**
 * Helper function to safely cast string values to specific types
 */
function castToEnum<T extends string>(
    value: string | undefined | null,
    defaultValue: T,
    allowedValues: T[]
): T {
    if (!value) return defaultValue;
    return allowedValues.includes(value as T)
        ? (value as T)
        : defaultValue;
}

/**
 * Hook to access and update application settings
 * Uses React Query for efficient caching and state management
 */
export function useSettings() {
    const queryClient = useQueryClient();

    // Use React Query to fetch and cache settings
    const {
        data: settings,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            try {
                const dbSettings = await getSettings();

                if (!dbSettings) {
                    console.log(
                        "No settings found in database, using defaults"
                    );
                    return defaultSettings;
                }

                // Convert the database settings to our local Settings type
                const loadedSettings: Settings = {
                    darkMode: dbSettings.darkMode,
                    invertColors: dbSettings.invertColors,
                    rightToLeft: dbSettings.rightToLeft,
                    hasCover: dbSettings.hasCover,
                    showTooltips: dbSettings.showTooltips,
                    ankiEnabled: dbSettings.ankiEnabled,
                    fontSize: dbSettings.fontSize as number,
                    readingMode: castToEnum(
                        dbSettings.readingMode,
                        defaultSettings.readingMode,
                        [
                            "singlePage",
                            "doublePage",
                            "longStrip",
                        ]
                    ),
                    animatePageTurns:
                        dbSettings.animatePageTurns ??
                        defaultSettings.animatePageTurns,
                    highlightColor:
                        dbSettings.highlightColor ??
                        defaultSettings.highlightColor,
                    readerBackground:
                        dbSettings.readerBackground ??
                        defaultSettings.readerBackground,
                    pageMargin:
                        dbSettings.pageMargin ??
                        defaultSettings.pageMargin,
                    furiganaDisplay: castToEnum(
                        dbSettings.furiganaDisplay,
                        defaultSettings.furiganaDisplay,
                        ["always", "hover", "never"]
                    ),
                    autoSavePosition:
                        dbSettings.autoSavePosition ??
                        defaultSettings.autoSavePosition,
                    dictionaryProvider: castToEnum(
                        dbSettings.dictionaryProvider,
                        defaultSettings.dictionaryProvider,
                        ["jisho", "google", "custom"]
                    ),
                    customDictionaryUrl:
                        dbSettings.customDictionaryUrl ??
                        defaultSettings.customDictionaryUrl,
                    pageNavigationMethod: castToEnum(
                        dbSettings.pageNavigationMethod,
                        defaultSettings.pageNavigationMethod,
                        ["click", "tap", "swipe", "arrows"]
                    ),
                    mangaDir: config.mangaDir,
                };

                console.log(
                    "Settings loaded from database:",
                    loadedSettings
                );
                return loadedSettings;
            } catch (err) {
                console.error(
                    "Error loading settings:",
                    err
                );
                toast.error("Failed to load settings");
                throw err;
            }
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });

    // Use mutation for updating settings
    const mutation = useMutation({
        mutationFn: updateSettingsAction,
        onMutate: async (newSettings) => {
            // Optimistically update the cache
            const previousSettings =
                queryClient.getQueryData(["settings"]);

            queryClient.setQueryData(
                ["settings"],
                (old: Settings) => ({
                    ...old,
                    ...newSettings,
                })
            );

            return { previousSettings };
        },
        onError: (err, _, context) => {
            // On error, revert to previous settings
            queryClient.setQueryData(
                ["settings"],
                context?.previousSettings
            );
            console.error("Error updating settings:", err);
            toast.error("Failed to save settings");
        },
        onSuccess: (updatedSettings) => {
            console.log(
                "Settings updated in database:",
                updatedSettings
            );

            // Only reload the page if we're not on a settings page
            if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith(
                    "/settings"
                )
            ) {
                // We're in the reader - reload to get fresh settings
                console.log(
                    "Reloading page to refresh settings"
                );
                window.location.reload();
            } else {
                console.log(
                    "On settings page - not reloading"
                );
            }
        },
    });

    // Function to update settings
    const updateSettings = useCallback(
        async (newSettings: Partial<Settings>) => {
            if (process.env.NODE_ENV !== "production") {
                console.log(
                    "Updating settings:",
                    newSettings
                );
            }

            try {
                await mutation.mutateAsync(newSettings);
            } catch {
                // Error handling is done in the mutation callbacks
            }
        },
        [mutation]
    );

    return {
        ...(settings || defaultSettings),
        updateSettings,
        isLoading,
        error,
    };
}

// Export settings type for use in components
export type { Settings };

