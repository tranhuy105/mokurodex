"use server";

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { config } from "@/config";
import { revalidatePath } from "next/cache";

/**
 * Core function to import manga from a directory path
 * This is used by both importMangaDirectory and importCustomDirectory
 */
async function importMangaFromDirectory(
  directoryPath: string,
  providedMangaId: string | null = null,
  isCustomPath: boolean = false
) {
  const now = new Date();

  try {
    // Dynamically import server-only functions
    const { readDirectory, readFile, joinPath, getFileStats } = await import(
      "@/lib/server/fs-adapter"
    );

    // Look for .mokuro files in the manga directory
    const files = await readDirectory(directoryPath);
    const mokuroFiles = files.filter((file: string) =>
      file.endsWith(".mokuro")
    );

    if (mokuroFiles.length === 0) {
      throw new Error(`No .mokuro files found in ${directoryPath}`);
    }

    // Get stats for the directory
    const stats = await getFileStats(directoryPath);
    const addedDate = stats.birthtime || stats.mtime;
    const lastModified = stats.mtime;

    // Read the first .mokuro file to get manga info
    const firstMokuroFile = await joinPath(directoryPath, mokuroFiles[0]);
    const firstMokuroContent = await readFile(firstMokuroFile);
    const firstMokuroData = JSON.parse(firstMokuroContent);

    // Check if manga already exists with this directory path
    const existingManga = await prisma.manga.findFirst({
      where: { directoryPath: directoryPath },
      include: {
        mangaVolumes: true,
      },
    });

    // Generate a manga ID - use existing ID if found, provided ID if given, or generate new one
    const mangaId = existingManga?.id || providedMangaId || nanoid();

    // Get the cover image from the first page of the first volume
    let coverImage = null;
    if (firstMokuroData.pages && firstMokuroData.pages.length > 0) {
      const firstPage = firstMokuroData.pages[0];
      const imageName = firstPage.img_path || "page_1.jpg";
      coverImage = await createMangaImagePath(
        mangaId,
        firstMokuroData.volume,
        imageName,
        directoryPath
      );
    }

    // Create or update the manga entity using Prisma
    const manga = await prisma.manga.upsert({
      where: { id: mangaId },
      update: {
        title: firstMokuroData.title || mangaId,
        volumes: mokuroFiles.length,
        coverImage: coverImage,
        lastModified: lastModified,
        directoryPath: directoryPath,
        lastScanned: now,
        scanStatus: "complete",
      },
      create: {
        id: mangaId,
        title: firstMokuroData.title || mangaId,
        volumes: mokuroFiles.length,
        coverImage: coverImage,
        addedDate: addedDate,
        lastModified: lastModified,
        directoryPath: directoryPath,
        lastScanned: now,
        scanStatus: "complete",
      },
    });

    // Create default user metadata if it doesn't exist
    await createDefaultUserMetadata(mangaId);

    // Get existing volumes to avoid reimporting
    const existingVolumes = existingManga?.mangaVolumes || [];
    const existingVolumeFilePaths = new Set(
      existingVolumes.map((vol) => vol.filePath)
    );

    // Process and import each volume
    for (const mokuroFile of mokuroFiles) {
      const mokuroPath = await joinPath(directoryPath, mokuroFile);

      // Skip this volume if it already exists
      if (existingVolumeFilePaths.has(mokuroPath)) {
        console.log(`Skipping existing volume: ${mokuroPath}`);
        continue;
      }

      const mokuroContent = await readFile(mokuroPath);
      const mokuroData = JSON.parse(mokuroContent);

      // Get file stats
      const volumeStats = await getFileStats(mokuroPath);
      const volumeAddedDate = volumeStats.birthtime || volumeStats.mtime;
      const volumeLastModified = volumeStats.mtime;

      // Get cover image
      let volumeCoverImage = null;
      if (mokuroData.pages && mokuroData.pages.length > 0) {
        const firstPage = mokuroData.pages[0];
        const imageName = firstPage.img_path || "page_1.jpg";
        volumeCoverImage = await createMangaImagePath(
          mangaId,
          mokuroData.volume,
          imageName,
          directoryPath
        );
      }

      // Extract preview images
      const previewImages = await extractPreviewImages(
        mangaId,
        mokuroData,
        mokuroData.volume,
        directoryPath
      );

      // Extract volume number from volume name or use index
      const volumeNumber =
        extractVolumeNumber(mokuroData.volume) ||
        mokuroFiles.indexOf(mokuroFile) + 1;

      // Create the volume
      const volume = await prisma.volume.create({
        data: {
          id: mokuroData.volume_uuid || nanoid(),
          mangaId: mangaId,
          volumeNumber: volumeNumber,
          volumeTitle: mokuroData.volume || `Volume ${volumeNumber}`,
          filePath: mokuroPath,
          coverImage: volumeCoverImage,
          pageCount: mokuroData.pages?.length || 0,
          addedDate: volumeAddedDate,
          lastModified: volumeLastModified,
          volumeUuid: mokuroData.volume_uuid || nanoid(),
          previewImages:
            previewImages.length > 0 ? JSON.stringify(previewImages) : null,
        },
      });

      // Import pages and text blocks
      await importPagesAndTextBlocks(volume.id, mangaId, mokuroData);
    }

    revalidatePath(`/manga/${mangaId}`);
    return manga;
  } catch (error) {
    console.error(`Error importing manga directory ${directoryPath}:`, error);

    // If this is not a custom path, update the manga entity with error status
    if (!isCustomPath) {
      try {
        await prisma.manga.update({
          where: { id: providedMangaId || nanoid() },
          data: {
            scanStatus: "error",
            errorMessage:
              error instanceof Error ? error.message : String(error),
            lastScanned: now,
          },
        });
      } catch (updateError) {
        console.error("Error updating manga with error status:", updateError);
      }
    }

    return null;
  }
}

