import {
  Tag,
  Collection,
  UserMangaMetadata,
  ReadingHistoryEntry,
} from "@/lib/database/DatabaseInterface";
import { MangaMetadata } from "@/types/manga";
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getAllCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addMangaToCollection,
  removeMangaFromCollection,
  getUserMangaMetadata,
  updateUserMangaMetadata,
  addReadingHistoryEntry,
  getReadingHistory,
  getMangaWithUserData,
  getAllMangaWithUserData,
  getMangaByTag,
  getMangaByCollection,
  searchMangaWithFilters,
} from "./manga-management-actions";

/**
 * Client-safe API for manga management operations
 * These functions can be safely imported and used in both client and server components
 */

// ========== Tag operations ==========

/**
 * Get all tags
 */
export async function fetchAllTags(): Promise<Tag[]> {
  return getAllTags();
}

/**
 * Create a new tag
 */
export async function fetchCreateTag(
  tag: Omit<Tag, "id">
): Promise<Tag | null> {
  return createTag(tag);
}

/**
 * Update an existing tag
 */
export async function fetchUpdateTag(
  id: string,
  tag: Partial<Tag>
): Promise<Tag | null> {
  return updateTag(id, tag);
}

/**
 * Delete a tag
 */
export async function fetchDeleteTag(id: string): Promise<boolean> {
  return deleteTag(id);
}

// ========== Collection operations ==========

/**
 * Get all collections
 */
export async function fetchAllCollections(): Promise<Collection[]> {
  return getAllCollections();
}

/**
 * Get a single collection by ID
 */
export async function fetchCollection(id: string): Promise<Collection | null> {
  return getCollection(id);
}

/**
 * Create a new collection
 */
export async function fetchCreateCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection | null> {
  return createCollection(collection);
}

/**
 * Update an existing collection
 */
export async function fetchUpdateCollection(
  id: string,
  collection: Partial<Collection>
): Promise<Collection | null> {
  return updateCollection(id, collection);
}

/**
 * Delete a collection
 */
export async function fetchDeleteCollection(id: string): Promise<boolean> {
  return deleteCollection(id);
}

/**
 * Add a manga to a collection
 */
export async function fetchAddMangaToCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  return addMangaToCollection(collectionId, mangaId);
}

/**
 * Remove a manga from a collection
 */
export async function fetchRemoveMangaFromCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  return removeMangaFromCollection(collectionId, mangaId);
}

// ========== User manga metadata operations ==========

/**
 * Get user metadata for a manga
 */
export async function fetchUserMangaMetadata(
  mangaId: string
): Promise<UserMangaMetadata | null> {
  return getUserMangaMetadata(mangaId);
}

/**
 * Update user metadata for a manga
 */
export async function fetchUpdateUserMangaMetadata(
  mangaId: string,
  metadata: Partial<UserMangaMetadata>
): Promise<UserMangaMetadata | null> {
  return updateUserMangaMetadata(mangaId, metadata);
}

// ========== Reading history operations ==========

/**
 * Add a reading history entry
 */
export async function fetchAddReadingHistoryEntry(
  entry: Omit<ReadingHistoryEntry, "id" | "timestamp">
): Promise<ReadingHistoryEntry | null> {
  return addReadingHistoryEntry(entry);
}

/**
 * Get reading history for a manga
 */
export async function fetchReadingHistory(
  mangaId: string
): Promise<ReadingHistoryEntry[]> {
  return getReadingHistory(mangaId);
}

// ========== Combined operations ==========

/**
 * Get manga with user data by ID
 */
export async function fetchMangaWithUserData(
  mangaId: string
): Promise<(MangaMetadata & { userData: UserMangaMetadata | null }) | null> {
  return getMangaWithUserData(mangaId);
}

/**
 * Get all manga with user data
 */
export async function fetchAllMangaWithUserData(): Promise<
  Array<MangaMetadata & { userData: UserMangaMetadata | null }>
> {
  return getAllMangaWithUserData();
}

/**
 * Get manga by tag
 */
export async function fetchMangaByTag(
  tagId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  return getMangaByTag(tagId);
}

/**
 * Get manga by collection
 */
export async function fetchMangaByCollection(
  collectionId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  return getMangaByCollection(collectionId);
}

/**
 * Search manga with filters
 */
export async function fetchSearchMangaWithFilters(options: {
  query?: string;
  tags?: string[];
  collections?: string[];
  status?: string[];
  favorite?: boolean;
}): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  return searchMangaWithFilters(options);
}
