"use server";

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import path from "path";
import { extractEpubMetadata } from "@/lib/epub/epub-extractor";
import { revalidatePath } from "next/cache";

/**
 * Import an EPUB file - extract metadata and store DB records
 */
export async function importEpubFile(
  filePath: string,
  providedMangaId: string | null = null
) {
  const now = new Date();

  try {
    const { getFileStats, fileExists } = await import(
      "@/lib/server/fs-adapter"
    );

    if (!(await fileExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const stats = await getFileStats(filePath);
    const directoryPath = path.dirname(filePath);
    const seriesName = path.basename(directoryPath);
    const mangaId = providedMangaId || nanoid();
    const volumeNumber = extractVolumeNumber(filePath);

    // Create metadata directory: /data/ln/SeriesName/.metadata/
    const metadataDir = path.join(directoryPath, ".metadata");

    // Check if already imported and up to date
    const existingVolume = await prisma.epubVolume.findFirst({
      where: { mangaId, volumeNumber: volumeNumber || 1 },
    });

    if (existingVolume && existingVolume.lastModified >= stats.mtime) {
      console.log(`Volume ${volumeNumber || 1} is up to date, skipping`);
      return await prisma.manga.findUnique({ where: { id: mangaId } });
    }

    // Extract EPUB metadata
    const extractResult = await extractEpubMetadata(filePath, metadataDir);

    // Create or update manga record
    const manga = await prisma.manga.upsert({
      where: { id: mangaId },
      update: {
        lastModified: stats.mtime,
        lastScanned: now,
        scanStatus: "complete",
        contentType: "lightnovel",
        ...(extractResult.coverImagePath && {
          coverImage: createEpubImageUrl(extractResult.coverImagePath),
        }),
      },
      create: {
        id: mangaId,
        title: seriesName,
        addedDate: stats.birthtime || stats.mtime,
        lastModified: stats.mtime,
        directoryPath,
        lastScanned: now,
        scanStatus: "complete",
        contentType: "lightnovel",
        coverImage: extractResult.coverImagePath
          ? createEpubImageUrl(extractResult.coverImagePath)
          : undefined,
      },
    });

    // Create user metadata if needed
    await createDefaultUserMetadata(mangaId, extractResult.metadata);

    // Delete existing volume if updating
    if (existingVolume) {
      await prisma.epubVolume.delete({ where: { id: existingVolume.id } });
    }

    // Create EPUB volume record with minimal data
    await prisma.epubVolume.create({
      data: {
        id: nanoid(),
        mangaId,
        volumeNumber: volumeNumber || 1,
        volumeTitle: extractResult.metadata.title,
        filePath,
        coverImage: extractResult.coverImagePath
          ? createEpubImageUrl(extractResult.coverImagePath)
          : undefined,
        addedDate: stats.birthtime || stats.mtime,
        lastModified: stats.mtime,
        metadata: JSON.stringify(extractResult.metadata),
      },
    });

    // Update manga volume count
    const totalVolumes = await prisma.epubVolume.count({ where: { mangaId } });
    await prisma.manga.update({
      where: { id: mangaId },
      data: { volumes: totalVolumes },
    });

    revalidatePath(`/manga/${mangaId}`);
    return manga;
  } catch (error) {
    console.error(`Error importing EPUB file ${filePath}:`, error);
    return null;
  }
}

/**
 * Create a URL for accessing EPUB images through your existing media API
 */
function createEpubImageUrl(absolutePath: string): string {
  // Use your existing media API endpoint with proper URL encoding
  return `/api/media?absolutePath=${encodeURIComponent(absolutePath)}`;
}

/**
 * Get a direct URL to the EPUB file for client-side rendering
 */
export async function getEpubFileUrl(
  mangaId: string,
  volumeNumber: number = 1
): Promise<string | null> {
  try {
    const volume = await prisma.epubVolume.findFirst({
      where: { mangaId, volumeNumber },
      select: { id: true },
    });

    if (!volume) return null;

    // Return URL to API endpoint for serving the EPUB file
    return `/api/epub?mangaId=${mangaId}&volumeNumber=${volumeNumber}`;
  } catch (error) {
    console.error("Error creating EPUB file URL:", error);
    return null;
  }
}

/**
 * Extract volume number from filename
 */
function extractVolumeNumber(filePath: string): number | null {
  // Try to extract volume number from filename
  const filename = path.basename(filePath, path.extname(filePath));
  const matches = filename.match(/vol(?:ume)?[-_\s]?(\d+)|v(\d+)|(\d+)/i);

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
 * Create default user metadata for EPUB
 */
async function createDefaultUserMetadata(
  mangaId: string,
  metadata: { title: string; creator?: string; publisher?: string }
): Promise<void> {
  try {
    // Check if user metadata already exists
    const existingMetadata = await prisma.userMangaMetadata.findUnique({
      where: { mangaId },
    });

    // Only create if it doesn't exist
    if (!existingMetadata) {
      const now = new Date();

      await prisma.userMangaMetadata.create({
        data: {
          id: nanoid(),
          mangaId,
          favorite: false,
          status: "plan-to-read",
          author: metadata.creator || null,
          publisher: metadata.publisher || null,
          updatedAt: now,
        },
      });
    }
  } catch (error) {
    console.error(`Error creating metadata for ${mangaId}:`, error);
  }
}

/**
 * Scan a light novel directory and import all EPUBs
 * This function will scan all subdirectories in the LN directory
 * Each subdirectory is considered a separate series
 */
export async function scanLightNovelDirectory(baseDir: string) {
  try {
    // Construct the path to the LN directory
    const lnDir = path.join(baseDir, "ln");

    // Import server-only functions
    const { readDirectoryWithFileTypes, directoryExists } = await import(
      "@/lib/server/fs-adapter"
    );

    // Check if the directory exists
    if (!(await directoryExists(lnDir))) {
      return {
        success: false,
        error: `Light novel directory not found: ${lnDir}`,
        importedCount: 0,
        failedCount: 0,
        importedItems: [],
        failedItems: [],
      };
    }

    // Get all subdirectories (each is a series)
    const entries = await readDirectoryWithFileTypes(lnDir);
    const seriesDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(lnDir, entry.name),
      }));

    if (seriesDirs.length === 0) {
      return {
        success: false,
        error: "No light novel series directories found",
        importedCount: 0,
        failedCount: 0,
        importedItems: [],
        failedItems: [],
      };
    }

    // Process each series directory
    const successfulImports = [];
    const failedImports = [];

    for (const seriesDir of seriesDirs) {
      try {
        // Get all EPUB files in this series directory
        const seriesEntries = await readDirectoryWithFileTypes(seriesDir.path);
        const epubFiles = seriesEntries
          .filter(
            (entry) =>
              !entry.isDirectory() && entry.name.toLowerCase().endsWith(".epub")
          )
          .map((entry) => path.join(seriesDir.path, entry.name));

        if (epubFiles.length === 0) {
          failedImports.push({
            name: seriesDir.name,
            error: "No EPUB files found in directory",
          });
          continue;
        }

        // Create or get ln ID for this series
        const existingLn = await prisma.manga.findFirst({
          where: { directoryPath: seriesDir.path },
          select: { id: true },
        });

        const mangaId = existingLn?.id || nanoid();

        // Import each EPUB file
        let successCount = 0;
        for (const epubFile of epubFiles) {
          const result = await importEpubFile(epubFile, mangaId);
          if (result) successCount++;
        }

        if (successCount > 0) {
          successfulImports.push({
            name: seriesDir.name,
            id: mangaId,
            volumes: successCount,
          });
        } else {
          failedImports.push({
            name: seriesDir.name,
            error: "Failed to import any volumes",
          });
        }
      } catch (error) {
        failedImports.push({
          name: seriesDir.name,
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