/**
 * Import a specific manga directory into the database
 */
export async function importMangaDirectory(directoryPath: string) {
  try {
    // Dynamically import server-only functions
    const { isDirectory, joinPath } = await import("@/lib/server/fs-adapter");

    // Check if the directory exists
    const mangaPath = await joinPath(config.mangaDir, directoryPath);
    const isDir = await isDirectory(mangaPath);

    if (!isDir) {
      throw new Error(`Directory does not exist: ${mangaPath}`);
    }

    // Use the shared import function with null mangaId to generate a new one
    return await importMangaFromDirectory(mangaPath, null);
  } catch (error) {
    console.error(`Error in importMangaDirectory: ${error}`);
    return null;
  }
}

/**
 * Import pages and text blocks for a volume
 */
async function importPagesAndTextBlocks(
  volumeId: string,
  mangaId: string,
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
    if (!mokuroData.pages || mokuroData.pages.length === 0) {
      return;
    }

    // Get manga directory path from database
    const manga = await prisma.manga.findUnique({
      where: { id: mangaId },
      select: { directoryPath: true },
    });

    if (!manga || !manga.directoryPath) {
      throw new Error(`Manga ${mangaId} not found or has no directory path`);
    }

    // Delete existing pages for this volume to avoid duplicates
    await prisma.page.deleteMany({
      where: { volumeId },
    });

    // Get volume info to determine the volume directory
    const volume = await prisma.volume.findUnique({
      where: { id: volumeId },
      select: { filePath: true },
    });

    if (!volume || !volume.filePath) {
      throw new Error(`Volume ${volumeId} not found or has no file path`);
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
    for (let pageIndex = 0; pageIndex < mokuroData.pages.length; pageIndex++) {
      const page = mokuroData.pages[pageIndex];
      const pageNumber = pageIndex + 1;
      const imageName = page.img_path || `page_${pageNumber}.jpg`;

      // Create API path with absolute path
      const apiImagePath = await createMangaImagePath(
        mangaId,
        mokuroData.volume,
        imageName,
        manga.directoryPath
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
            boxWidth: block.box[2] - block.box[0],
            boxHeight: block.box[3] - block.box[1],
            text: JSON.stringify(block.lines),
            fontSize: block.font_size || 12,
            isVertical: block.vertical || false,
            linesCoords: block.lines_coords
              ? JSON.stringify(block.lines_coords)
              : null,
          });
        });
      }
    }

    // Bulk insert all pages at once
    if (pageBatch.length > 0) {
      await prisma.page.createMany({
        data: pageBatch,
      });
    }

    // Bulk insert all text blocks at once
    if (textBlocksBatch.length > 0) {
      await prisma.textBlock.createMany({
        data: textBlocksBatch,
      });
    }
  } catch (error) {
    console.error(`Error importing pages for volume ${volumeId}:`, error);
    throw error;
  }
}

