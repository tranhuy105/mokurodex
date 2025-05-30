// "use server";

// import { prisma } from "@/lib/prisma";
// import { nanoid } from "nanoid";
// import { revalidatePath } from "next/cache";

// // ========== Tag operations ==========

// export async function getTags() {
//     try {
//         return await prisma.tag.findMany({
//             orderBy: { name: "asc" },
//         });
//     } catch (error) {
//         console.error("Error getting tags:", error);
//         return [];
//     }
// }

// export async function getTag(id: string) {
//     try {
//         return await prisma.tag.findUnique({
//             where: { id },
//             include: {
//                 contentTags: {
//                     include: {
//                         content: true,
//                     },
//                 },
//             },
//         });
//     } catch (error) {
//         console.error(`Error getting tag ${id}:`, error);
//         return null;
//     }
// }

// export async function createTag(tag: {
//     name: string;
//     color?: string;
//     type: "genre" | "content" | "custom";
// }) {
//     try {
//         const newTag = await prisma.tag.create({
//             data: {
//                 id: nanoid(),
//                 name: tag.name,
//                 color: tag.color,
//                 type: tag.type,
//             },
//         });

//         revalidatePath("/tags");
//         return newTag;
//     } catch (error) {
//         console.error("Error creating tag:", error);
//         return null;
//     }
// }

// export async function updateTag(
//     id: string,
//     tag: {
//         name?: string;
//         color?: string;
//         type?: "genre" | "content" | "custom";
//     }
// ) {
//     try {
//         const updatedTag = await prisma.tag.update({
//             where: { id },
//             data: tag,
//         });

//         revalidatePath("/tags");
//         return updatedTag;
//     } catch (error) {
//         console.error(`Error updating tag ${id}:`, error);
//         return null;
//     }
// }

// export async function deleteTag(id: string) {
//     try {
//         await prisma.tag.delete({
//             where: { id },
//         });

//         revalidatePath("/tags");
//         return true;
//     } catch (error) {
//         console.error(`Error deleting tag ${id}:`, error);
//         return false;
//     }
// }

// // ========== Collection operations ==========

// export async function getCollections() {
//     try {
//         return await prisma.collection.findMany({
//             orderBy: { name: "asc" },
//             include: {
//                 collectionContent: {
//                     include: {
//                         content: true,
//                     },
//                 },
//             },
//         });
//     } catch (error) {
//         console.error("Error getting collections:", error);
//         return [];
//     }
// }

// export async function getCollection(id: string) {
//     try {
//         return await prisma.collection.findUnique({
//             where: { id },
//             include: {
//                 collectionContent: {
//                     include: {
//                         content: true,
//                     },
//                 },
//             },
//         });
//     } catch (error) {
//         console.error(
//             `Error getting collection ${id}:`,
//             error
//         );
//         return null;
//     }
// }

// export async function createCollection(collection: {
//     name: string;
//     description?: string;
//     coverImage?: string;
//     contentIds?: string[];
// }) {
//     try {
//         const now = new Date();
//         const collectionId = nanoid();

//         const newCollection =
//             await prisma.collection.create({
//                 data: {
//                     id: collectionId,
//                     name: collection.name,
//                     description: collection.description,
//                     coverImage: collection.coverImage,
//                     createdAt: now,
//                     updatedAt: now,
//                     ...(collection.contentIds && {
//                         collectionContent: {
//                             createMany: {
//                                 data: collection.contentIds.map(
//                                     (contentId) => ({
//                                         contentId,
//                                     })
//                                 ),
//                             },
//                         },
//                     }),
//                 },
//             });

//         revalidatePath("/collections");
//         return newCollection;
//     } catch (error) {
//         console.error("Error creating collection:", error);
//         return null;
//     }
// }

// export async function updateCollection(
//     id: string,
//     collection: {
//         name?: string;
//         description?: string;
//         coverImage?: string;
//         contentIds?: string[];
//     }
// ) {
//     try {
//         const now = new Date();

//         // First update basic collection data
//         const updatedCollection =
//             await prisma.collection.update({
//                 where: { id },
//                 data: {
//                     name: collection.name,
//                     description: collection.description,
//                     coverImage: collection.coverImage,
//                     updatedAt: now,
//                 },
//             });

