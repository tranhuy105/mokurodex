"use server";

import Database from "better-sqlite3";
import path from "path";
import { SettingsEntity } from "./DatabaseInterface";
import { nanoid } from "nanoid";

// Path to the SQLite database file
const DB_PATH = path.join(process.cwd(), "data", "manga-management.db");

// Define type for DB row
interface SettingsRow {
  id: string;
  darkMode: number;
  invertColors: number;
  rightToLeft: number;
  hasCover: number;
  showTooltips: number;
  ankiEnabled: number;
  fontSize: string;
  readingMode: string;
  animatePageTurns: number;
  highlightColor: string;
  readerBackground: string;
  pageMargin: number;
  furiganaDisplay: string;
  autoSavePosition: number;
  dictionaryProvider: string;
  customDictionaryUrl: string | null;
  pageNavigationMethod: string;
  updatedAt: string;
}

// Direct SQL interface functions for settings

/**
 * Get a direct database connection - synchronous version for internal use
 */
function getDbSync(): Database.Database {
  return new Database(DB_PATH, { verbose: console.log });
}

/**
 * Get a direct database connection - async version for server actions
 */
export async function getDb(): Promise<Database.Database> {
  try {
    return new Database(DB_PATH, { verbose: console.log });
  } catch (error) {
    console.error("Error opening database connection:", error);
    throw error;
  }
}

/**
 * Get settings directly from the database using SQL
 */
export async function getSettingsRaw(): Promise<SettingsEntity | null> {
  try {
    // Use synchronous version to avoid unnecessary awaits
    const db = getDbSync();

    // Execute SQL directly to get settings
    const settings = db
      .prepare(
        `
      SELECT 
        id, 
        darkMode, 
        invertColors, 
        rightToLeft, 
        hasCover, 
        showTooltips, 
        ankiEnabled, 
        fontSize, 
        readingMode, 
        animatePageTurns,
        highlightColor,
        readerBackground,
        pageMargin,
        furiganaDisplay,
        autoSavePosition,
        dictionaryProvider,
        customDictionaryUrl,
        pageNavigationMethod,
        updatedAt 
      FROM settings 
      LIMIT 1
    `
      )
      .get() as SettingsRow | undefined;

    if (!settings) {
      console.log("No settings found in database");
      return null;
    }

    // Convert from DB row format to SettingsEntity
    return {
      id: settings.id,
      darkMode: Boolean(settings.darkMode),
      invertColors: Boolean(settings.invertColors),
      rightToLeft: Boolean(settings.rightToLeft),
      hasCover: Boolean(settings.hasCover),
      showTooltips: Boolean(settings.showTooltips),
      ankiEnabled: Boolean(settings.ankiEnabled),
      fontSize:
        settings.fontSize === "auto" ? "auto" : parseInt(settings.fontSize, 10),
      readingMode: settings.readingMode as
        | "singlePage"
        | "doublePage"
        | "longStrip",
      animatePageTurns: Boolean(settings.animatePageTurns),
      highlightColor: settings.highlightColor,
      readerBackground: settings.readerBackground,
      pageMargin: settings.pageMargin,
      furiganaDisplay: settings.furiganaDisplay as "always" | "hover" | "never",
      autoSavePosition: Boolean(settings.autoSavePosition),
      dictionaryProvider: settings.dictionaryProvider as
        | "jisho"
        | "google"
        | "custom",
      customDictionaryUrl: settings.customDictionaryUrl,
      pageNavigationMethod: settings.pageNavigationMethod as
        | "click"
        | "tap"
        | "swipe"
        | "arrows",
      updatedAt: settings.updatedAt,
    };
  } catch (error) {
    console.error("Error getting settings directly from database:", error);
    return null;
  }
}

/**
 * Update settings directly in the database using SQL
 */
