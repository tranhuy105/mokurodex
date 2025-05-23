import {
  importMangaDirectory,
  getAllManga,
  getMangaWithVolumes,
  getVolumePages,
  deleteManga,
  clearAndRescanAllManga,
  importCustomDirectory,
} from "./manga-import-actions-prisma";

/**
 * Client-safe API for manga operations
 * These functions can be safely imported and used in both client and server components
 */

/**
 * Import a specific manga directory
 */
export async function importManga(directoryPath: string) {
  return importMangaDirectory(directoryPath);
}

/**
 * Get all manga from the database
 */
export async function fetchAllManga() {
  return getAllManga();
}

/**
 * Get a single manga by ID with its volumes
 */
export async function fetchMangaWithVolumes(id: string) {
  return getMangaWithVolumes(id);
}

/**
 * Get pages for a specific volume
 */
export async function fetchVolumePages(volumeId: string) {
  return getVolumePages(volumeId);
}

/**
 * Delete a manga and all related data
 */
export async function removeManga(id: string) {
  return deleteManga(id);
}

/**
 * Clear all manga data and rescan everything
 */
export async function resetAndRescanAllManga() {
  return clearAndRescanAllManga();
}

/**
 * Import manga from a custom directory path on the user's system
 */
export async function importCustomMangaDirectory(customPath: string) {
  return importCustomDirectory(customPath);
}