//         // If content IDs are provided, update the relationships
//         if (collection.contentIds) {
//             // Delete existing relationships
//             await prisma.collectionContent.deleteMany({
//                 where: { collectionId: id },
//             });

//             // Create new relationships
//             await prisma.collectionContent.createMany({
//                 data: collection.contentIds.map(
//                     (contentId) => ({
//                         collectionId: id,
//                         contentId,
//                     })
//                 ),
//             });
//         }

//         revalidatePath("/collections");
//         return updatedCollection;
//     } catch (error) {
//         console.error(
//             `Error updating collection ${id}:`,
//             error
//         );
//         return null;
//     }
// }

// export async function deleteCollection(id: string) {
//     try {
//         await prisma.collection.delete({
//             where: { id },
//         });

//         revalidatePath("/collections");
//         return true;
//     } catch (error) {
//         console.error(
//             `Error deleting collection ${id}:`,
//             error
//         );
//         return false;
//     }
// }

// export async function addContentToCollection(
//     collectionId: string,
//     contentId: string
// ) {
//     try {
//         await prisma.collectionContent.create({
//             data: {
//                 collectionId,
//                 contentId,
//             },
//         });

//         revalidatePath(`/collections/${collectionId}`);
//         revalidatePath(`/content/${contentId}`);
//         return true;
//     } catch (error) {
//         console.error(
//             `Error adding content ${contentId} to collection ${collectionId}:`,
//             error
//         );
//         return false;
//     }
// }

// export async function removeContentFromCollection(
//     collectionId: string,
//     contentId: string
// ) {
//     try {
//         await prisma.collectionContent.delete({
//             where: {
//                 collectionId_contentId: {
//                     collectionId,
//                     contentId,
//                 },
//             },
//         });

//         revalidatePath(`/collections/${collectionId}`);
//         revalidatePath(`/content/${contentId}`);
//         return true;
//     } catch (error) {
//         console.error(
//             `Error removing content ${contentId} from collection ${collectionId}:`,
//             error
//         );
//         return false;
//     }
// }

// // ========== User content metadata operations ==========

// export async function getUserContentMetadata(
//     contentId: string
// ) {
//     try {
//         return await prisma.userContentMetadata.findUnique({
//             where: { contentId },
//         });
//     } catch (error) {
//         console.error(
//             `Error getting user metadata for content ${contentId}:`,
//             error
//         );
//         return null;
//     }
// }

// export async function getAllUserContentMetadata() {
//     try {
//         return await prisma.userContentMetadata.findMany();
//     } catch (error) {
//         console.error(
//             "Error getting all user metadata:",
//             error
//         );
//         return [];
//     }
// }

// export async function updateUserContentMetadata(
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
//     try {
//         const now = new Date();

//         // Extract tag and collection IDs from the metadata
//         const { tagIds, collectionIds, ...metadataUpdate } =
//             metadata;

//         // Find existing metadata
//         const existingMetadata =
//             await prisma.userContentMetadata.findUnique({
//                 where: { contentId },
//             });

//         let userMetadata;

//         if (existingMetadata) {
//             // Update existing metadata
//             userMetadata =
//                 await prisma.userContentMetadata.update({
//                     where: { id: existingMetadata.id },
//                     data: {
//                         ...metadataUpdate,
//                         updatedAt: now,
//                     },
//                 });
//         } else {
//             // Create new metadata if it doesn't exist
//             userMetadata =
//                 await prisma.userContentMetadata.create({
//                     data: {
//                         id: nanoid(),
//                         contentId,
//                         ...metadataUpdate,
//                         updatedAt: now,
//                     },
//                 });
//         }

//         // Update tags if provided
//         if (tagIds) {
//             // Delete existing tag relationships
//             await prisma.contentTag.deleteMany({
//                 where: { contentId },
//             });

//             // Create new tag relationships
//             if (tagIds.length > 0) {
//                 await prisma.contentTag.createMany({
//                     data: tagIds.map((tagId) => ({
//                         contentId,
//                         tagId,
//                     })),
//                 });
//             }
//         }

//         // Update collections if provided
//         if (collectionIds) {
//             // Delete existing collection relationships
//             await prisma.collectionContent.deleteMany({
//                 where: { contentId },
//             });

