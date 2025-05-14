"use server";

import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import {
  Tag,
  Collection,
  UserMangaMetadata,
  ReadingHistoryEntry,
} from "@/lib/database/DatabaseInterface";
import { MangaMetadata } from "@/types/manga";

// ========== Tag operations ==========

/**
 * Get all tags
 */
export async function getAllTags(): Promise<Tag[]> {
  try {
    const repository = await getRepository();
    return repository.getTags();
  } catch (error) {
    console.error("Error in getAllTags server action:", error);
    return [];
  }
}

/**
 * Create a new tag
 */
export async function createTag(tag: Omit<Tag, "id">): Promise<Tag | null> {
  try {
    const repository = await getRepository();
    return repository.createTag(tag);
  } catch (error) {
    console.error("Error in createTag server action:", error);
    return null;
  }
}

/**
 * Update an existing tag
 */
export async function updateTag(
  id: string,
  tag: Partial<Tag>
): Promise<Tag | null> {
  try {
    const repository = await getRepository();
    return repository.updateTag(id, tag);
  } catch (error) {
    console.error(`Error in updateTag server action for tag ${id}:`, error);
    return null;
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<boolean> {
  try {
    const repository = await getRepository();
    return repository.deleteTag(id);
  } catch (error) {
    console.error(`Error in deleteTag server action for tag ${id}:`, error);
    return false;
  }
}

// ========== Collection operations ==========

/**
 * Get all collections
 */
export async function getAllCollections(): Promise<Collection[]> {
  try {
    const repository = await getRepository();
    return repository.getCollections();
  } catch (error) {
    console.error("Error in getAllCollections server action:", error);
    return [];
  }
}

/**
 * Get a single collection by ID
 */
export async function getCollection(id: string): Promise<Collection | null> {
  try {
    const repository = await getRepository();
    return repository.getCollection(id);
  } catch (error) {
    console.error(
      `Error in getCollection server action for collection ${id}:`,
      error
    );
    return null;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection | null> {
  try {
    const repository = await getRepository();
    return repository.createCollection(collection);
  } catch (error) {
    console.error("Error in createCollection server action:", error);
    return null;
  }
}

/**
 * Update an existing collection
 */
export async function updateCollection(
  id: string,
  collection: Partial<Collection>
): Promise<Collection | null> {
  try {
    const repository = await getRepository();
    return repository.updateCollection(id, collection);
  } catch (error) {
    console.error(
      `Error in updateCollection server action for collection ${id}:`,
      error
    );
    return null;
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<boolean> {
  try {
    const repository = await getRepository();
    return repository.deleteCollection(id);
  } catch (error) {
    console.error(
      `Error in deleteCollection server action for collection ${id}:`,
      error
    );
    return false;
  }
}

/**
 * Add a manga to a collection
 */
export async function addMangaToCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  try {
    const repository = await getRepository();
    return repository.addMangaToCollection(collectionId, mangaId);
  } catch (error) {
    console.error(
      `Error in addMangaToCollection server action for collection ${collectionId} and manga ${mangaId}:`,
      error
    );
    return false;
  }
}

/**
 * Remove a manga from a collection
 */
export async function removeMangaFromCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  try {
    const repository = await getRepository();
    return repository.removeMangaFromCollection(collectionId, mangaId);
  } catch (error) {
    console.error(
      `Error in removeMangaFromCollection server action for collection ${collectionId} and manga ${mangaId}:`,
      error
    );
    return false;
  }
}

// ========== User manga metadata operations ==========

/**
 * Get user metadata for a manga
 */
export async function getUserMangaMetadata(
  mangaId: string
): Promise<UserMangaMetadata | null> {
  try {
    const repository = await getRepository();
    return repository.getUserMangaMetadata(mangaId);
  } catch (error) {
    console.error(
      `Error in getUserMangaMetadata server action for manga ${mangaId}:`,
      error
    );
    return null;
  }
}

/**
 * Update user metadata for a manga
 */
export async function updateUserMangaMetadata(
  mangaId: string,
  metadata: Partial<UserMangaMetadata>
): Promise<UserMangaMetadata | null> {
  try {
    const repository = await getRepository();
    return repository.updateUserMangaMetadata(mangaId, metadata);
  } catch (error) {
    console.error(
      `Error in updateUserMangaMetadata server action for manga ${mangaId}:`,
      error
    );
    return null;
  }
}

// ========== Reading history operations ==========

/**
 * Add a reading history entry
 */
export async function addReadingHistoryEntry(
  entry: Omit<ReadingHistoryEntry, "id" | "timestamp">
): Promise<ReadingHistoryEntry | null> {
  try {
    const repository = await getRepository();
    return repository.addReadingHistoryEntry(entry);
  } catch (error) {
    console.error(
      `Error in addReadingHistoryEntry server action for manga ${entry.mangaId}:`,
      error
    );
    return null;
  }
}

/**
 * Get reading history for a manga
 */
export async function getReadingHistory(
  mangaId: string
): Promise<ReadingHistoryEntry[]> {
  try {
    const repository = await getRepository();
    return repository.getReadingHistory(mangaId);
  } catch (error) {
    console.error(
      `Error in getReadingHistory server action for manga ${mangaId}:`,
      error
    );
    return [];
  }
}

// ========== Combined operations ==========

/**
 * Get manga with user data by ID
 */
export async function getMangaWithUserData(
  mangaId: string
): Promise<(MangaMetadata & { userData: UserMangaMetadata | null }) | null> {
  try {
    console.log(
      `getMangaWithUserData: Retrieving data for manga ID ${mangaId}`
    );

    const repository = await getRepository();

    // Get manga data with user metadata in a single efficient query
    // This replaces multiple separate queries with one join query
    const mangaData = await repository.getMangaWithUserData(mangaId);

    if (!mangaData) {
      console.log(
        `getMangaWithUserData: Manga with ID ${mangaId} not found in database`
      );
      return null;
    }

    return mangaData;
  } catch (error) {
    console.error(`Error getting manga with user data for ${mangaId}:`, error);
    return null;
  }
}

/**
 * Get all manga with user data
 */
export async function getAllMangaWithUserData(): Promise<
  Array<MangaMetadata & { userData: UserMangaMetadata | null }>
> {
  try {
    const repository = await getRepository();
    return repository.getAllMangaWithUserData();
  } catch (error) {
    console.error("Error in getAllMangaWithUserData server action:", error);
    return [];
  }
}

/**
 * Get manga by tag
 */
export async function getMangaByTag(
  tagId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    const repository = await getRepository();
    return repository.getMangaByTag(tagId);
  } catch (error) {
    console.error(
      `Error in getMangaByTag server action for tag ${tagId}:`,
      error
    );
    return [];
  }
}

/**
 * Get manga by collection
 */
export async function getMangaByCollection(
  collectionId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    const repository = await getRepository();
    return repository.getMangaByCollection(collectionId);
  } catch (error) {
    console.error(
      `Error in getMangaByCollection server action for collection ${collectionId}:`,
      error
    );
    return [];
  }
}

/**
 * Search manga with filters
 */
export async function searchMangaWithFilters(options: {
  query?: string;
  tags?: string[];
  collections?: string[];
  status?: string[];
  favorite?: boolean;
  isNsfw?: boolean;
}): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    const repository = await getRepository();
    return repository.searchMangaWithFilters(options);
  } catch (error) {
    console.error("Error in searchMangaWithFilters server action:", error);
    return [];
  }
}
