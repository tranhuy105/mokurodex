// import {
//     addContentToCollection,
//     addReadingHistoryEntry,
//     createCollection,
//     createTag,
//     deleteCollection,
//     deleteTag,
//     getAllContentWithUserData,
//     getAllUserContentMetadata,
//     getCollection,
//     // Collection operations
//     getCollections,
//     getContentByCollection,
//     getContentByTag,
//     getContentWithUserData,
//     // Reading history operations
//     getReadingHistory,
//     getTag,
//     // Tag operations
//     getTags,
//     // User content metadata operations
//     getUserContentMetadata,
//     refreshContinueReading,
//     removeContentFromCollection,
//     // Search operations
//     searchContentWithFilters,
//     updateCollection,
//     updateTag,
//     updateUserContentMetadata,
// } from "./content-management-api";

// /**
//  * Client-safe API for content management operations
//  * These functions can be safely imported and used in both client and server components
//  */

// // ========== Tag operations ==========

// export async function fetchTags() {
//     return getTags();
// }

// export async function fetchTag(id: string) {
//     return getTag(id);
// }

// export async function addTag(tag: {
//     name: string;
//     color?: string;
//     type: "genre" | "content" | "custom";
// }) {
//     return createTag(tag);
// }

// export async function modifyTag(
//     id: string,
//     tag: {
//         name?: string;
//         color?: string;
//         type?: "genre" | "content" | "custom";
//     }
// ) {
//     return updateTag(id, tag);
// }

// export async function removeTag(id: string) {
//     return deleteTag(id);
// }

// // ========== Collection operations ==========

// export async function fetchCollections() {
//     return getCollections();
// }

// export async function fetchCollection(id: string) {
//     return getCollection(id);
// }

// export async function addCollection(collection: {
//     name: string;
//     description?: string;
//     coverImage?: string;
//     contentIds?: string[];
// }) {
//     return createCollection(collection);
// }

// export async function modifyCollection(
//     id: string,
//     collection: {
//         name?: string;
//         description?: string;
//         coverImage?: string;
//         contentIds?: string[];
//     }
// ) {
//     return updateCollection(id, collection);
// }

// export async function removeCollection(id: string) {
//     return deleteCollection(id);
// }

// export async function addToCollection(
//     collectionId: string,
//     contentId: string
// ) {
//     return addContentToCollection(collectionId, contentId);
// }

// export async function removeFromCollection(
//     collectionId: string,
//     contentId: string
// ) {
//     return removeContentFromCollection(
//         collectionId,
//         contentId
//     );
// }

// // ========== User content metadata operations ==========

// export async function fetchUserContentMetadata(
//     contentId: string
// ) {
//     return getUserContentMetadata(contentId);
// }

// export async function fetchAllUserContentMetadata() {
//     return getAllUserContentMetadata();
// }

// export async function updateContentMetadata(
//     contentId: string,
//     metadata: {
//         rating?: number | null;
//         progress?: number | null;
//         status?: string | null;
//         notes?: string | null;
//         favorite?: boolean;
//         isNsfw?: boolean;
//         customCover?: string | null;
//         author?: string | null;
//         artist?: string | null;
//         releaseYear?: number | null;
//         publisher?: string | null;
//         tagIds?: string[];
//         collectionIds?: string[];
//     }
// ) {
//     return updateUserContentMetadata(contentId, metadata);
// }

// // ========== Reading history operations ==========

// export async function fetchReadingHistory(
//     contentId: string
// ) {
//     return getReadingHistory(contentId);
// }

// export async function addReadingHistory(entry: {
//     contentId: string;
//     volumeId: string;
//     position: number;
//     chapterHref?: string;
// }) {
//     return addReadingHistoryEntry(entry);
// }

// // ========== Search operations ==========

// export async function searchContent(options: {
//     query?: string;
//     tags?: string[];
//     collections?: string[];
//     status?: string[];
//     favorite?: boolean;
//     isNsfw?: boolean;
//     contentType?: string[];
// }) {
//     return searchContentWithFilters(options);
// }

// export async function fetchContentByTag(tagId: string) {
//     return getContentByTag(tagId);
// }

// export async function fetchContentByCollection(
//     collectionId: string
// ) {
//     return getContentByCollection(collectionId);
// }

// export async function fetchContentWithUserData(
//     contentId: string
// ) {
//     return getContentWithUserData(contentId);
// }

// export async function fetchAllContentWithUserData() {
//     return getAllContentWithUserData();
// }

// export async function continueReading(entry: {
//     contentId: string;
//     volumeId: string;
//     position: number;
//     chapterHref?: string;
// }) {
//     return addReadingHistoryEntry(entry);
// }

// /**
//  * Manually refresh the Continue Reading section on the homepage
//  * Call this when returning to the homepage after reading
//  */
// export async function refreshHomePageReading() {
//     return refreshContinueReading();
// }