/**
 * Create default user metadata for a newly imported manga
 */
async function createDefaultUserMetadata(mangaId: string) {
  try {
    // Check if user metadata already exists for this manga
    const existingMetadata = await prisma.userMangaMetadata.findUnique({
      where: { mangaId },
    });

    // Only create if it doesn't exist
    if (!existingMetadata) {
      const now = new Date();

      // Create basic metadata with default values
      await prisma.userMangaMetadata.create({
        data: {
          id: nanoid(),
          mangaId,
          favorite: false,
          status: "plan-to-read",
          progress: 0,
          updatedAt: now,
        },
      });

      console.log(`Created default user metadata for manga ${mangaId}`);
    }
  } catch (error) {
    console.error(
      `Error creating default user metadata for manga ${mangaId}:`,
      error
    );
  }
}

/**
 * Extract and save preview images for a volume during import
 */
async function extractPreviewImages(
  mangaId: string,
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
        const index = Math.floor((i * (totalPages - 1)) / 7);
        previewIndices.push(index);
      }
    }

    // Get preview image paths
    return await Promise.all(
      previewIndices.map(async (index) => {
        const pageData = pages[index];
        const imageName = pageData.img_path || `page_${index + 1}.jpg`;
        return await createMangaImagePath(
          mangaId,
          volumeName,
          imageName,
          directoryPath
        );
      })
    );
  } catch (error) {
    console.error(
      `Error extracting preview images for ${mangaId}/${volumeName}:`,
      error
    );
    return [];
  }
}

/**
 * Extract volume number from volume name
 */
