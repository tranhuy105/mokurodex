"use server";

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// Type for settings input
export type SettingsInput = {
  darkMode?: boolean;
  invertColors?: boolean;
  rightToLeft?: boolean;
  hasCover?: boolean;
  showTooltips?: boolean;
  ankiEnabled?: boolean;
  fontSize?: number | "auto";
  readingMode?: "singlePage" | "doublePage" | "longStrip";
  animatePageTurns?: boolean;
  highlightColor?: string;
  readerBackground?: string;
  pageMargin?: number;
  furiganaDisplay?: "always" | "hover" | "never";
  autoSavePosition?: boolean;
  dictionaryProvider?: "jisho" | "google" | "custom";
  customDictionaryUrl?: string | null;
  pageNavigationMethod?: "click" | "tap" | "swipe" | "arrows";
};

/**
 * Get application settings
 */
export async function getSettings() {
  try {
    // Get the first settings record - there should be only one
    const settings = await prisma.settings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      return createDefaultSettings();
    }

    // Convert fontSize from string to number or "auto"
    const fontSize =
      settings.fontSize === "auto" ? "auto" : parseInt(settings.fontSize, 10);

    return {
      ...settings,
      fontSize,
    };
  } catch (error) {
    console.error("Error getting settings:", error);
    return createDefaultSettings();
  }
}

/**
 * Update application settings
 */
export async function updateSettings(input: SettingsInput) {
  try {
    const now = new Date();

    // Get existing settings
    const existingSettings = await prisma.settings.findFirst();

    // Convert fontSize to string for storage
    const fontSizeString =
      input.fontSize === undefined
        ? undefined
        : input.fontSize === "auto"
        ? "auto"
        : input.fontSize.toString();

    if (!existingSettings) {
      // Create new settings if none exist
      const newSettings = await prisma.settings.create({
        data: {
          id: nanoid(),
          darkMode: input.darkMode ?? true,
          invertColors: input.invertColors ?? false,
          rightToLeft: input.rightToLeft ?? false,
          hasCover: input.hasCover ?? false,
          showTooltips: input.showTooltips ?? true,
          ankiEnabled: input.ankiEnabled ?? true,
          fontSize: fontSizeString ?? "auto",
          readingMode: input.readingMode ?? "singlePage",
          animatePageTurns: input.animatePageTurns ?? true,
          highlightColor: input.highlightColor ?? "#FFD700",
          readerBackground: input.readerBackground ?? "#FFFFFF",
          pageMargin: input.pageMargin ?? 20,
          furiganaDisplay: input.furiganaDisplay ?? "hover",
          autoSavePosition: input.autoSavePosition ?? true,
          dictionaryProvider: input.dictionaryProvider ?? "jisho",
          customDictionaryUrl: input.customDictionaryUrl ?? null,
          pageNavigationMethod: input.pageNavigationMethod ?? "click",
          updatedAt: now,
        },
      });

      // Convert fontSize back to number or "auto" for return value
      const fontSize =
        newSettings.fontSize === "auto"
          ? "auto"
          : parseInt(newSettings.fontSize, 10);

      revalidatePath("/settings");
      return {
        ...newSettings,
        fontSize,
      };
    } else {
      // Update existing settings
      const updatedSettings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          darkMode: input.darkMode,
          invertColors: input.invertColors,
          rightToLeft: input.rightToLeft,
          hasCover: input.hasCover,
          showTooltips: input.showTooltips,
          ankiEnabled: input.ankiEnabled,
          fontSize: fontSizeString,
          readingMode: input.readingMode,
          animatePageTurns: input.animatePageTurns,
          highlightColor: input.highlightColor,
          readerBackground: input.readerBackground,
          pageMargin: input.pageMargin,
          furiganaDisplay: input.furiganaDisplay,
          autoSavePosition: input.autoSavePosition,
          dictionaryProvider: input.dictionaryProvider,
          customDictionaryUrl: input.customDictionaryUrl,
          pageNavigationMethod: input.pageNavigationMethod,
          updatedAt: now,
        },
      });

      // Convert fontSize back to number or "auto" for return value
      const fontSize =
        updatedSettings.fontSize === "auto"
          ? "auto"
          : parseInt(updatedSettings.fontSize, 10);

      revalidatePath("/settings");
      return {
        ...updatedSettings,
        fontSize,
      };
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    throw new Error("Failed to update settings");
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettingsToDefaults() {
  try {
    const existingSettings = await prisma.settings.findFirst();

    if (existingSettings) {
      await prisma.settings.delete({
        where: { id: existingSettings.id },
      });
    }

    const defaultSettings = await createDefaultSettings();
    revalidatePath("/settings");
    return defaultSettings;
  } catch (error) {
    console.error("Error resetting settings:", error);
    throw new Error("Failed to reset settings");
  }
}

/**
 * Create default settings
 */
async function createDefaultSettings() {
  const now = new Date();

  const defaultSettings = await prisma.settings.create({
    data: {
      id: nanoid(),
      darkMode: true,
      invertColors: false,
      rightToLeft: false,
      hasCover: false,
      showTooltips: true,
      ankiEnabled: true,
      fontSize: "auto",
      readingMode: "singlePage",
      animatePageTurns: true,
      highlightColor: "#FFD700",
      readerBackground: "#FFFFFF",
      pageMargin: 20,
      furiganaDisplay: "hover",
      autoSavePosition: true,
      dictionaryProvider: "jisho",
      customDictionaryUrl: null,
      pageNavigationMethod: "click",
      updatedAt: now,
    },
  });

  return {
    ...defaultSettings,
    fontSize: "auto",
  };
}
