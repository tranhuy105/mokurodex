// import {
//   // Tag operations
//   getTags,
//   getTag,
//   createTag,
//   updateTag,
//   deleteTag,

//   // Collection operations
//   getCollections,
//   getCollection,
//   createCollection,
//   updateCollection,
//   deleteCollection,
//   addMangaToCollection,
//   removeMangaFromCollection,

//   // User manga metadata operations
//   getUserMangaMetadata,
//   getAllUserMangaMetadata,
//   updateUserMangaMetadata,

//   // Reading history operations
//   getReadingHistory,
//   addReadingHistoryEntry,
//   refreshContinueReading,

//   // Search operations
//   searchMangaWithFilters,
//   getMangaByTag,
//   getMangaByCollection,
//   getMangaWithUserData,
//   getAllMangaWithUserData,
// } from "./manga-management-prisma";

// import { prisma } from "@/lib/prisma";
// import { nanoid } from "nanoid";

// /**
//  * Client-safe API for manga management operations
//  * These functions can be safely imported and used in both client and server components
//  */

// // ========== Tag operations ==========

// export async function fetchTags() {
//   return getTags();
// }

// export async function fetchTag(id: string) {
//   return getTag(id);
// }

// export async function addTag(tag: {
//   name: string;
//   color?: string;
//   type: "genre" | "content" | "custom";
// }) {
//   return createTag(tag);
// }

// export async function modifyTag(
//   id: string,
//   tag: {
//     name?: string;
//     color?: string;
//     type?: "genre" | "content" | "custom";
//   }
// ) {
//   return updateTag(id, tag);
// }

// export async function removeTag(id: string) {
//   return deleteTag(id);
// }

// // ========== Collection operations ==========

// export async function fetchCollections() {
//   return getCollections();
// }

// export async function fetchCollection(id: string) {
//   return getCollection(id);
// }

// export async function addCollection(collection: {
//   name: string;
//   description?: string;
//   coverImage?: string;
//   mangaIds?: string[];
// }) {
//   return createCollection(collection);
// }

// export async function modifyCollection(
//   id: string,
//   collection: {
//     name?: string;
//     description?: string;
//     coverImage?: string;
//     mangaIds?: string[];
//   }
// ) {
//   return updateCollection(id, collection);
// }

// export async function removeCollection(id: string) {
//   return deleteCollection(id);
// }

// export async function addToCollection(collectionId: string, mangaId: string) {
//   return addMangaToCollection(collectionId, mangaId);
// }

// export async function removeFromCollection(
//   collectionId: string,
//   mangaId: string
// ) {
//   return removeMangaFromCollection(collectionId, mangaId);
// }

// // ========== User manga metadata operations ==========

// export async function fetchUserMangaMetadata(mangaId: string) {
//   return getUserMangaMetadata(mangaId);
// }

// export async function fetchAllUserMangaMetadata() {
//   return getAllUserMangaMetadata();
// }

// export async function updateMangaMetadata(
//   mangaId: string,
//   metadata: {
//     rating?: number | null;
//     progress?: number | null;
//     status?: string | null;
//     notes?: string | null;
//     favorite?: boolean;
//     isNsfw?: boolean;
//     customCover?: string | null;
//     author?: string | null;
//     artist?: string | null;
//     releaseYear?: number | null;
//     publisher?: string | null;
//     tagIds?: string[];
//     collectionIds?: string[];
//   }
// ) {
//   return updateUserMangaMetadata(mangaId, metadata);
// }

// // ========== Reading history operations ==========

// export async function fetchReadingHistory(mangaId: string) {
//   return getReadingHistory(mangaId);
// }

// export async function addReadingHistory(entry: {
//   mangaId: string;
//   volumeId: string;
//   page: number;
// }) {
//   return addReadingHistoryEntry(entry);
// }

// // ========== Search operations ==========

// export async function searchManga(options: {
//   query?: string;
//   tags?: string[];
//   collections?: string[];
//   status?: string[];
//   favorite?: boolean;
//   isNsfw?: boolean;
// }) {
//   return searchMangaWithFilters(options);
// }

// export async function fetchMangaByTag(tagId: string) {
//   return getMangaByTag(tagId);
// }

// export async function fetchMangaByCollection(collectionId: string) {
//   return getMangaByCollection(collectionId);
// }

// export async function fetchMangaWithUserData(mangaId: string) {
//   return getMangaWithUserData(mangaId);
// }

// export async function fetchAllMangaWithUserData() {
//   return getAllMangaWithUserData();
// }

// export async function continueReading(entry: {
//   mangaId: string;
//   volumeId: string;
//   page: number;
// }) {
//   try {
//     const now = new Date();

//     // Check if an entry for this manga and volume already exists
//     const existingEntry = await prisma.readingHistory.findFirst({
//       where: {
//         mangaId: entry.mangaId,
//         volumeId: entry.volumeId,
//       },
//     });

//     let historyEntry;

//     if (existingEntry) {
//       // Update existing entry
//       historyEntry = await prisma.readingHistory.update({
//         where: { id: existingEntry.id },
//         data: {
//           page: entry.page,
//           timestamp: now,
//         },
//       });
//     } else {
//       // Create new entry if none exists
//       historyEntry = await prisma.readingHistory.create({
//         data: {
//           id: nanoid(),
//           mangaId: entry.mangaId,
//           volumeId: entry.volumeId,
//           page: entry.page,
//           timestamp: now,
//         },
//       });
//     }

//     // Update user manga metadata last read time
//     const existingMetadata = await prisma.userMangaMetadata.findUnique({
//       where: { mangaId: entry.mangaId },
//     });

//     if (existingMetadata) {
//       await prisma.userMangaMetadata.update({
//         where: { id: existingMetadata.id },
//         data: {
//           updatedAt: now,
//         },
//       });
//     } else {
//       // Create basic metadata if it doesn't exist
//       await prisma.userMangaMetadata.create({
//         data: {
//           id: nanoid(),
//           mangaId: entry.mangaId,
//           favorite: false,
//           updatedAt: now,
//         },
//       });
//     }

//     // No revalidation here to avoid re-renders during reading
//     return historyEntry;
//   } catch (error) {
//     console.error("Error updating reading progress:", error);
//     throw new Error("Failed to update reading progress");
//   }
// }

// /**
//  * Manually refresh the Continue Reading section on the homepage
//  * Call this when returning to the homepage after reading
//  */
// export async function refreshHomePageReading() {
//   return refreshContinueReading();
// }
