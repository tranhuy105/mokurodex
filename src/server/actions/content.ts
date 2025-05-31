"use server";

import { extractEpubMetadata } from "@/lib/epub/epub-extractor";
import { db } from "@/server/db/client";
import {
    ContentIdSchema,
    ContentImportSchema,
    EpubRequestSchema,
    ScanDirectorySchema,
    VolumeIdSchema,
} from "@/types/validation";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import path from "path";
import { z } from "zod";

// ========== Validation Schemas ==========

// ========== Content Import Actions ==========

/**
 * Import content from a directory
 * This is the main entry point for importing content
 * It will detect the content type based on the files in the directory
 * 
 * This function checks for duplicates by directory path and returns existing content when found,
 * ensuring consistent behavior across both individual imports and directory scanning.
 */
export async function importContent(
    input: z.infer<typeof ContentImportSchema>
) {
    try {
        const {
            directoryPath,
            providedContentId,
            isCustomPath,
        } = ContentImportSchema.parse(input);

        // Dynamically import server-only functions
        const { readDirectory, isDirectory } = await import(
            "@/lib/server/fs-adapter"
        );

        // Check if the directory exists
        if (!(await isDirectory(directoryPath))) {
            throw new Error(
                `Directory does not exist: ${directoryPath}`
            );
        }

        // Check if content already exists with this directory path
        const existingContent = await db.content.findFirst({
            where: { directoryPath: directoryPath },
            include: {
                contentVolumes: true,
            },
        });

        if (existingContent) {
            // Content already exists, return it directly
            console.log(
                `Content already exists for ${directoryPath}, returning existing content`
            );
            return existingContent;
        }

        // Look for files in the directory
        const files = await readDirectory(directoryPath);

        // Determine content type based on file extensions
        const hasMokuroFiles = files.some((file) =>
            file.endsWith(".mokuro")
        );
        const hasEpubFiles = files.some((file) =>
            file.endsWith(".epub")
        );

        if (hasMokuroFiles && hasEpubFiles) {
            throw new Error(
                `Multiple content types found in ${directoryPath}`
            );
        }

        if (hasMokuroFiles) {
            // Import as manga
            const result = await importMangaFromDirectory(
                directoryPath,
                providedContentId,
                isCustomPath
            );
            revalidatePath("/content");
            return result;
        } else if (hasEpubFiles) {
            // Import as light novel
            const result =
                await importLightNovelFromDirectory(
                    directoryPath,
                    providedContentId,
                    isCustomPath
                );
            revalidatePath("/content");
            return result;
        } else {
            throw new Error(
                `No supported content files found in ${directoryPath}`
            );
        }
    } catch (error) {
        console.error(
            `Error importing content directory:`,
            error
        );
        return null;
    }
}

/**
 * Import manga from a directory with .mokuro files
 */
