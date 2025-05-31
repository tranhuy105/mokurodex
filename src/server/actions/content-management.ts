"use server";

import { db } from "@/server/db/client";
import {
    CollectionSchema,
    CollectionUpdateSchema,
    ContentCollectionSchema,
    IdSchema,
    ReadingHistorySchema,
    SearchSchema,
    TagSchema,
    TagUpdateSchema,
    UserMetadataSchema,
} from "@/types/validation";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ========== Types ==========

// ========== Validation Schemas ==========

// ========== Tag Operations ==========

/**
 * Get all tags
 */
export async function getTags() {
    try {
        return await db.tag.findMany({
            orderBy: { name: "asc" },
        });
    } catch (error) {
        console.error("Error getting tags:", error);
        return [];
    }
}

/**
 * Get a single tag with its content
 */
export async function getTag(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id } = IdSchema.parse(input);

        return await db.tag.findUnique({
            where: { id },
            include: {
                contentTags: {
                    include: {
                        content: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error(`Error getting tag:`, error);
        return null;
    }
}

/**
 * Create a new tag
 */
export async function createTag(
    input: z.infer<typeof TagSchema>
) {
    try {
        const data = TagSchema.parse(input);

        const tag = await db.tag.create({
            data: {
                id: nanoid(),
                name: data.name,
                color: data.color,
                type: data.type,
            },
        });

        revalidatePath("/tags");
        return tag;
    } catch (error) {
        console.error("Error creating tag:", error);
        return null;
    }
}

/**
 * Update an existing tag
 */
export async function updateTag(
    id: string,
    input: z.infer<typeof TagUpdateSchema>
) {
    try {
        const { id: tagId } = IdSchema.parse({ id });
        const data = TagUpdateSchema.parse(input);

        const tag = await db.tag.update({
            where: { id: tagId },
            data,
        });

        revalidatePath("/tags");
        return tag;
    } catch (error) {
        console.error(`Error updating tag:`, error);
        return null;
    }
}

/**
 * Delete a tag
 */
export async function deleteTag(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id } = IdSchema.parse(input);

        await db.tag.delete({
            where: { id },
        });

        revalidatePath("/tags");
        return true;
    } catch (error) {
        console.error(`Error deleting tag:`, error);
        return false;
    }
}

// ========== Collection Operations ==========

/**
 * Get all collections
 */
export async function getCollections() {
    try {
        return await db.collection.findMany({
            orderBy: { name: "asc" },
            include: {
                collectionContent: {
                    include: {
                        content: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error getting collections:", error);
        return [];
    }
}

/**
 * Get a single collection with its content
 */
export async function getCollection(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id } = IdSchema.parse(input);

        return await db.collection.findUnique({
            where: { id },
            include: {
                collectionContent: {
                    include: {
                        content: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error(`Error getting collection:`, error);
        return null;
    }
}

/**
 * Create a new collection
 */
export async function createCollection(
    input: z.infer<typeof CollectionSchema>
) {
    try {
        const data = CollectionSchema.parse(input);
        const now = new Date();

        // Create the collection
        const collection = await db.collection.create({
            data: {
                id: nanoid(),
                name: data.name,
                description: data.description,
                coverImage: data.coverImage,
                createdAt: now,
                updatedAt: now,
            },
        });

        // Add content to the collection if provided
        if (data.contentIds && data.contentIds.length > 0) {
            // Use transaction for multiple creates instead of createMany
            await db.$transaction(
                data.contentIds.map((contentId) =>
                    db.collectionContent.create({
                        data: {
                            collectionId: collection.id,
                            contentId,
                        },
                    })
                )
            );
        }

        revalidatePath("/collections");
        return collection;
    } catch (error) {
        console.error("Error creating collection:", error);
        return null;
    }
}

/**
 * Update an existing collection
 */
export async function updateCollection(
    id: string,
    input: z.infer<typeof CollectionUpdateSchema>
) {
    try {
        const { id: collectionId } = IdSchema.parse({ id });
        const data = CollectionUpdateSchema.parse(input);
        const now = new Date();

        // Extract contentIds from the data before passing to Prisma
        const { contentIds, ...collectionData } = data;

        // Update the collection
        const collection = await db.collection.update({
            where: { id: collectionId },
            data: {
                ...collectionData,
                updatedAt: now,
            },
        });

        // Update content relationships if provided
        if (contentIds) {
            // Delete existing relationships
            await db.collectionContent.deleteMany({
                where: { collectionId },
            });

            // Create new relationships
            if (contentIds.length > 0) {
                // Use transaction for multiple creates instead of createMany
                await db.$transaction(
                    contentIds.map((contentId) =>
                        db.collectionContent.create({
                            data: {
                                collectionId,
                                contentId,
                            },
                        })
                    )
                );
            }
        }

        revalidatePath("/collections");
        return collection;
    } catch (error) {
        console.error(`Error updating collection:`, error);
        return null;
    }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id } = IdSchema.parse(input);

        await db.collection.delete({
            where: { id },
        });

        revalidatePath("/collections");
        return true;
    } catch (error) {
        console.error(`Error deleting collection:`, error);
        return false;
    }
}

/**
 * Add content to a collection
 */
export async function addContentToCollection(
    input: z.infer<typeof ContentCollectionSchema>
) {
    try {
        const { contentId, collectionId } =
            ContentCollectionSchema.parse(input);

        // Check if the relationship already exists
        const existing =
            await db.collectionContent.findUnique({
                where: {
                    collectionId_contentId: {
                        collectionId,
                        contentId,
                    },
                },
            });

        if (!existing) {
            await db.collectionContent.create({
                data: {
                    collectionId,
                    contentId,
                },
            });

            // Update collection's updatedAt
            await db.collection.update({
                where: { id: collectionId },
                data: { updatedAt: new Date() },
            });
        }

        revalidatePath(`/collections/${collectionId}`);
        return true;
    } catch (error) {
        console.error(
            `Error adding content to collection:`,
            error
        );
        return false;
    }
}

/**
 * Remove content from a collection
 */
export async function removeContentFromCollection(
    input: z.infer<typeof ContentCollectionSchema>
) {
    try {
        const { contentId, collectionId } =
            ContentCollectionSchema.parse(input);

        await db.collectionContent.delete({
            where: {
                collectionId_contentId: {
                    collectionId,
                    contentId,
                },
            },
        });

        // Update collection's updatedAt
        await db.collection.update({
            where: { id: collectionId },
            data: { updatedAt: new Date() },
        });

        revalidatePath(`/collections/${collectionId}`);
        return true;
    } catch (error) {
        console.error(
            `Error removing content from collection:`,
            error
        );
        return false;
    }
}

// ========== User Content Metadata Operations ==========

/**
 * Get user metadata for a specific content
 */
export async function getUserContentMetadata(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id: contentId } = IdSchema.parse(input);

        return await db.userContentMetadata.findUnique({
            where: { contentId },
        });
    } catch (error) {
        console.error(
            `Error getting user content metadata:`,
            error
        );
        return null;
    }
}

/**
 * Get all user content metadata
 */
export async function getAllUserContentMetadata() {
    try {
        return await db.userContentMetadata.findMany({
            include: {
                content: true,
            },
        });
    } catch (error) {
        console.error(
            "Error getting all user content metadata:",
            error
        );
        return [];
    }
}

/**
 * Update user metadata for a content
 */
export async function updateUserContentMetadata(
    contentId: string,
    input: z.infer<typeof UserMetadataSchema>
) {
    try {
        const { id: parsedContentId } = IdSchema.parse({
            id: contentId,
        });
        const data = UserMetadataSchema.parse({
            ...input,
            contentId: parsedContentId,
        });
        const now = new Date();

        // Extract tag and collection IDs
        const { tagIds, collectionIds, ...metadataData } =
            data;

        // Get existing metadata or create if it doesn't exist
        const existingMetadata =
            await db.userContentMetadata.findUnique({
                where: { contentId: parsedContentId },
            });

        let metadata;
        if (existingMetadata) {
            // Update existing metadata
            metadata = await db.userContentMetadata.update({
                where: { id: existingMetadata.id },
                data: {
                    ...metadataData,
                    updatedAt: now,
                },
            });
        } else {
            // Create new metadata
            metadata = await db.userContentMetadata.create({
                data: {
                    id: nanoid(),
                    ...metadataData,
                    updatedAt: now,
                },
            });
        }

        // Update tags if provided
        if (tagIds) {
            // Delete existing tags
            await db.contentTag.deleteMany({
                where: { contentId: parsedContentId },
            });

            // Add new tags
            if (tagIds.length > 0) {
                // Use transaction for multiple creates instead of createMany
                await db.$transaction(
                    tagIds.map((tagId) =>
                        db.contentTag.create({
                            data: {
                                contentId: parsedContentId,
                                tagId,
                            },
                        })
                    )
                );
            }
        }

        // Update collections if provided
        if (collectionIds) {
            // Delete existing collection relationships
            await db.collectionContent.deleteMany({
                where: { contentId: parsedContentId },
            });

            // Add new collection relationships
            if (collectionIds.length > 0) {
                // Use transaction for multiple creates instead of createMany
                await db.$transaction(
                    collectionIds.map((collectionId) =>
                        db.collectionContent.create({
                            data: {
                                contentId: parsedContentId,
                                collectionId,
                            },
                        })
                    )
                );
            }
        }

        revalidatePath(`/content/${parsedContentId}`);
        return metadata;
    } catch (error) {
        console.error(
            `Error updating user content metadata:`,
            error
        );
        return null;
    }
}

// ========== Reading History Operations ==========

/**
 * Get reading history for a specific content
 */
export async function getReadingHistory(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id: contentId } = IdSchema.parse(input);

        return await db.readingHistory.findMany({
            where: { contentId },
            orderBy: { timestamp: "desc" },
            include: {
                volume: true,
            },
        });
    } catch (error) {
        console.error(
            `Error getting reading history:`,
            error
        );
        return [];
    }
}

/**
 * Add or update a reading history entry
 */
export async function updateReadingHistory(
    input: z.infer<typeof ReadingHistorySchema>
) {
    try {
        const data = ReadingHistorySchema.parse(input);
        const now = new Date();

        // Check if an entry for this content and volume already exists
        const existingEntry =
            await db.readingHistory.findFirst({
                where: {
                    contentId: data.contentId,
                    volumeId: data.volumeId,
                },
            });

        let historyEntry;
        if (existingEntry) {
            // Update existing entry
            historyEntry = await db.readingHistory.update({
                where: { id: existingEntry.id },
                data: {
                    position: data.position,
                    chapterHref: data.chapterHref,
                    timestamp: now,
                },
            });
        } else {
            // Create new entry
            historyEntry = await db.readingHistory.create({
                data: {
                    id: nanoid(),
                    contentId: data.contentId,
                    volumeId: data.volumeId,
                    position: data.position,
                    chapterHref: data.chapterHref,
                    timestamp: now,
                },
            });
        }

        // Update user content metadata last read time
        const existingMetadata =
            await db.userContentMetadata.findUnique({
                where: { contentId: data.contentId },
            });

        if (existingMetadata) {
            await db.userContentMetadata.update({
                where: { id: existingMetadata.id },
                data: {
                    updatedAt: now,
                },
            });
        } else {
            // Create basic metadata if it doesn't exist
            await db.userContentMetadata.create({
                data: {
                    id: nanoid(),
                    contentId: data.contentId,
                    favorite: false,
                    updatedAt: now,
                },
            });
        }

        // No revalidation here to avoid re-renders during reading
        return historyEntry;
    } catch (error) {
        console.error(
            "Error updating reading history:",
            error
        );
        return null;
    }
}

/**
 * Manually refresh the Continue Reading section on the homepage
 */
export async function refreshContinueReading() {
    try {
        revalidatePath("/");
        return true;
    } catch (error) {
        console.error(
            "Error refreshing continue reading:",
            error
        );
        return false;
    }
}

// ========== Search Operations ==========

/**
 * Search content with filters
 */
export async function searchContent(
    input: z.infer<typeof SearchSchema>
) {
    try {
        const filters = SearchSchema.parse(input);

        // Build the where clause based on the provided filters
        const where: {
            title?: {
                contains: string;
            };
            contentType?: { in: string[] };
            contentTags?: {
                some: { tagId: { in: string[] } };
            };
            collectionContent?: {
                some: { collectionId: { in: string[] } };
            };
            userData?: {
                status?: { in: string[] };
                favorite?: boolean;
                isNsfw?: boolean;
            };
        } = {};

        // Text search
        if (filters.query) {
            where.title = {
                contains: filters.query,
            };
        }

        // Content type filter
        if (
            filters.contentType &&
            filters.contentType.length > 0
        ) {
            where.contentType = {
                in: filters.contentType,
            };
        }

        // Tag filter
        if (filters.tags && filters.tags.length > 0) {
            where.contentTags = {
                some: {
                    tagId: {
                        in: filters.tags,
                    },
                },
            };
        }

        // Collection filter
        if (
            filters.collections &&
            filters.collections.length > 0
        ) {
            where.collectionContent = {
                some: {
                    collectionId: {
                        in: filters.collections,
                    },
                },
            };
        }

        // User metadata filters
        if (
            filters.status ||
            filters.favorite !== undefined ||
            filters.isNsfw !== undefined
        ) {
            where.userData = {};

            if (
                filters.status &&
                filters.status.length > 0
            ) {
                where.userData.status = {
                    in: filters.status,
                };
            }

            if (filters.favorite !== undefined) {
                where.userData.favorite = filters.favorite;
            }

            if (filters.isNsfw !== undefined) {
                where.userData.isNsfw = filters.isNsfw;
            }
        }

        // Execute the search query
        const results = await db.content.findMany({
            where,
            include: {
                userData: true,
                contentTags: {
                    include: {
                        tag: true,
                    },
                },
            },
            orderBy: {
                lastModified: "desc",
            },
        });

        return results;
    } catch (error) {
        console.error("Error searching content:", error);
        return [];
    }
}

/**
 * Get content by tag
 */
export async function getContentByTag(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id: tagId } = IdSchema.parse(input);

        const contentTags = await db.contentTag.findMany({
            where: { tagId },
            include: {
                content: {
                    include: {
                        userData: true,
                    },
                },
            },
        });

        return contentTags.map((ct) => ct.content);
    } catch (error) {
        console.error(
            `Error getting content by tag:`,
            error
        );
        return [];
    }
}

/**
 * Get content by collection
 */
export async function getContentByCollection(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id: collectionId } = IdSchema.parse(input);

        const collectionContent =
            await db.collectionContent.findMany({
                where: { collectionId },
                include: {
                    content: {
                        include: {
                            userData: true,
                        },
                    },
                },
            });

        return collectionContent.map((cc) => cc.content);
    } catch (error) {
        console.error(
            `Error getting content by collection:`,
            error
        );
        return [];
    }
}

/**
 * Get content with user data
 */
export async function getContentWithUserData(
    input: z.infer<typeof IdSchema>
) {
    try {
        const { id: contentId } = IdSchema.parse(input);

        return await db.content.findUnique({
            where: { id: contentId },
            include: {
                userData: true,
                contentTags: {
                    include: {
                        tag: true,
                    },
                },
                collectionContent: {
                    include: {
                        collection: true,
                    },
                },
                contentVolumes: {
                    orderBy: { volumeNumber: "asc" },
                },
                readingHistory: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                },
            },
        });
    } catch (error) {
        console.error(
            `Error getting content with user data:`,
            error
        );
        return null;
    }
}

/**
 * Get all content with user data
 */
export async function getAllContentWithUserData() {
    try {
        return await db.content.findMany({
            include: {
                userData: true,
                contentTags: {
                    include: {
                        tag: true,
                    },
                },
                readingHistory: {
                    orderBy: { timestamp: "desc" },
                    take: 1,
                },
                contentVolumes: {
                    orderBy: { volumeNumber: "asc" },
                },
            },
            orderBy: {
                lastModified: "desc",
            },
        });
    } catch (error) {
        console.error(
            "Error getting all content with user data:",
            error
        );
        return [];
    }
}
