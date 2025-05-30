// import {
//     clearAndRescanAllContent,
//     deleteContent,
//     getAllContent,
//     getContentWithVolumes,
//     getEpubFileUrl,
//     getVolumePages,
//     importContentDirectory,
//     scanContentDirectory,
// } from "./content-import-actions";

// /**
//  * Client-safe API for content operations
//  * These functions can be safely imported and used in both client and server components
//  */

// /**
//  * Import a specific content directory
//  */
// export async function importContent(directoryPath: string) {
//     return importContentDirectory(directoryPath);
// }

// /**
//  * Get all content from the database
//  */
// export async function fetchAllContent() {
//     return getAllContent();
// }

// /**
//  * Get a single content by ID with its volumes
//  */
// export async function fetchContentWithVolumes(id: string) {
//     return getContentWithVolumes(id);
// }

// /**
//  * Get pages for a specific volume
//  */
// export async function fetchVolumePages(volumeId: string) {
//     return getVolumePages(volumeId);
// }

// /**
//  * Delete content and all related data
//  */
// export async function removeContent(id: string) {
//     return deleteContent(id);
// }

// /**
//  * Clear all content data and rescan everything
//  */
// export async function resetAndRescanAllContent() {
//     return clearAndRescanAllContent();
// }

// /**
//  * Import content from a custom directory path on the user's system
//  */
// export async function importCustomContentDirectory(
//     customPath: string
// ) {
//     return importContentDirectory(customPath, null, true);
// }

// /**
//  * Scan all subdirectories in a data directory (manga or ln)
//  * @param dataDir The base data directory
//  * @param type The type of content to scan ('manga' or 'ln')
//  * @returns Results of the scan operation
//  */
// export async function scanDataDirectoryContent(
//     dataDir: string,
//     type: "manga" | "ln"
// ) {
//     try {
//         console.log(
//             `Starting scan of ${type} content in ${dataDir}`
//         );
//         return scanContentDirectory(dataDir, type);
//     } catch (error) {
//         console.error(`Error during ${type} scan:`, error);
//         return {
//             success: false,
//             error:
//                 error instanceof Error
//                     ? error.message
//                     : "Unknown error occurred",
//             importedCount: 0,
//             failedCount: 0,
//             importedItems: [],
//             failedItems: [],
//         };
//     }
// }

// /**
//  * Get a URL to access an EPUB file
//  */
// export async function getEpubUrl(
//     contentId: string,
//     volumeNumber: number = 1
// ) {
//     return getEpubFileUrl(contentId, volumeNumber);
// }