async function importMangaFromDirectory(
    directoryPath: string,
    providedContentId: string | null = null,
    isCustomPath: boolean = false
) {
    const now = new Date();

    try {
        // Dynamically import server-only functions
        const {
            readDirectory,
            readFile,
            joinPath,
            getFileStats,
        } = await import("@/lib/server/fs-adapter");

        // Look for .mokuro files in the manga directory
        const files = await readDirectory(directoryPath);
        const mokuroFiles = files.filter((file: string) =>
            file.endsWith(".mokuro")
        );

        if (mokuroFiles.length === 0) {
            throw new Error(
                `No .mokuro files found in ${directoryPath}`
            );
        }

        // Get stats for the directory
        const stats = await getFileStats(directoryPath);
        const addedDate = stats.birthtime || stats.mtime;
        const lastModified = stats.mtime;

        // Read the first .mokuro file to get content info
        const firstMokuroFile = await joinPath(
            directoryPath,
            mokuroFiles[0]
        );
        const firstMokuroContent = await readFile(
            firstMokuroFile
        );
        const firstMokuroData = JSON.parse(
            firstMokuroContent
        );

        // Check if content already exists with this directory path
        // NOTE: This check is now redundant as importContent already does this check
        // We keep it here for the existingVolumes data we need later
        const existingContent = await db.content.findFirst({
            where: { directoryPath: directoryPath },
            include: {
                contentVolumes: true,
            },
        });

        // Generate a content ID - use existing ID if found, provided ID if given, or generate new one
        const contentId =
            existingContent?.id ||
            providedContentId ||
            nanoid();

        // Get the cover image from the first page of the first volume
        let coverImage = null;
        if (
            firstMokuroData.pages &&
            firstMokuroData.pages.length > 0
        ) {
            const firstPage = firstMokuroData.pages[0];
            const imageName =
                firstPage.img_path || "page_1.jpg";
            coverImage = await createContentImagePath(
                contentId,
                firstMokuroData.volume,
                imageName,
                directoryPath
            );
        }

        // Create or update the content entity using Prisma
        const content = await db.content.upsert({
            where: { id: contentId },
            update: {
                title:
                    firstMokuroData.title ||
                    path.basename(directoryPath),
                volumes: mokuroFiles.length,
                coverImage: coverImage,
                lastModified: lastModified,
                directoryPath: directoryPath,
                lastScanned: now,
                scanStatus: "complete",
                contentType: "manga",
            },
            create: {
                id: contentId,
                title:
                    firstMokuroData.title ||
                    path.basename(directoryPath),
                volumes: mokuroFiles.length,
                coverImage: coverImage,
                addedDate: addedDate,
                lastModified: lastModified,
                directoryPath: directoryPath,
                lastScanned: now,
                scanStatus: "complete",
                contentType: "manga",
            },
        });

        // Create default user metadata if it doesn't exist
        await createDefaultUserMetadata(contentId);

        // Get existing volumes to avoid reimporting
        const existingVolumes =
            existingContent?.contentVolumes || [];
        const existingVolumeFilePaths = new Set(
            existingVolumes.map((vol) => vol.filePath)
        );

        // Process and import each volume
        for (const mokuroFile of mokuroFiles) {
            const mokuroPath = await joinPath(
                directoryPath,
                mokuroFile
            );

            // Skip this volume if it already exists by filepath
            if (existingVolumeFilePaths.has(mokuroPath)) {
                console.log(
                    `Skipping existing volume: ${mokuroPath}`
                );
                continue;
            }

            const mokuroContent = await readFile(
                mokuroPath
            );
            const mokuroData = JSON.parse(mokuroContent);

            // Check for volume ID
            const volumeUuid =
                mokuroData.volume_uuid || nanoid();

            // Generate a new unique ID for this volume that's different from volumeUuid
            // This ensures we don't have ID conflicts
            const volumeId = nanoid();

            // Skip if the volume UUID already exists (additional check)
            if (
                existingVolumes.some(
                    (vol) => vol.volumeUuid === volumeUuid
                )
            ) {
                console.log(
                    `Skipping volume with duplicate UUID: ${volumeUuid}`
                );
                continue;
            }

            // Get file stats
            const volumeStats = await getFileStats(
                mokuroPath
            );
            const volumeAddedDate =
                volumeStats.birthtime || volumeStats.mtime;
            const volumeLastModified = volumeStats.mtime;

            // Get cover image
            let volumeCoverImage = null;
            if (
                mokuroData.pages &&
                mokuroData.pages.length > 0
            ) {
                const firstPage = mokuroData.pages[0];
                const imageName =
                    firstPage.img_path || "page_1.jpg";
                volumeCoverImage =
                    await createContentImagePath(
                        contentId,
                        mokuroData.volume,
                        imageName,
                        directoryPath
                    );
            }

            // Extract preview images
            const previewImages =
                await extractPreviewImages(
                    contentId,
                    mokuroData,
                    mokuroData.volume,
                    directoryPath
                );

            // Extract volume number from volume name or use index
            const volumeNumber =
                extractVolumeNumber(mokuroData.volume) ||
                mokuroFiles.indexOf(mokuroFile) + 1;

            // Create the volume
            const volume = await db.volume.create({
                data: {
                    id: volumeId,
                    contentId: contentId,
                    volumeNumber: volumeNumber,
                    volumeTitle:
                        mokuroData.volume ||
                        `Volume ${volumeNumber}`,
                    filePath: mokuroPath,
                    coverImage: volumeCoverImage,
                    pageCount:
                        mokuroData.pages?.length || 0,
                    addedDate: volumeAddedDate,
                    lastModified: volumeLastModified,
                    volumeUuid: volumeUuid,
                    volumeType: "manga",
                    previewImages:
                        previewImages.length > 0
                            ? JSON.stringify(previewImages)
                            : null,
                },
            });

            // Import pages and text blocks
            await importPagesAndTextBlocks(
                volume.id,
                contentId,
                mokuroData
            );
        }

        revalidatePath(`/content/${contentId}`);
        return content;
    } catch (error) {
        console.error(
            `Error importing manga directory ${directoryPath}:`,
            error
        );

        // If this is not a custom path, update the content entity with error status
        if (!isCustomPath && providedContentId) {
            try {
                await db.content.update({
                    where: { id: providedContentId },
                    data: {
                        scanStatus: "error",
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        lastScanned: new Date(),
                    },
                });
            } catch (updateError) {
                console.error(
                    "Error updating content with error status:",
                    updateError
                );
            }
        }

        return null;
    }
}

