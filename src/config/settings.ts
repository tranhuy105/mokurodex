import { cache } from "react";
import { getRepository } from "@/lib/database/MangaRepositoryFactory";

export interface AppConfig {
  siteName: string;
  mangaDir: string;
  ankiConnectUrl: string;
  defaultReadingMode: "single" | "double" | "longStrip";
  defaultReadingDirection: "rtl" | "ltr";
  defaultTheme: "light" | "dark" | "system";
  serverPort: number;
}

// Hard-coded default config
const defaultConfig: AppConfig = {
  siteName: "MokuroDex",
  mangaDir: process.env.MANGA_DIR || "./public/MANGA",
  ankiConnectUrl: process.env.ANKI_CONNECT_URL || "http://localhost:8765",
  defaultReadingMode: "single",
  defaultReadingDirection: "rtl",
  defaultTheme: "system",
  serverPort: parseInt(process.env.PORT || "3000", 10),
};

// Use React's cache to prevent multiple DB calls for the same config
export const getConfig = cache(async (): Promise<AppConfig> => {
  try {
    // Try to get settings from the database
    const repository = await getRepository();
    const dbSettings = await repository.getSettings();

    if (!dbSettings) {
      console.log("No settings found in database, using default config");
      return defaultConfig;
    }

    // Transform database settings to AppConfig format
    return {
      ...defaultConfig,
      // Map database settings to config format
      defaultReadingMode:
        dbSettings.readingMode === "singlePage"
          ? "single"
          : dbSettings.readingMode === "doublePage"
          ? "double"
          : "longStrip",
      defaultReadingDirection: dbSettings.rightToLeft ? "rtl" : "ltr",
      defaultTheme: dbSettings.darkMode ? "dark" : "system",
    };
  } catch (error) {
    console.error("Error loading config from database:", error);
    return defaultConfig;
  }
});

// For backward compatibility with existing code that expects a synchronous config
// Will be gradually replaced with the async version
const config: AppConfig = {
  ...defaultConfig,
};

export default config;
