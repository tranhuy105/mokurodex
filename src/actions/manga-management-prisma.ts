"use server";

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

// ========== Tag operations ==========

/**
 * Get all tags
 */
export async function getTags() {
  try {
    return await prisma.tag.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error getting tags:", error);
    return [];
  }
}

/**
 * Get a tag by ID
 */
export async function getTag(id: string) {
  try {
    return await prisma.tag.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error getting tag ${id}:`, error);
    return null;
  }
}

/**
 * Create a new tag
 */
export async function createTag(tag: {
  name: string;
  color?: string;
  type: "genre" | "content" | "custom";
}) {
  try {
    const newTag = await prisma.tag.create({
      data: {
        id: nanoid(),
        name: tag.name,
        color: tag.color,
        type: tag.type,
      },
    });

    revalidatePath("/tags");
    return newTag;
  } catch (error) {
    console.error("Error creating tag:", error);
    throw new Error("Failed to create tag");
  }
}

/**
 * Update a tag
 */
export async function updateTag(
  id: string,
  tag: {
    name?: string;
    color?: string;
    type?: "genre" | "content" | "custom";
  }
) {
  try {
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name: tag.name,
        color: tag.color,
        type: tag.type,
      },
    });

    revalidatePath("/tags");
    return updatedTag;
  } catch (error) {
    console.error(`Error updating tag ${id}:`, error);
    return null;
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string) {
  try {
    await prisma.tag.delete({
      where: { id },
    });

    revalidatePath("/tags");
    return true;
  } catch (error) {
    console.error(`Error deleting tag ${id}:`, error);
    return false;
  }
}

// ========== Collection operations ==========

/**
 * Get all collections
 */
export async function getCollections() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: "asc" },
      include: {
        collectionManga: {
          select: {
            mangaId: true,
          },
        },
      },
    });

    // Transform the result to match the expected format
    return collections.map((collection) => ({
      ...collection,
      mangaIds: collection.collectionManga.map((cm) => cm.mangaId),
      collectionManga: undefined,
    }));
  } catch (error) {
    console.error("Error getting collections:", error);
    return [];
  }
}

/**
 * Get a collection by ID
 */
export async function getCollection(id: string) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        collectionManga: {
          select: {
            mangaId: true,
          },
        },
      },
    });

    if (!collection) return null;

    // Transform the result to match the expected format
    return {
      ...collection,
      mangaIds: collection.collectionManga.map((cm) => cm.mangaId),
      collectionManga: undefined,
    };
  } catch (error) {
    console.error(`Error getting collection ${id}:`, error);
    return null;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(collection: {
  name: string;
  description?: string;
  coverImage?: string;
  mangaIds?: string[];
}) {
  try {
    const now = new Date();

    // Create the collection
    const newCollection = await prisma.collection.create({
      data: {
        id: nanoid(),
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        createdAt: now,
        updatedAt: now,
        // Create manga connections if provided
        collectionManga:
          collection.mangaIds && collection.mangaIds.length > 0
            ? {
                create: collection.mangaIds.map((mangaId) => ({
                  mangaId,
                })),
              }
            : undefined,
      },
      include: {
        collectionManga: {
          select: {
            mangaId: true,
          },
        },
      },
    });

    revalidatePath("/collections");

    // Transform the result to match the expected format
    return {
      ...newCollection,
      mangaIds: newCollection.collectionManga.map((cm) => cm.mangaId),
      collectionManga: undefined,
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    throw new Error("Failed to create collection");
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  collection: {
    name?: string;
    description?: string;
    coverImage?: string;
    mangaIds?: string[];
  }
) {
  try {
    const now = new Date();

    // If mangaIds is provided, update the manga connections
    if (collection.mangaIds !== undefined) {
      // Delete existing connections
      await prisma.collectionManga.deleteMany({
        where: { collectionId: id },
      });

      // Create new connections if there are manga IDs
      if (collection.mangaIds.length > 0) {
        await prisma.collectionManga.createMany({
          data: collection.mangaIds.map((mangaId) => ({
            collectionId: id,
            mangaId,
          })),
        });
      }
    }

    // Update the collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        updatedAt: now,
      },
      include: {
        collectionManga: {
          select: {
            mangaId: true,
          },
        },
      },
    });

    revalidatePath("/collections");

    // Transform the result to match the expected format
    return {
      ...updatedCollection,
      mangaIds: updatedCollection.collectionManga.map((cm) => cm.mangaId),
      collectionManga: undefined,
    };
  } catch (error) {
    console.error(`Error updating collection ${id}:`, error);
    return null;
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string) {
  try {
    await prisma.collection.delete({
      where: { id },
    });

    revalidatePath("/collections");
    return true;
  } catch (error) {
    console.error(`Error deleting collection ${id}:`, error);
    return false;
  }
}

/**
 * Add a manga to a collection
 */
export async function addMangaToCollection(
  collectionId: string,
  mangaId: string
) {
  try {
    // Check if the manga is already in the collection
    const exists = await prisma.collectionManga.findUnique({
      where: {
        collectionId_mangaId: {
          collectionId,
          mangaId,
        },
      },
    });

    if (exists) return true; // Already in collection

    // Add manga to collection
    await prisma.collectionManga.create({
      data: {
        collectionId,
        mangaId,
      },
    });

    // Update collection updatedAt timestamp
    const now = new Date();
    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: now },
    });

    revalidatePath("/collections");
    return true;
  } catch (error) {
    console.error(
      `Error adding manga ${mangaId} to collection ${collectionId}:`,
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
) {
  try {
    // Remove manga from collection
    await prisma.collectionManga.delete({
      where: {
        collectionId_mangaId: {
          collectionId,
          mangaId,
        },
      },
    });

    // Update collection updatedAt timestamp
    const now = new Date();
    await prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: now },
    });

    revalidatePath("/collections");
    return true;
  } catch (error) {
    console.error(
      `Error removing manga ${mangaId} from collection ${collectionId}:`,
      error
    );
    return false;
  }
}

// ========== User manga metadata operations ==========

/**
 * Get user metadata for a manga
 */
export async function getUserMangaMetadata(mangaId: string) {
  try {
    const metadata = await prisma.userMangaMetadata.findUnique({
      where: { mangaId },
    });

    if (!metadata) return null;

    // Get tag IDs
    const mangaTags = await prisma.mangaTag.findMany({
      where: { mangaId },
      select: { tagId: true },
    });

    // Get collection IDs
    const collectionManga = await prisma.collectionManga.findMany({
      where: { mangaId },
      select: { collectionId: true },
    });

    return {
      ...metadata,
      tagIds: mangaTags.map((mt) => mt.tagId),
      collectionIds: collectionManga.map((cm) => cm.collectionId),
    };
  } catch (error) {
    console.error(`Error getting user metadata for manga ${mangaId}:`, error);
    return null;
  }
}

/**
 * Get all user manga metadata
 */
export async function getAllUserMangaMetadata() {
  try {
    const allMetadata = await prisma.userMangaMetadata.findMany();

    // Get all manga-tag relationships
    const allMangaTags = await prisma.mangaTag.findMany({
      select: {
        mangaId: true,
        tagId: true,
      },
    });

    // Get all manga-collection relationships
    const allCollectionManga = await prisma.collectionManga.findMany({
      select: {
        mangaId: true,
        collectionId: true,
      },
    });

    // Group tags by manga ID
    const tagsByMangaId = new Map<string, string[]>();
    allMangaTags.forEach((mt) => {
      if (!tagsByMangaId.has(mt.mangaId)) {
        tagsByMangaId.set(mt.mangaId, []);
      }
      tagsByMangaId.get(mt.mangaId)!.push(mt.tagId);
    });

    // Group collections by manga ID
    const collectionsByMangaId = new Map<string, string[]>();
    allCollectionManga.forEach((cm) => {
      if (!collectionsByMangaId.has(cm.mangaId)) {
        collectionsByMangaId.set(cm.mangaId, []);
      }
      collectionsByMangaId.get(cm.mangaId)!.push(cm.collectionId);
    });

    // Combine metadata with tags and collections
    return allMetadata.map((metadata) => ({
      ...metadata,
      tagIds: tagsByMangaId.get(metadata.mangaId) || [],
      collectionIds: collectionsByMangaId.get(metadata.mangaId) || [],
    }));
  } catch (error) {
    console.error("Error getting all user manga metadata:", error);
    return [];
  }
}

/**
 * Update user metadata for a manga
 */
export async function updateUserMangaMetadata(
  mangaId: string,
  metadata: {
    rating?: number | null;
    progress?: number | null;
    status?: string | null;
    notes?: string | null;
    favorite?: boolean;
    isNsfw?: boolean;
    customCover?: string | null;
    author?: string | null;
    artist?: string | null;
    releaseYear?: number | null;
    publisher?: string | null;
    tagIds?: string[];
    collectionIds?: string[];
  }
) {
  try {
    const now = new Date();
    const existingMetadata = await prisma.userMangaMetadata.findUnique({
      where: { mangaId },
    });

    let metadataId;
    if (!existingMetadata) {
      // Create new metadata if it doesn't exist
      const newMetadata = await prisma.userMangaMetadata.create({
        data: {
          id: nanoid(),
          mangaId,
          favorite: metadata.favorite || false,
          isNsfw: metadata.isNsfw || false,
          updatedAt: now,
        },
      });
      metadataId = newMetadata.id;
    } else {
      metadataId = existingMetadata.id;
    }

    // Update metadata fields
    const updatedMetadata = await prisma.userMangaMetadata.update({
      where: { id: metadataId },
      data: {
        rating: metadata.rating,
        progress: metadata.progress,
        status: metadata.status,
        notes: metadata.notes,
        favorite: metadata.favorite,
        isNsfw: metadata.isNsfw,
        customCover: metadata.customCover,
        author: metadata.author,
        artist: metadata.artist,
        releaseYear: metadata.releaseYear,
        publisher: metadata.publisher,
        updatedAt: now,
      },
    });

    // Update tags if provided
    if (metadata.tagIds !== undefined) {
      // Delete existing tags
      await prisma.mangaTag.deleteMany({
        where: { mangaId },
      });

      // Add new tags
      if (metadata.tagIds.length > 0) {
        await prisma.mangaTag.createMany({
          data: metadata.tagIds.map((tagId) => ({
            mangaId,
            tagId,
          })),
        });
      }
    }

    // Update collections if provided
    if (metadata.collectionIds !== undefined) {
      // Delete existing collection associations
      await prisma.collectionManga.deleteMany({
        where: { mangaId },
      });

      // Add new collection associations
      if (metadata.collectionIds.length > 0) {
        await prisma.collectionManga.createMany({
          data: metadata.collectionIds.map((collectionId) => ({
            mangaId,
            collectionId,
          })),
        });
      }
    }

    // Get updated tag IDs
    const mangaTags = await prisma.mangaTag.findMany({
      where: { mangaId },
      select: { tagId: true },
    });

    // Get collection IDs
    const collectionManga = await prisma.collectionManga.findMany({
      where: { mangaId },
      select: { collectionId: true },
    });

    revalidatePath(`/manga/${mangaId}`);

    return {
      ...updatedMetadata,
      tagIds: mangaTags.map((mt) => mt.tagId),
      collectionIds: collectionManga.map((cm) => cm.collectionId),
    };
  } catch (error) {
    console.error(`Error updating user metadata for manga ${mangaId}:`, error);
    return null;
  }
}

// ========== Reading history operations ==========

/**
 * Get reading history for a manga
 */
export async function getReadingHistory(mangaId: string) {
  try {
    return await prisma.readingHistory.findMany({
      where: { mangaId },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    console.error(`Error getting reading history for manga ${mangaId}:`, error);
    return [];
  }
}

/**
 * Add a reading history entry
 */
export async function addReadingHistoryEntry(entry: {
  mangaId: string;
  volumeId: string;
  page: number;
}) {
  try {
    const now = new Date();

    // Create the history entry
    const historyEntry = await prisma.readingHistory.create({
      data: {
        id: nanoid(),
        mangaId: entry.mangaId,
        volumeId: entry.volumeId,
        page: entry.page,
        timestamp: now,
      },
    });

    // Update user manga metadata last read time
    const existingMetadata = await prisma.userMangaMetadata.findUnique({
      where: { mangaId: entry.mangaId },
    });

    if (existingMetadata) {
      await prisma.userMangaMetadata.update({
        where: { id: existingMetadata.id },
        data: {
          updatedAt: now,
        },
      });
    } else {
      // Create basic metadata if it doesn't exist
      await prisma.userMangaMetadata.create({
        data: {
          id: nanoid(),
          mangaId: entry.mangaId,
          favorite: false,
          updatedAt: now,
        },
      });
    }

    return historyEntry;
  } catch (error) {
    console.error("Error adding reading history entry:", error);
    throw new Error("Failed to add reading history entry");
  }
}

/**
 * Get reading history for multiple volumes in a single query
 * This prevents N+1 query problems by fetching all history at once
 */
export async function getReadingHistoryForVolumes(volumeIds: string[]) {
  if (!volumeIds.length) return new Map();
  
  try {
    // Get the most recent reading history entry for each volume
    const historyEntries = await prisma.readingHistory.findMany({
      where: {
        volumeId: {
          in: volumeIds
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      distinct: ['volumeId']
    });

    // Create a map of volumeId to history entry for easy lookup
    const historyMap = new Map();
    historyEntries.forEach(entry => {
      historyMap.set(entry.volumeId, entry);
    });

    return historyMap;
  } catch (error) {
    console.error("Error getting reading history for volumes:", error);
    return new Map();
  }
}

// ========== Search operations ==========

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
}) {
  try {
    // Start building the query
    let query = prisma.manga.findMany({
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    // Apply filters one by one

    // Filter by collections
    if (options.collections && options.collections.length > 0) {
      // Get manga IDs in these collections
      const mangaInCollections = await prisma.collectionManga.findMany({
        where: {
          collectionId: {
            in: options.collections,
          },
        },
        select: {
          mangaId: true,
        },
      });

      const mangaIds = mangaInCollections.map((cm) => cm.mangaId);

      // Filter manga by these IDs
      query = prisma.manga.findMany({
        where: {
          id: {
            in: mangaIds,
          },
        },
        include: {
          userData: true,
          mangaTags: {
            include: {
              tag: true,
            },
          },
          collectionManga: {
            include: {
              collection: true,
            },
          },
        },
        orderBy: {
          title: "asc",
        },
      });
    }

    // Execute the query
    const results = await query;

    // Apply remaining filters in memory (these are harder to express in Prisma)
    let filteredResults = results;

    // Filter by title query
    if (options.query) {
      const lowerQuery = options.query.toLowerCase();
      filteredResults = filteredResults.filter((manga) =>
        manga.title.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filteredResults = filteredResults.filter((manga) => {
        const mangaTagIds = manga.mangaTags.map((mt) => mt.tag.id);
        // Check if manga has ALL specified tags
        return options.tags!.every((tagId) => mangaTagIds.includes(tagId));
      });
    }

    // Filter by status
    if (options.status && options.status.length > 0) {
      filteredResults = filteredResults.filter(
        (manga) =>
          manga.userData &&
          manga.userData.status &&
          options.status!.includes(manga.userData.status)
      );
    }

    // Filter by favorite
    if (options.favorite !== undefined) {
      filteredResults = filteredResults.filter(
        (manga) =>
          manga.userData && manga.userData.favorite === options.favorite
      );
    }

    // Filter by NSFW
    if (options.isNsfw !== undefined) {
      filteredResults = filteredResults.filter(
        (manga) => manga.userData && manga.userData.isNsfw === options.isNsfw
      );
    }

    // Transform results to match expected format
    return filteredResults.map((manga) => ({
      id: manga.id,
      title: manga.title,
      volumes: manga.volumes,
      coverImage: manga.coverImage,
      addedDate: manga.addedDate.toISOString(),
      lastModified: manga.lastModified.toISOString(),
      userData: manga.userData
        ? {
            ...manga.userData,
            tagIds: manga.mangaTags.map((mt) => mt.tag.id),
            collectionIds: manga.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    }));
  } catch (error) {
    console.error("Error searching manga with filters:", error);
    return [];
  }
}

/**
 * Get manga by tag
 */
export async function getMangaByTag(tagId: string) {
  try {
    // Get manga IDs with this tag
    const mangaTags = await prisma.mangaTag.findMany({
      where: { tagId },
      select: { mangaId: true },
    });

    const mangaIds = mangaTags.map((mt) => mt.mangaId);

    // Get manga with user data
    const manga = await prisma.manga.findMany({
      where: {
        id: {
          in: mangaIds,
        },
      },
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
    });

    // Transform results to match expected format
    return manga.map((m) => ({
      id: m.id,
      title: m.title,
      volumes: m.volumes,
      coverImage: m.coverImage,
      addedDate: m.addedDate.toISOString(),
      lastModified: m.lastModified.toISOString(),
      userData: m.userData
        ? {
            ...m.userData,
            tagIds: m.mangaTags.map((mt) => mt.tag.id),
            collectionIds: m.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    }));
  } catch (error) {
    console.error(`Error getting manga by tag ${tagId}:`, error);
    return [];
  }
}

/**
 * Get manga by collection
 */
export async function getMangaByCollection(collectionId: string) {
  try {
    // Get manga IDs in this collection
    const collectionManga = await prisma.collectionManga.findMany({
      where: { collectionId },
      select: { mangaId: true },
    });

    const mangaIds = collectionManga.map((cm) => cm.mangaId);

    // Get manga with user data
    const manga = await prisma.manga.findMany({
      where: {
        id: {
          in: mangaIds,
        },
      },
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
    });

    // Transform results to match expected format
    return manga.map((m) => ({
      id: m.id,
      title: m.title,
      volumes: m.volumes,
      coverImage: m.coverImage,
      addedDate: m.addedDate.toISOString(),
      lastModified: m.lastModified.toISOString(),
      userData: m.userData
        ? {
            ...m.userData,
            tagIds: m.mangaTags.map((mt) => mt.tag.id),
            collectionIds: m.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    }));
  } catch (error) {
    console.error(`Error getting manga by collection ${collectionId}:`, error);
    return [];
  }
}

/**
 * Get manga with user data
 */
export async function getMangaWithUserData(mangaId: string) {
  try {
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
    });

    if (!manga) return null;

    // Transform to match expected format
    return {
      id: manga.id,
      title: manga.title,
      volumes: manga.volumes,
      coverImage: manga.coverImage,
      addedDate: manga.addedDate.toISOString(),
      lastModified: manga.lastModified.toISOString(),
      userData: manga.userData
        ? {
            ...manga.userData,
            tagIds: manga.mangaTags.map((mt) => mt.tag.id),
            collectionIds: manga.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    };
  } catch (error) {
    console.error(`Error getting manga with user data for ${mangaId}:`, error);
    return null;
  }
}

/**
 * Get all manga with user data
 */
export async function getAllMangaWithUserData() {
  try {
    const manga = await prisma.manga.findMany({
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    // Transform results to match expected format
    return manga.map((m) => ({
      id: m.id,
      title: m.title,
      volumes: m.volumes,
      coverImage: m.coverImage,
      addedDate: m.addedDate.toISOString(),
      lastModified: m.lastModified.toISOString(),
      userData: m.userData
        ? {
            ...m.userData,
            tagIds: m.mangaTags.map((mt) => mt.tag.id),
            collectionIds: m.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    }));
  } catch (error) {
    console.error("Error getting all manga with user data:", error);
    return [];
  }
}

/**
 * Advanced search for manga by title with support for different writing systems
 * This function provides better search capabilities than simple includes() matching
 */
export async function searchMangaByTitle(query: string) {
  try {
    if (!query.trim()) {
      return [];
    }

    // Use the database's built-in text search capabilities
    const results = await prisma.manga.findMany({
      where: {
        title: {
          contains: query,
        },
      },
      include: {
        userData: true,
        mangaTags: {
          include: {
            tag: true,
          },
        },
        collectionManga: {
          include: {
            collection: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    // Transform results to match expected format
    return results.map((manga) => ({
      id: manga.id,
      title: manga.title,
      volumes: manga.volumes,
      coverImage: manga.coverImage,
      addedDate: manga.addedDate.toISOString(),
      lastModified: manga.lastModified.toISOString(),
      userData: manga.userData
        ? {
            ...manga.userData,
            tagIds: manga.mangaTags.map((mt) => mt.tag.id),
            collectionIds: manga.collectionManga.map((cm) => cm.collection.id),
          }
        : null,
    }));
  } catch (error) {
    console.error("Error searching manga by title:", error);
    return [];
  }
}

/**
 * Get the most recently read manga with their latest reading position
 * @param limit Number of manga to return
 */
export async function getRecentlyReadManga(limit: number = 5) {
  try {
    // Get the most recent reading history entries with distinct manga IDs
    // This approach avoids the N+1 query problem by including all needed data in a single query
    const recentHistory = await prisma.readingHistory.findMany({
      orderBy: {
        timestamp: "desc",
      },
      include: {
        manga: true,
        volume: {
          include: {
            // Include page count and other volume details in the same query
            pages: {
              select: {
                id: true,
              },
              take: 1, // Just to check if there are pages
            },
          },
        },
      },
      distinct: ["mangaId"],
      take: limit,
    });

    // Return manga with the volume and page information
    return recentHistory.map(entry => ({
      manga: entry.manga,
      volumeId: entry.volumeId,
      volume: entry.volume,
      lastReadPage: entry.page,
      timestamp: entry.timestamp,
      // Calculate progress percentage if we know the page count
      progress: entry.volume.pageCount > 0 
        ? Math.min(Math.round((entry.page / entry.volume.pageCount) * 100), 100)
        : null,
    }));
  } catch (error) {
    console.error("Error getting recently read manga:", error);
    return [];
  }
}