//             // Create new collection relationships
//             if (collectionIds.length > 0) {
//                 await prisma.collectionContent.createMany({
//                     data: collectionIds.map(
//                         (collectionId) => ({
//                             contentId,
//                             collectionId,
//                         })
//                     ),
//                 });
//             }
//         }

//         revalidatePath(`/content/${contentId}`);
//         return userMetadata;
//     } catch (error) {
//         console.error(
//             `Error updating metadata for content ${contentId}:`,
//             error
//         );
//         return null;
//     }
// }

// // ========== Reading history operations ==========

// export async function getReadingHistory(contentId: string) {
//     try {
//         return await prisma.readingHistory.findMany({
//             where: { contentId },
//             orderBy: { timestamp: "desc" },
//             include: {
//                 volume: true,
//             },
//         });
//     } catch (error) {
//         console.error(
//             `Error getting reading history for content ${contentId}:`,
//             error
//         );
//         return [];
//     }
// }

// export async function addReadingHistoryEntry(entry: {
//     contentId: string;
//     volumeId: string;
//     position: number;
//     chapterHref?: string;
// }) {
//     try {
//         const now = new Date();

//         // Check if an entry for this content and volume already exists
//         const existingEntry =
//             await prisma.readingHistory.findFirst({
//                 where: {
//                     contentId: entry.contentId,
//                     volumeId: entry.volumeId,
//                 },
//             });

//         let historyEntry;

//         if (existingEntry) {
//             // Update existing entry
//             historyEntry =
//                 await prisma.readingHistory.update({
//                     where: { id: existingEntry.id },
//                     data: {
//                         position: entry.position,
//                         chapterHref: entry.chapterHref,
//                         timestamp: now,
//                     },
//                 });
//         } else {
//             // Create new entry if none exists
//             historyEntry =
//                 await prisma.readingHistory.create({
//                     data: {
//                         id: nanoid(),
//                         contentId: entry.contentId,
//                         volumeId: entry.volumeId,
//                         position: entry.position,
//                         chapterHref: entry.chapterHref,
//                         timestamp: now,
//                     },
//                 });
//         }

//         // Update user content metadata last read time
//         const existingMetadata =
//             await prisma.userContentMetadata.findUnique({
//                 where: { contentId: entry.contentId },
//             });

//         if (existingMetadata) {
//             await prisma.userContentMetadata.update({
//                 where: { id: existingMetadata.id },
//                 data: {
//                     updatedAt: now,
//                 },
//             });
//         } else {
//             // Create basic metadata if it doesn't exist
//             await prisma.userContentMetadata.create({
//                 data: {
//                     id: nanoid(),
//                     contentId: entry.contentId,
//                     favorite: false,
//                     updatedAt: now,
//                 },
//             });
//         }

//         // No revalidation here to avoid re-renders during reading
//         return historyEntry;
//     } catch (error) {
//         console.error(
//             "Error updating reading progress:",
//             error
//         );
//         throw new Error(
//             "Failed to update reading progress"
//         );
//     }
// }

// export async function refreshContinueReading() {
//     try {
//         revalidatePath("/");
//         return true;
//     } catch (error) {
//         console.error(
//             "Error refreshing continue reading:",
//             error
//         );
//         return false;
//     }
// }

// // ========== Search operations ==========

// export async function searchContentWithFilters(options: {
//     query?: string;
//     tags?: string[];
//     collections?: string[];
//     status?: string[];
//     favorite?: boolean;
//     isNsfw?: boolean;
//     contentType?: string[];
// }) {
//     try {
//         // Build the where clause based on the provided options
//         const where: {
//             title?: {
//                 contains: string;
//                 mode: "insensitive";
//             };
//             contentType?: { in: string[] };
//             contentTags?: {
//                 some: { tagId: { in: string[] } };
//             };
//             collectionContent?: {
//                 some: { collectionId: { in: string[] } };
//             };
//             userData?: {
//                 status?: { in: string[] };
//                 favorite?: boolean;
//                 isNsfw?: boolean;
//             };
//         } = {};

//         // Text search
//         if (options.query) {
//             where.title = {
//                 contains: options.query,
//                 mode: "insensitive",
//             };
//         }

//         // Content type filter
//         if (
//             options.contentType &&
//             options.contentType.length > 0
//         ) {
//             where.contentType = {
//                 in: options.contentType,
//             };
//         }

