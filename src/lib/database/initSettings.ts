"use server";

import { getRepository } from "./MangaRepositoryFactory";

/**
 * Initializes application settings in the database
 */
export async function initializeSettings() {
  try {
    const repository = await getRepository();
    const settings = await repository.getSettings();

    if (!settings) {
      console.log("Creating default settings in database");

      await repository.updateSettings({
        darkMode: true,
        invertColors: false,
        rightToLeft: false,
        hasCover: false,
        showTooltips: true,
        ankiEnabled: true,
        fontSize: "auto",
        readingMode: "singlePage",
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to initialize settings:", error);
    return false;
  }
}