function extractVolumeNumber(volumeName: string): number | null {
  const match = volumeName.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Create a path to a manga image
 * Returns a URL to the API endpoint for streaming the image
 */
async function createMangaImagePath(
  mangaId: string,
  volumeName: string,
  imageName: string,
  directoryPath: string
): Promise<string> {
  try {
    // Dynamically import server-only functions
    const { joinPath } = await import("@/lib/server/fs-adapter");

    // Get the absolute path to the image
    const absolutePath = await joinPath(directoryPath, volumeName, imageName);

    // Return URL to API endpoint with absolutePath parameter
    // Make sure to double-encode backslashes for Windows paths
    const encodedPath = encodeURIComponent(absolutePath).replace(
      /%5C/g,
      "%5C%5C"
    );

    return `/api/media?absolutePath=${encodedPath}`;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all manga from the database
 */
export async function getAllManga() {
  try {
    return await prisma.manga.findMany({
      orderBy: { lastModified: "desc" },
      include: {
        userData: true,
      },
    });
  } catch (error) {
    console.error("Error getting all manga:", error);
    return [];
  }
}

/**
 * Get a single manga by ID with its volumes
 */
export async function getMangaWithVolumes(id: string) {
  try {
    const manga = await prisma.manga.findUnique({
      where: { id },
      include: {
        mangaVolumes: {
          orderBy: { volumeNumber: "asc" },
        },
        userData: true,
      },
    });

    return manga;
  } catch (error) {
    console.error(`Error getting manga ${id} with volumes:`, error);
    return null;
  }
}

/**
 * Get pages for a specific volume
 */
export async function getVolumePages(volumeId: string) {
  try {
    return await prisma.page.findMany({
      where: { volumeId },
      orderBy: { pageNumber: "asc" },
      include: {
        textBlocks: true,
      },
    });
  } catch (error) {
    console.error(`Error getting pages for volume ${volumeId}:`, error);
    return [];
  }
}

/**
 * Delete a manga and all related data
 */
export async function deleteManga(id: string) {
  try {
    // Prisma will cascade delete all related data
    await prisma.manga.delete({
      where: { id },
    });

    revalidatePath("/manga");
    return true;
  } catch (error) {
    console.error(`Error deleting manga ${id}:`, error);
    return false;
  }
}

/**
 * Clear all manga data
 */
export async function clearAndRescanAllManga() {
  try {
    // Delete all manga (cascades to all related data)
    await prisma.manga.deleteMany();

    // Return empty array since we're not rescanning
    return [];
  } catch (error) {
    console.error("Error clearing manga data:", error);
    return [];
  }
}

/**
 * Import manga from a custom directory path
 * This allows importing from any accessible directory, not just from config.mangaDir
 */
export async function importCustomDirectory(customPath: string) {
  try {
    // Dynamically import server-only functions
    const { directoryExists } = await import("@/lib/server/fs-adapter");

    // Normalize the path to handle both forward and backslashes
    const normalizedPath = customPath.replace(/\\/g, "/");

    // Ensure the path is absolute for Windows
    if (process.platform === "win32") {
      // Check if it has a drive letter (e.g., C:)
      if (!normalizedPath.match(/^[a-zA-Z]:/)) {
        throw new Error(
          `Please provide a complete path with drive letter (e.g., C:\\Manga\\MyManga)`
        );
      }
    } else {
      // For Unix-like systems, check if it starts with /
      if (!normalizedPath.startsWith("/")) {
        throw new Error(
          `Please provide an absolute path (e.g., /home/user/manga)`
        );
      }
    }

    // Check if the directory exists and is accessible
    const dirExists = await directoryExists(normalizedPath);
    if (!dirExists) {
      throw new Error(
        `Directory does not exist or is not accessible: ${normalizedPath}`
      );
    }

    // Use the shared import function with null mangaId to generate a new one
    return await importMangaFromDirectory(normalizedPath, null, true);
  } catch (error) {
    console.error(`Error in importCustomDirectory: ${error}`);
    return null;
  }
}

/**
 * Scan all subdirectories in a data directory (manga or ln)
 * This function handles scanning all subdirectories and importing them
 *
 * @param dataDir The base data directory
 * @param type The type of content to scan ('manga' or 'ln')
 * @returns Results of the scan operation
 */
export async function scanDataSubdirectories(
  dataDir: string,
  type: "manga" | "ln"
) {
  try {
    // Construct the path to the manga or ln subdirectory
    const subDir = type === "manga" ? "manga" : "ln";
    const targetPath = `${dataDir}/${subDir}`;

    // Dynamically import server-only functions
    const { readDirectoryWithFileTypes, directoryExists } = await import(
      "@/lib/server/fs-adapter"
    );

    // Check if the directory exists
    const dirExists = await directoryExists(targetPath);
    if (!dirExists) {
      return {
        success: false,
        error: `Directory not found: ${targetPath}. Please create it first.`,
        importedCount: 0,
        failedCount: 0,
        importedItems: [],
        failedItems: [],
      };
    }

    // List subdirectories in the target path
    const entries = await readDirectoryWithFileTypes(targetPath);

    // Filter for directories only
    const subDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: `${targetPath}/${entry.name}`,
      }));

    if (subDirectories.length === 0) {
      return {
        success: false,
        error: `No subdirectories found in ${targetPath}`,
        importedCount: 0,
        failedCount: 0,
        importedItems: [],
        failedItems: [],
      };
    }

    // Process each subdirectory
    const successfulImports = [];
    const failedImports = [];

    for (const dir of subDirectories) {
      try {
        // Import this specific manga directory
        const result = await importCustomDirectory(dir.path);
        if (result) {
          successfulImports.push({
            name: dir.name,
            id: result.id,
          });
        } else {
          failedImports.push({
            name: dir.name,
            error: "Import failed",
          });
        }
      } catch (error) {
        console.error(`Error importing ${dir.path}:`, error);
        failedImports.push({
          name: dir.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: successfulImports.length > 0,
      importedCount: successfulImports.length,
      failedCount: failedImports.length,
      importedItems: successfulImports,
      failedItems: failedImports,
    };
  } catch (error) {
    console.error("Error scanning data subdirectories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      importedCount: 0,
      failedCount: 0,
      importedItems: [],
      failedItems: [],
    };
  }
}