/**
 * Import light novel from a directory with .epub files
 */
async function importLightNovelFromDirectory(
    directoryPath: string,
    providedContentId: string | null = null,
    isCustomPath: boolean = false
) {
    const now = new Date();

    try {
        // Dynamically import server-only functions
        const { readDirectory, getFileStats, fileExists } =
            await import("@/lib/server/fs-adapter");

        // Look for .epub files in the directory
        const files = await readDirectory(directoryPath);
        const epubFiles = files.filter((file: string) =>
            file.endsWith(".epub")
        );

        if (epubFiles.length === 0) {
            throw new Error(
                `No .epub files found in ${directoryPath}`
            );
        }

        // Get stats for the directory
        const stats = await getFileStats(directoryPath);
        const seriesName = path.basename(directoryPath);
        const contentId = providedContentId || nanoid();

        // Create metadata directory: /directoryPath/.metadata/
        const metadataDir = path.join(
            directoryPath,
            ".metadata"
        );

        // Check if content already exists with this directory path
        // NOTE: This check is now redundant as importContent already does this check
        // We keep it here for the existingVolumes data we need later
        const existingContent = await db.content.findFirst({
            where: { directoryPath: directoryPath },
            include: {
                contentVolumes: true,
            },
        });

        // Get the first EPUB to extract metadata
        const firstEpubPath = path.join(
            directoryPath,
            epubFiles[0]
        );

        // Create a volume-specific metadata directory for the first volume
        const firstVolumeMetadataDir = path.join(
            metadataDir,
            "vol1"
        );
        await fs.mkdir(firstVolumeMetadataDir, {
            recursive: true,
        });

        const extractResult = await extractEpubMetadata(
            firstEpubPath,
            firstVolumeMetadataDir
        );

        // Create or update content record
        const content = await db.content.upsert({
            where: { id: existingContent?.id || contentId },
            update: {
                lastModified: stats.mtime,
                lastScanned: now,
                scanStatus: "complete",
                contentType: "lightnovel",
                volumes: epubFiles.length,
                ...(extractResult.coverImagePath && {
                    coverImage: createEpubImageUrl(
                        extractResult.coverImagePath
                    ),
                }),
            },
            create: {
                id: contentId,
                title: seriesName,
                volumes: epubFiles.length,
                addedDate: stats.birthtime || stats.mtime,
                lastModified: stats.mtime,
                directoryPath,
                lastScanned: now,
                scanStatus: "complete",
                contentType: "lightnovel",
                coverImage: extractResult.coverImagePath
                    ? createEpubImageUrl(
                          extractResult.coverImagePath
                      )
                    : undefined,
            },
        });

        // Create user metadata if needed
        await createDefaultUserMetadata(
            content.id,
            extractResult.metadata
        );

        // Get existing volumes to avoid reimporting
        const existingVolumes =
            existingContent?.contentVolumes || [];
        const existingVolumesByNumber = new Map(
            existingVolumes
                .filter((v) => v.volumeType === "epub")
                .map((v) => [v.volumeNumber, v])
        );

        // Process each EPUB file
        for (const epubFile of epubFiles) {
            const epubPath = path.join(
                directoryPath,
                epubFile
            );

            if (!(await fileExists(epubPath))) {
                console.warn(
                    `File does not exist: ${epubPath}`
                );
                continue;
            }

            const epubStats = await getFileStats(epubPath);
            const volumeNumber =
                extractVolumeNumber(epubPath) || 1;

            // Check if already imported and up to date
            const existingVolume =
                existingVolumesByNumber.get(volumeNumber);
            if (
                existingVolume &&
                existingVolume.lastModified >=
                    epubStats.mtime
            ) {
                console.log(
                    `Volume ${volumeNumber} is up to date, skipping`
                );
                continue;
            }

            // Create a volume-specific metadata directory
            const volumeMetadataDir = path.join(
                metadataDir,
                `vol${volumeNumber}`
            );
            await fs.mkdir(volumeMetadataDir, {
                recursive: true,
            });

            // Extract EPUB metadata
            const extractResult = await extractEpubMetadata(
                epubPath,
                volumeMetadataDir
            );

            // Delete existing volume if updating
            if (existingVolume) {
                await db.volume.delete({
                    where: { id: existingVolume.id },
                });
            }

            // Create EPUB volume record
            await db.volume.create({
                data: {
                    id: nanoid(),
                    contentId: content.id,
                    volumeNumber: volumeNumber,
                    volumeTitle:
                        extractResult.metadata.title,
                    filePath: epubPath,
                    coverImage: extractResult.coverImagePath
                        ? createEpubImageUrl(
                              extractResult.coverImagePath
                          )
                        : undefined,
                    addedDate:
                        epubStats.birthtime ||
                        epubStats.mtime,
                    lastModified: epubStats.mtime,
                    volumeUuid: nanoid(),
                    volumeType: "epub",
                    metadata: JSON.stringify(
                        extractResult.metadata
                    ),
                    pageCount: 0, // Not applicable for EPUB
                },
            });
        }

        revalidatePath(`/content/${content.id}`);
        return content;
    } catch (error) {
        console.error(
            `Error importing light novel directory ${directoryPath}:`,
            error
        );

        // If this is not a custom path, update the content entity with error status
        if (!isCustomPath && providedContentId) {
            try {
                await db.content.update({
                    where: { id: providedContentId },
                    data: {
                        scanStatus: "error",
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        lastScanned: new Date(),
                    },
                });
            } catch (updateError) {
                console.error(
                    "Error updating content with error status:",
                    updateError
                );
            }
        }

        return null;
    }
}

