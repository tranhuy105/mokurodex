"use server";

import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import { SettingsEntity } from "@/lib/database/DatabaseInterface";

/**
 * Initializes the application on startup
 * - Ensures database tables are created
 * - Sets default settings if they don't exist
 */
export async function initializeApp() {
  console.log("Initializing application...");

  try {
    // Get repository (this will initialize the database tables)
    const repository = await getRepository();

    // Check if settings exist, if not create default settings
    const existingSettings = await repository.getSettings();

    if (!existingSettings) {
      console.log("No settings found, creating default settings...");

      // Default settings
      const defaultSettings: Partial<SettingsEntity> = {
        darkMode: true,
        invertColors: false,
        rightToLeft: false,
        hasCover: false,
        showTooltips: true,
        ankiEnabled: true,
        fontSize: "auto",
        readingMode: "singlePage",
      };

      // Create settings in the database
      const createdSettings = await repository.updateSettings(defaultSettings);
      console.log("Default settings created:", createdSettings);
    } else {
      console.log("Settings already exist:", existingSettings.id);
    }

    console.log("Application initialization complete");
    return { success: true };
  } catch (error) {
    console.error("Error initializing application:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
