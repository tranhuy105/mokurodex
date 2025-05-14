import { MangaEntity, VolumeEntity } from "@/lib/database/DatabaseInterface";
import {
  scanAllManga,
  importMangaDirectory,
  getDatabaseManga,
  getDatabaseMangaById,
  deleteDatabaseManga,
  getDatabaseVolumes,
  clearAndRescanAllManga,
} from "./manga-import-actions";

/**
 * Client-safe API for manga import operations
 * These functions can be safely imported and used in both client and server components
 */

/**
 * Scan all manga directories and import them into the database
 */
export async function importAllManga(): Promise<MangaEntity[]> {
  return scanAllManga();
}

/**
 * Import a specific manga directory
 */
export async function importManga(
  directoryPath: string
): Promise<MangaEntity | null> {
  return importMangaDirectory(directoryPath);
}

/**
 * Get all manga from the database
 */
export async function fetchDatabaseManga(): Promise<MangaEntity[]> {
  return getDatabaseManga();
}

/**
 * Get a single manga by ID from the database
 */
export async function fetchDatabaseMangaById(
  id: string
): Promise<MangaEntity | null> {
  return getDatabaseMangaById(id);
}

/**
 * Delete a manga from the database
 */
export async function removeDatabaseManga(id: string): Promise<boolean> {
  return deleteDatabaseManga(id);
}

/**
 * Get volumes for a manga
 */
export async function fetchDatabaseVolumes(
  mangaId: string
): Promise<VolumeEntity[]> {
  return getDatabaseVolumes(mangaId);
}

/**
 * Clear all manga data and rescan everything
 * This is useful after schema changes
 */
export async function resetAndRescanAllManga(): Promise<MangaEntity[]> {
  return clearAndRescanAllManga();
}