// ========== Content Query Actions ==========

/**
 * Get all content from the database
 */
export async function getAllContent() {
    try {
        return await db.content.findMany({
            orderBy: { lastModified: "desc" },
            include: {
                userData: true,
            },
        });
    } catch (error) {
        console.error("Error getting all content:", error);
        return [];
    }
}

/**
 * Get a single content by ID with its volumes
 */
export async function getContentWithVolumes(
    input: z.infer<typeof ContentIdSchema>
) {
    try {
        const { id } = ContentIdSchema.parse(input);

        return await db.content.findUnique({
            where: { id },
            include: {
                contentVolumes: {
                    orderBy: { volumeNumber: "asc" },
                },
                userData: true,
            },
        });
    } catch (error) {
        console.error(
            `Error getting content with volumes:`,
            error
        );
        return null;
    }
}

/**
 * Get pages for a specific volume
 */
export async function getVolumePages(
    input: z.infer<typeof VolumeIdSchema>
) {
    try {
        const { id: volumeId } =
            VolumeIdSchema.parse(input);

        return await db.page.findMany({
            where: { volumeId },
            orderBy: { pageNumber: "asc" },
            include: {
                textBlocks: true,
            },
        });
    } catch (error) {
        console.error(
            `Error getting pages for volume:`,
            error
        );
        return [];
    }
}

/**
 * Delete content and all related data
 */
export async function deleteContent(
    input: z.infer<typeof ContentIdSchema>
) {
    try {
        const { id } = ContentIdSchema.parse(input);

        // Prisma will cascade delete all related data
        await db.content.delete({
            where: { id },
        });

        revalidatePath("/content");
        return true;
    } catch (error) {
        console.error(`Error deleting content:`, error);
        return false;
    }
}

