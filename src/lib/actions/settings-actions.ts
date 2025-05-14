"use server";

import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import { SettingsEntity } from "@/lib/database/DatabaseInterface";
import {
  getAllSettings as getAllSettingsRaw,
  resetSettingsToDefaults as resetSettingsToDefaultsRaw,
} from "@/lib/database/settingsHelpers";

/**
 * Get the settings from the database
 * This is a server action that will be called from the client
 */
export async function getSettings(): Promise<SettingsEntity | null> {
  try {
    const repository = await getRepository();
    return await repository.getSettings();
  } catch (error) {
    console.error("Server action error - getSettings:", error);
    return null;
  }
}

/**
 * Update settings in the database
 * This is a server action that will be called from the client
 */
export async function updateSettings(
  settings: Partial<SettingsEntity>
): Promise<SettingsEntity | null> {
  try {
    const repository = await getRepository();
    return await repository.updateSettings(settings);
  } catch (error) {
    console.error("Server action error - updateSettings:", error);
    return null;
  }
}

/**
 * Get all settings information for debugging
 * This is a server action that will be called from the client
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  try {
    return await getAllSettingsRaw();
  } catch (error) {
    console.error("Server action error - getAllSettings:", error);
    return { error: String(error) };
  }
}

/**
 * Reset settings to defaults
 * This is a server action that will be called from the client
 */
export async function resetSettingsToDefaults(): Promise<boolean> {
  try {
    return await resetSettingsToDefaultsRaw();
  } catch (error) {
    console.error("Server action error - resetSettingsToDefaults:", error);
    return false;
  }
}

/**
 * Run a read-only SQL query for the workbench
 */
export async function runReadOnlyQuery(
  query: string
): Promise<{ results: unknown[]; error?: string }> {
  "use server";

  // Only allow SELECT queries for security
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery.startsWith("select")) {
    return {
      results: [],
      error: "Only SELECT queries are allowed in read-only mode",
    };
  }

  try {
    const { getDb } = await import("@/lib/database/settingsHelpers");
    const db = await getDb();

    // Execute the query
    const results = db.prepare(query).all();
    db.close();

    return { results };
  } catch (error) {
    console.error("Error running read-only query:", error);
    return {
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get database table structure
 */
export async function getDatabaseSchema(): Promise<{
  tables: Record<string, { columns: string[] }>;
  error?: string;
}> {
  "use server";

  try {
    const { getDb } = await import("@/lib/database/settingsHelpers");
    const db = await getDb();

    // Get all tables
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];

    // Get columns for each table
    const schema: Record<string, { columns: string[] }> = {};

    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as {
        name: string;
      }[];
      schema[table.name] = {
        columns: columns.map((col) => col.name),
      };
    }

    db.close();

    return { tables: schema };
  } catch (error) {
    console.error("Error getting database schema:", error);
    return {
      tables: {},
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update a settings row
 */
export async function updateSettingsRow(
  id: string,
  field: string,
  value: string | number | boolean
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    const { getDb } = await import("@/lib/database/settingsHelpers");
    const db = await getDb();

    // Check if the field exists
    const fieldInfo = db.prepare(`PRAGMA table_info(settings)`).all() as {
      name: string;
      type: string;
    }[];
    const fieldExists = fieldInfo.find((f) => f.name === field);

    if (!fieldExists) {
      db.close();
      return {
        success: false,
        error: `Field '${field}' does not exist in the settings table`,
      };
    }

    // Convert value based on field type if needed
    let finalValue: string | number;

    if (typeof value === "boolean") {
      finalValue = value ? 1 : 0;
    } else {
      finalValue = value;
    }

    // Update the settings
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE settings SET ${field} = ?, updatedAt = ? WHERE id = ?`
    ).run(finalValue, now, id);

    db.close();

    return { success: true };
  } catch (error) {
    console.error("Error updating settings row:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
