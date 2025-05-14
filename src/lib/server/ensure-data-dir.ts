"use server";

import path from "path";
import fs from "fs/promises";

/**
 * Ensures that the data directory exists for the SQLite database
 */
export async function ensureDataDirectory(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");

  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`Data directory created/verified at: ${dataDir}`);
  } catch (error) {
    console.error(`Error creating data directory: ${dataDir}`, error);
  }
}
