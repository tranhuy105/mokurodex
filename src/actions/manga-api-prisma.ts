// import {
//   importMangaDirectory,
//   getAllManga,
//   getMangaWithVolumes,
//   getVolumePages,
//   deleteManga,
//   clearAndRescanAllManga,
//   importCustomDirectory,
//   scanDataSubdirectories,
// } from "./manga-import-actions-prisma";

// import { scanLightNovelDirectory } from "./epub-import-actions";

// /**
//  * Client-safe API for manga operations
//  * These functions can be safely imported and used in both client and server components
//  */

// /**
//  * Import a specific manga directory
//  */
// export async function importManga(directoryPath: string) {
//   return importMangaDirectory(directoryPath);
// }

// /**
//  * Get all manga from the database
//  */
// export async function fetchAllManga() {
//   return getAllManga();
// }

// /**
//  * Get a single manga by ID with its volumes
//  */
// export async function fetchMangaWithVolumes(id: string) {
//   return getMangaWithVolumes(id);
// }

// /**
//  * Get pages for a specific volume
//  */
// export async function fetchVolumePages(volumeId: string) {
//   return getVolumePages(volumeId);
// }

// /**
//  * Delete a manga and all related data
//  */
// export async function removeManga(id: string) {
//   return deleteManga(id);
// }

// /**
//  * Clear all manga data and rescan everything
//  */
// export async function resetAndRescanAllManga() {
//   return clearAndRescanAllManga();
// }

// /**
//  * Import manga from a custom directory path on the user's system
//  */
// export async function importCustomMangaDirectory(customPath: string) {
//   return importCustomDirectory(customPath);
// }

// /**
//  * Scan all subdirectories in a data directory (manga or ln)
//  * @param dataDir The base data directory
//  * @param type The type of content to scan ('manga' or 'ln')
//  * @returns Results of the scan operation
//  */
// export async function scanDataDirectoryContent(
//   dataDir: string,
//   type: "manga" | "ln"
// ) {
//   try {
//     console.log(`Starting scan of ${type} content in ${dataDir}`);

//     if (type === "manga") {
//       console.log("Using manga scanner for .mokuro files");
//       return scanDataSubdirectories(dataDir, type);
//     } else {
//       console.log("Using light novel scanner for .epub files");
//       return scanLightNovelDirectory(dataDir);
//     }
//   } catch (error) {
//     console.error(`Error during ${type} scan:`, error);
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//       importedCount: 0,
//       failedCount: 0,
//       importedItems: [],
//       failedItems: [],
//     };
//   }
// }