//         // Tag filter
//         if (options.tags && options.tags.length > 0) {
//             where.contentTags = {
//                 some: {
//                     tagId: {
//                         in: options.tags,
//                     },
//                 },
//             };
//         }

//         // Collection filter
//         if (
//             options.collections &&
//             options.collections.length > 0
//         ) {
//             where.collectionContent = {
//                 some: {
//                     collectionId: {
//                         in: options.collections,
//                     },
//                 },
//             };
//         }

//         // Status filter
//         if (options.status && options.status.length > 0) {
//             where.userData = {
//                 ...(where.userData || {}),
//                 status: {
//                     in: options.status,
//                 },
//             };
//         }

//         // Favorite filter
//         if (options.favorite !== undefined) {
//             where.userData = {
//                 ...(where.userData || {}),
//                 favorite: options.favorite,
//             };
//         }

//         // NSFW filter
//         if (options.isNsfw !== undefined) {
//             where.userData = {
//                 ...(where.userData || {}),
//                 isNsfw: options.isNsfw,
//             };
//         }

//         // Execute the query
//         const results = await prisma.content.findMany({
//             where,
//             include: {
//                 userData: true,
//                 contentVolumes: {
//                     orderBy: {
//                         volumeNumber: "asc",
//                     },
//                     take: 1,
//                 },
//                 contentTags: {
//                     include: {
//                         tag: true,
//                     },
//                 },
//             },
//             orderBy: {
//                 lastModified: "desc",
//             },
//         });

//         return results;
//     } catch (error) {
//         console.error("Error searching content:", error);
//         return [];
//     }
// }

// export async function getContentByTag(tagId: string) {
//     try {
//         const tag = await prisma.tag.findUnique({
//             where: { id: tagId },
//             include: {
//                 contentTags: {
//                     include: {
//                         content: {
//                             include: {
//                                 userData: true,
//                                 contentVolumes: {
//                                     orderBy: {
//                                         volumeNumber: "asc",
//                                     },
//                                     take: 1,
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//         });

//         if (!tag) return [];

//         return tag.contentTags.map((ct) => ct.content);
//     } catch (error) {
//         console.error(
//             `Error getting content for tag ${tagId}:`,
//             error
//         );
//         return [];
//     }
// }

// export async function getContentByCollection(
//     collectionId: string
// ) {
//     try {
//         const collection =
//             await prisma.collection.findUnique({
//                 where: { id: collectionId },
//                 include: {
//                     collectionContent: {
//                         include: {
//                             content: {
//                                 include: {
//                                     userData: true,
//                                     contentVolumes: {
//                                         orderBy: {
//                                             volumeNumber:
//                                                 "asc",
//                                         },
//                                         take: 1,
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                 },
//             });

//         if (!collection) return [];

//         return collection.collectionContent.map(
//             (cc) => cc.content
//         );
//     } catch (error) {
//         console.error(
//             `Error getting content for collection ${collectionId}:`,
//             error
//         );
//         return [];
//     }
// }

// export async function getContentWithUserData(
//     contentId: string
// ) {
//     try {
//         return await prisma.content.findUnique({
//             where: { id: contentId },
//             include: {
//                 userData: true,
//                 contentVolumes: {
//                     orderBy: {
//                         volumeNumber: "asc",
//                     },
//                 },
//                 contentTags: {
//                     include: {
//                         tag: true,
//                     },
//                 },
//                 collectionContent: {
//                     include: {
//                         collection: true,
//                     },
//                 },
//             },
//         });
//     } catch (error) {
//         console.error(
//             `Error getting content with user data for ${contentId}:`,
//             error
//         );
//         return null;
//     }
// }

// export async function getAllContentWithUserData() {
//     try {
//         return await prisma.content.findMany({
//             include: {
//                 userData: true,
//                 contentVolumes: {
//                     orderBy: {
//                         volumeNumber: "asc",
//                     },
//                     take: 1,
//                 },
//                 contentTags: {
//                     include: {
//                         tag: true,
//                     },
//                 },
//             },
//             orderBy: {
//                 lastModified: "desc",
//             },
//         });
//     } catch (error) {
//         console.error(
//             "Error getting all content with user data:",
//             error
//         );
//         return [];
//     }
// }