/**
 * Clear all content data
 */
export async function clearAndRescanAllContent() {
    try {
        // Delete all content (cascades to all related data)
        await db.content.deleteMany();

        // Return empty array since we're not rescanning
        return [];
    } catch (error) {
        console.error(
            "Error clearing content data:",
            error
        );
        return [];
    }
}

/**
 * Get a direct URL to the EPUB file for client-side rendering
 */
export async function getEpubFileUrl(
    input: z.infer<typeof EpubRequestSchema>
) {
    try {
        const { contentId, volumeNumber } =
            EpubRequestSchema.parse(input);

        const volume = await db.volume.findFirst({
            where: {
                contentId,
                volumeNumber,
                volumeType: "epub",
            },
            select: { id: true },
        });

        if (!volume) return null;

        // Return URL to API endpoint for serving the EPUB file
        return `/api/epub?contentId=${contentId}&volumeNumber=${volumeNumber}`;
    } catch (error) {
        console.error(
            "Error creating EPUB file URL:",
            error
        );
        return null;
    }
}

/**
 * Scan a directory for content (manga or light novels) with detailed progress updates
 * This version provides more granular progress tracking for the workflow visualization
 */
export async function scanContentDirectoryWithProgress(
    input: z.infer<typeof ScanDirectorySchema>
) {
    try {
        const { baseDir, contentType } =
            ScanDirectorySchema.parse(input);

        // Step 1: Initialize scan - construct the path to the content directory
        const subDir =
            contentType === "manga" ? "manga" : "ln";
        const targetPath = path.join(baseDir, subDir);

        // Dynamically import server-only functions
        const {
            readDirectoryWithFileTypes,
            directoryExists,
        } = await import("@/lib/server/fs-adapter");

        // Step 2: Verify directory exists
        if (!(await directoryExists(targetPath))) {
            return {
                step: "verify_directory",
                success: false,
                error: `Directory not found: ${targetPath}. Please create it first.`,
                importedCount: 0,
                failedCount: 0,
                importedItems: [],
                failedItems: [],
            };
        }

        // Step 3: List subdirectories in the target path
        const entries = await readDirectoryWithFileTypes(
            targetPath
        );

        // Filter for directories only
        const subDirectories = entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => ({
                name: entry.name,
                path: path.join(targetPath, entry.name),
            }));

        if (subDirectories.length === 0) {
            return {
                step: "find_content_directories",
                success: false,
                error: `No subdirectories found in ${targetPath}`,
                importedCount: 0,
                failedCount: 0,
                importedItems: [],
                failedItems: [],
            };
        }

        // Step 4: Process each subdirectory
        const successfulImports = [];
        const failedImports = [];

        for (const dir of subDirectories) {
            try {
                // Step 5: Detect content type
                const { readDirectory } = await import(
                    "@/lib/server/fs-adapter"
                );
                const files = await readDirectory(dir.path);

                const hasMokuroFiles = files.some((file) =>
                    file.endsWith(".mokuro")
                );
                const hasEpubFiles = files.some((file) =>
                    file.endsWith(".epub")
                );

                if (!hasMokuroFiles && !hasEpubFiles) {
                    failedImports.push({
                        name: dir.name,
                        error: "No supported content files found",
                    });
                    continue;
                }

                // Step 6: Import content
                const result = await importContent({
                    directoryPath: dir.path,
                    isCustomPath: false,
                    providedContentId: null,
                });

                if (result) {
                    successfulImports.push({
                        name: dir.name,
                        id: result.id,
                        type: result.contentType,
                    });
                } else {
                    failedImports.push({
                        name: dir.name,
                        error: "Import failed",
                    });
                }
            } catch (error) {
                console.error(
                    `Error importing ${dir.path}:`,
                    error
                );
                failedImports.push({
                    name: dir.name,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
        }

        // Step 7: Complete - return results
        return {
            step: "complete",
            success: successfulImports.length > 0,
            importedCount: successfulImports.length,
            failedCount: failedImports.length,
            importedItems: successfulImports,
            failedItems: failedImports,
        };
    } catch (error) {
        console.error(
            "Error scanning content directory:",
            error
        );
        return {
            step: "error",
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            importedCount: 0,
            failedCount: 0,
            importedItems: [],
            failedItems: [],
        };
    }
}

// ========== Helper Functions ==========

/**
 * Import pages and text blocks for a volume
 */
async function importPagesAndTextBlocks(
    volumeId: string,
    contentId: string,
    mokuroData: {
        volume: string;
        pages?: Array<{
            img_path?: string;
            img_width?: number;
            img_height?: number;
            blocks?: Array<{
                box: [number, number, number, number];
                lines: string[];
                font_size: number;
                vertical: boolean;
                lines_coords?: number[][][];
            }>;
        }>;
    }
) {
    try {
        // Skip if no pages
        if (
            !mokuroData.pages ||
            mokuroData.pages.length === 0
        ) {
            return;
        }

        // Get content directory path from database
        const content = await db.content.findUnique({
            where: { id: contentId },
            select: { directoryPath: true },
        });

        if (!content || !content.directoryPath) {
            throw new Error(
                `Content ${contentId} not found or has no directory path`
            );
        }

        // Delete existing pages for this volume to avoid duplicates
        await db.page.deleteMany({
            where: { volumeId },
        });

        // Get volume info to determine the volume directory
        const volume = await db.volume.findUnique({
            where: { id: volumeId },
            select: { filePath: true },
        });

        if (!volume || !volume.filePath) {
            throw new Error(
                `Volume ${volumeId} not found or has no file path`
            );
        }

        // Prepare batch arrays for pages and text blocks
        const pageBatch: Array<{
            id: string;
            volumeId: string;
            pageNumber: number;
            imagePath: string;
            width: number;
            height: number;
        }> = [];

        const textBlocksBatch: Array<{
            id: string;
            pageId: string;
            boxX: number;
            boxY: number;
            boxWidth: number;
            boxHeight: number;
            text: string;
            fontSize: number;
            isVertical: boolean;
            linesCoords: string | null;
        }> = [];

        // Process each page
        for (
            let pageIndex = 0;
            pageIndex < mokuroData.pages.length;
            pageIndex++
        ) {
            const page = mokuroData.pages[pageIndex];
            const pageNumber = pageIndex + 1;
            const imageName =
                page.img_path || `page_${pageNumber}.jpg`;

            // Create API path with absolute path
            const apiImagePath =
                await createContentImagePath(
                    contentId,
                    mokuroData.volume,
                    imageName,
                    content.directoryPath
                );

            // Generate page ID
            const pageId = `${volumeId}_page_${pageNumber}`;

            // Add page to batch
            pageBatch.push({
                id: pageId,
                volumeId,
                pageNumber,
                imagePath: apiImagePath,
                width: page.img_width || 800,
                height: page.img_height || 1200,
            });

            // Process text blocks on the page
            if (page.blocks && page.blocks.length > 0) {
                page.blocks.forEach((block) => {
                    textBlocksBatch.push({
                        id: nanoid(),
                        pageId: pageId,
                        boxX: block.box[0],
                        boxY: block.box[1],
                        boxWidth:
                            block.box[2] - block.box[0],
                        boxHeight:
                            block.box[3] - block.box[1],
                        text: JSON.stringify(block.lines),
                        fontSize: block.font_size || 12,
                        isVertical: block.vertical || false,
                        linesCoords: block.lines_coords
                            ? JSON.stringify(
                                  block.lines_coords
                              )
                            : null,
                    });
                });
            }
        }

        // Bulk insert all pages at once
        if (pageBatch.length > 0) {
            await db.page.createMany({
                data: pageBatch,
            });
        }

        // Bulk insert all text blocks at once
        if (textBlocksBatch.length > 0) {
            await db.textBlock.createMany({
                data: textBlocksBatch,
            });
        }
    } catch (error) {
        console.error(
            `Error importing pages for volume ${volumeId}:`,
            error
        );
        throw error;
    }
}

/**
 * Create default user metadata for newly imported content
 */
async function createDefaultUserMetadata(
    contentId: string,
    metadata?: {
        title: string;
        creator?: string;
        publisher?: string;
    }
) {
    try {
        // Check if user metadata already exists for this content
        const existingMetadata =
            await db.userContentMetadata.findUnique({
                where: { contentId },
            });

        // Only create if it doesn't exist
        if (!existingMetadata) {
            const now = new Date();

            // Create basic metadata with default values
            await db.userContentMetadata.create({
                data: {
                    id: nanoid(),
                    contentId,
                    favorite: false,
                    status: "plan-to-read",
                    progress: 0,
                    author: metadata?.creator || null,
                    publisher: metadata?.publisher || null,
                    updatedAt: now,
                },
            });

            console.log(
                `Created default user metadata for content ${contentId}`
            );
        }
    } catch (error) {
        console.error(
            `Error creating default user metadata for content ${contentId}:`,
            error
        );
    }
}

/**
 * Extract and save preview images for a volume during import
 */
async function extractPreviewImages(
    contentId: string,
    volumeData: { pages?: Array<{ img_path?: string }> },
    volumeName: string,
    directoryPath: string
): Promise<string[]> {
    try {
        const pages = volumeData.pages || [];
        const totalPages = pages.length;

        if (totalPages === 0) {
            return [];
        }

        // Calculate indices for preview pages (max 8 pages)
        const previewIndices: number[] = [];

        // For very small volumes, take what we can get
        if (totalPages <= 8) {
            // Take all pages for volumes with 8 or fewer pages
            for (let i = 0; i < totalPages; i++) {
                previewIndices.push(i);
            }
        } else {
            // Distribute 8 preview images evenly across the volume
            for (let i = 0; i < 8; i++) {
                // Calculate evenly distributed indices
                const index = Math.floor(
                    (i * (totalPages - 1)) / 7
                );
                previewIndices.push(index);
            }
        }

        // Get preview image paths
        return await Promise.all(
            previewIndices.map(async (index) => {
                const pageData = pages[index];
                const imageName =
                    pageData.img_path ||
                    `page_${index + 1}.jpg`;
                return await createContentImagePath(
                    contentId,
                    volumeName,
                    imageName,
                    directoryPath
                );
            })
        );
    } catch (error) {
        console.error(
            `Error extracting preview images for ${contentId}/${volumeName}:`,
            error
        );
        return [];
    }
}

/**
 * Extract volume number from volume name or file path
 */
function extractVolumeNumber(
    volumeNameOrPath: string
): number | null {
    // Try to extract volume number from filename
    const filename = path.basename(
        volumeNameOrPath,
        path.extname(volumeNameOrPath)
    );
    const matches = filename.match(
        /vol(?:ume)?[-_\s]?(\d+)|v(\d+)|(\d+)/i
    );

    if (matches) {
        // Return the first non-undefined match
        for (let i = 1; i < matches.length; i++) {
            if (matches[i] !== undefined) {
                return parseInt(matches[i], 10);
            }
        }
    }

    return null;
}

/**
 * Create a path to a content image
 * Returns a URL to the API endpoint for streaming the image
 */
async function createContentImagePath(
    contentId: string,
    volumeName: string,
    imageName: string,
    directoryPath: string
): Promise<string> {
    try {
        // Dynamically import server-only functions
        const { joinPath } = await import(
            "@/lib/server/fs-adapter"
        );

        // Get the absolute path to the image
        const absolutePath = await joinPath(
            directoryPath,
            volumeName,
            imageName
        );

        // Return URL to API endpoint with absolutePath parameter
        // Make sure to double-encode backslashes for Windows paths
        const encodedPath = encodeURIComponent(
            absolutePath
        ).replace(/%5C/g, "%5C%5C");

        return `/api/media?absolutePath=${encodedPath}`;
    } catch (error) {
        throw error;
    }
}

/**
 * Create a URL for accessing EPUB images through your existing media API
 */
function createEpubImageUrl(absolutePath: string): string {
    // Use your existing media API endpoint with proper URL encoding
    return `/api/media?absolutePath=${encodeURIComponent(
        absolutePath
    )}`;
}