export async function updateSettingsRaw(
  partialSettings: Partial<SettingsEntity>
): Promise<SettingsEntity | null> {
  try {
    const db = getDbSync();
    const now = new Date().toISOString();

    // Get existing settings
    const existingSettings = db
      .prepare(
        `
      SELECT * FROM settings LIMIT 1
    `
      )
      .get() as SettingsRow | undefined;

    // If no settings exist, create new settings
    if (!existingSettings) {
      const id = nanoid();
      const settings = {
        id,
        darkMode: partialSettings.darkMode ?? true,
        invertColors: partialSettings.invertColors ?? false,
        rightToLeft: partialSettings.rightToLeft ?? false,
        hasCover: partialSettings.hasCover ?? false,
        showTooltips: partialSettings.showTooltips ?? true,
        ankiEnabled: partialSettings.ankiEnabled ?? true,
        fontSize: partialSettings.fontSize ?? "auto",
        readingMode: partialSettings.readingMode ?? "singlePage",
        animatePageTurns: partialSettings.animatePageTurns ?? false,
        highlightColor: partialSettings.highlightColor ?? "",
        readerBackground: partialSettings.readerBackground ?? "",
        pageMargin: partialSettings.pageMargin ?? 0,
        furiganaDisplay: partialSettings.furiganaDisplay ?? "never",
        autoSavePosition: partialSettings.autoSavePosition ?? false,
        dictionaryProvider: partialSettings.dictionaryProvider ?? "jisho",
        customDictionaryUrl: partialSettings.customDictionaryUrl ?? null,
        pageNavigationMethod: partialSettings.pageNavigationMethod ?? "click",
        updatedAt: now,
      };

      // Direct SQL insert
      db.prepare(
        `
        INSERT INTO settings (
          id, darkMode, invertColors, rightToLeft, hasCover,
          showTooltips, ankiEnabled, fontSize, readingMode, animatePageTurns,
          highlightColor, readerBackground, pageMargin, furiganaDisplay,
          autoSavePosition, dictionaryProvider, customDictionaryUrl, pageNavigationMethod, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        settings.id,
        settings.darkMode ? 1 : 0,
        settings.invertColors ? 1 : 0,
        settings.rightToLeft ? 1 : 0,
        settings.hasCover ? 1 : 0,
        settings.showTooltips ? 1 : 0,
        settings.ankiEnabled ? 1 : 0,
        settings.fontSize.toString(),
        settings.readingMode,
        settings.animatePageTurns ? 1 : 0,
        settings.highlightColor,
        settings.readerBackground,
        settings.pageMargin,
        settings.furiganaDisplay,
        settings.autoSavePosition ? 1 : 0,
        settings.dictionaryProvider,
        settings.customDictionaryUrl || "",
        settings.pageNavigationMethod,
        settings.updatedAt
      );

      return settings;
    }

    // Update existing settings
    const updates: string[] = [];
    const params: (string | number)[] = [];
    const resultSettings: SettingsRow = { ...existingSettings };

    // Build SQL update for each provided setting
    if (partialSettings.darkMode !== undefined) {
      updates.push("darkMode = ?");
      params.push(partialSettings.darkMode ? 1 : 0);
      resultSettings.darkMode = partialSettings.darkMode ? 1 : 0;
    }

    if (partialSettings.invertColors !== undefined) {
      updates.push("invertColors = ?");
      params.push(partialSettings.invertColors ? 1 : 0);
      resultSettings.invertColors = partialSettings.invertColors ? 1 : 0;
    }

    if (partialSettings.rightToLeft !== undefined) {
      updates.push("rightToLeft = ?");
      params.push(partialSettings.rightToLeft ? 1 : 0);
      resultSettings.rightToLeft = partialSettings.rightToLeft ? 1 : 0;
    }

    if (partialSettings.hasCover !== undefined) {
      updates.push("hasCover = ?");
      params.push(partialSettings.hasCover ? 1 : 0);
      resultSettings.hasCover = partialSettings.hasCover ? 1 : 0;
    }

    if (partialSettings.showTooltips !== undefined) {
      updates.push("showTooltips = ?");
      params.push(partialSettings.showTooltips ? 1 : 0);
      resultSettings.showTooltips = partialSettings.showTooltips ? 1 : 0;
    }

    if (partialSettings.ankiEnabled !== undefined) {
      updates.push("ankiEnabled = ?");
      params.push(partialSettings.ankiEnabled ? 1 : 0);
      resultSettings.ankiEnabled = partialSettings.ankiEnabled ? 1 : 0;
    }

    if (partialSettings.fontSize !== undefined) {
      updates.push("fontSize = ?");
      params.push(partialSettings.fontSize.toString());
      resultSettings.fontSize = partialSettings.fontSize.toString();
    }

    if (partialSettings.readingMode !== undefined) {
      updates.push("readingMode = ?");
      params.push(partialSettings.readingMode);
      resultSettings.readingMode = partialSettings.readingMode;
    }

    if (partialSettings.animatePageTurns !== undefined) {
      updates.push("animatePageTurns = ?");
      params.push(partialSettings.animatePageTurns ? 1 : 0);
      resultSettings.animatePageTurns = partialSettings.animatePageTurns
        ? 1
        : 0;
    }

    if (partialSettings.highlightColor !== undefined) {
      updates.push("highlightColor = ?");
      params.push(partialSettings.highlightColor);
      resultSettings.highlightColor = partialSettings.highlightColor;
    }

    if (partialSettings.readerBackground !== undefined) {
      updates.push("readerBackground = ?");
      params.push(partialSettings.readerBackground);
      resultSettings.readerBackground = partialSettings.readerBackground;
    }

    if (partialSettings.pageMargin !== undefined) {
      updates.push("pageMargin = ?");
      params.push(partialSettings.pageMargin);
      resultSettings.pageMargin = partialSettings.pageMargin;
    }

    if (partialSettings.furiganaDisplay !== undefined) {
      updates.push("furiganaDisplay = ?");
      params.push(partialSettings.furiganaDisplay);
      resultSettings.furiganaDisplay = partialSettings.furiganaDisplay;
    }

    if (partialSettings.autoSavePosition !== undefined) {
      updates.push("autoSavePosition = ?");
      params.push(partialSettings.autoSavePosition ? 1 : 0);
      resultSettings.autoSavePosition = partialSettings.autoSavePosition
        ? 1
        : 0;
    }

    if (partialSettings.dictionaryProvider !== undefined) {
      updates.push("dictionaryProvider = ?");
      params.push(partialSettings.dictionaryProvider);
      resultSettings.dictionaryProvider = partialSettings.dictionaryProvider;
    }

    if (partialSettings.customDictionaryUrl !== undefined) {
      updates.push("customDictionaryUrl = ?");
      params.push(partialSettings.customDictionaryUrl || "");
      resultSettings.customDictionaryUrl = partialSettings.customDictionaryUrl;
    }

    if (partialSettings.pageNavigationMethod !== undefined) {
      updates.push("pageNavigationMethod = ?");
      params.push(partialSettings.pageNavigationMethod);
      resultSettings.pageNavigationMethod =
        partialSettings.pageNavigationMethod;
    }

    // Update timestamp
    updates.push("updatedAt = ?");
    params.push(now);
    resultSettings.updatedAt = now;

    // Add ID to params
    params.push(existingSettings.id);

    // Execute SQL update if there are changes
    if (updates.length > 0) {
      db.prepare(
        `
        UPDATE settings SET ${updates.join(", ")} WHERE id = ?
      `
      ).run(...params);
    }

    return {
      id: resultSettings.id,
      darkMode: Boolean(resultSettings.darkMode),
      invertColors: Boolean(resultSettings.invertColors),
      rightToLeft: Boolean(resultSettings.rightToLeft),
      hasCover: Boolean(resultSettings.hasCover),
      showTooltips: Boolean(resultSettings.showTooltips),
      ankiEnabled: Boolean(resultSettings.ankiEnabled),
      fontSize:
        resultSettings.fontSize === "auto"
          ? "auto"
          : parseInt(resultSettings.fontSize, 10),
      readingMode: resultSettings.readingMode as
        | "singlePage"
        | "doublePage"
        | "longStrip",
      animatePageTurns: Boolean(resultSettings.animatePageTurns),
      highlightColor: resultSettings.highlightColor,
      readerBackground: resultSettings.readerBackground,
      pageMargin: resultSettings.pageMargin,
      furiganaDisplay: resultSettings.furiganaDisplay as
        | "always"
        | "hover"
        | "never",
      autoSavePosition: Boolean(resultSettings.autoSavePosition),
      dictionaryProvider: resultSettings.dictionaryProvider as
        | "jisho"
        | "google"
        | "custom",
      customDictionaryUrl: resultSettings.customDictionaryUrl,
      pageNavigationMethod: resultSettings.pageNavigationMethod as
        | "click"
        | "tap"
        | "swipe"
        | "arrows",
      updatedAt: resultSettings.updatedAt,
    };
  } catch (error) {
    console.error("Error updating settings directly in database:", error);
    return null;
  }
}

/**
 * Create a database settings page for debugging
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  try {
    const db = getDbSync();

    // Get settings
    const settings = db.prepare("SELECT * FROM settings LIMIT 1").get() as
      | SettingsRow
      | undefined;

    // Get database info
    const result = db
      .prepare(`SELECT count(*) as count FROM sqlite_master WHERE type='table'`)
      .get() as { count: number };
    const dbInfo = {
      tableCount: result.count,
      dbSize: "N/A", // In a real implementation, you'd get the file size
    };

    return {
      settings,
      dbInfo,
    };
  } catch (error) {
    console.error("Error getting all database settings:", error);
    return { error: String(error) };
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettingsToDefaults(): Promise<boolean> {
  try {
    const db = getDbSync();
    const now = new Date().toISOString();

    // Delete all settings
    db.prepare(`DELETE FROM settings`).run();

    // Insert default settings
    const id = nanoid();
    db.prepare(
      `
      INSERT INTO settings (
        id, darkMode, invertColors, rightToLeft, hasCover,
        showTooltips, ankiEnabled, fontSize, readingMode, animatePageTurns,
        highlightColor, readerBackground, pageMargin, furiganaDisplay,
        autoSavePosition, dictionaryProvider, customDictionaryUrl, pageNavigationMethod, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      1, // darkMode
      0, // invertColors
      0, // rightToLeft
      0, // hasCover
      1, // showTooltips
      1, // ankiEnabled
      "auto", // fontSize
      "singlePage", // readingMode
      0, // animatePageTurns
      "", // highlightColor
      "", // readerBackground
      0, // pageMargin
      "never", // furiganaDisplay
      0, // autoSavePosition
      "jisho", // dictionaryProvider
      "", // customDictionaryUrl - use empty string instead of null
      "click", // pageNavigationMethod
      now // updatedAt
    );

    return true;
  } catch (error) {
    console.error("Error resetting settings to defaults:", error);
    return false;
  }
}
