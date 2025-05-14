import { MangaMetadata, Volume, MangaPage } from "@/types/manga";
import {
  fetchDatabaseManga,
  fetchDatabaseMangaById,
  fetchDatabaseVolumes,
} from "@/actions/manga-import-api";
import { searchManga } from "@/actions/manga-actions";
import { createMangaImageUrl } from "@/lib/path-utils";

/**
 * Client-safe API for manga operations
 * These functions can be safely imported and used in both client and server components
 */

/**
 * Get all available manga from the database
 */
export async function fetchAllManga(): Promise<MangaMetadata[]> {
  const mangaEntities = await fetchDatabaseManga();

  // Convert MangaEntity to MangaMetadata
  return mangaEntities.map((entity) => ({
    id: entity.id,
    title: entity.title,
    volumes: entity.volumes,
    coverImage: entity.coverImage,
    addedDate: entity.addedDate,
    lastModified: entity.lastModified,
  }));
}

/**
 * Get volumes for a specific manga
 */
export async function fetchMangaVolumes(mangaId: string): Promise<Volume[]> {
  // Get manga entity to verify it exists
  const manga = await fetchDatabaseMangaById(mangaId);
  if (!manga) {
    return [];
  }

  // Get volumes from database
  const volumeEntities = await fetchDatabaseVolumes(mangaId);

  // Convert VolumeEntity to Volume
  return volumeEntities.map((entity) => {
    // Create basic Volume object structure
    return {
      mokuroData: {
        version: "1.0", // Default version
        volume: entity.volumeTitle,
        volume_uuid: entity.volumeUuid,
        title: manga.title,
        title_uuid: mangaId, // Use manga ID as title UUID
        pages: [], // We'll populate this when needed
      },
      coverImage: entity.coverImage,
      metadata: {
        releaseDate: entity.addedDate,
        lastModified: entity.lastModified,
        publisher: "From Database",
        pageCount: entity.pageCount,
      },
      // Add previewImages from entity
      previewImages: entity.previewImages,
    };
  });
}

/**
 * Get detailed volume data including pages - this will require loading the original file
 */
export async function fetchVolumeData(
  mangaId: string,
  volumeUuid: string
): Promise<Volume | null> {
  try {
    // This would require loading the actual mokuro file from disk
    // For now, we're just getting the basic volume info
    const volumes = await fetchMangaVolumes(mangaId);
    return volumes.find((v) => v.mokuroData.volume_uuid === volumeUuid) || null;
  } catch (error) {
    console.error(
      `Error fetching volume data for ${mangaId}/${volumeUuid}:`,
      error
    );
    return null;
  }
}

/**
 * Get pages for a specific volume - uses the real file system
 * This still needs access to the real files since we don't store page data in the database
 */
export async function fetchVolumePages(
  mangaId: string,
  volume: Volume
): Promise<MangaPage[]> {
  try {
    // If pages array is empty, we need to load the .mokuro file from disk
    if (volume.mokuroData.pages.length === 0) {
      // Dynamically import server-only functions
      const { readFile, joinPath } = await import("@/lib/server/fs-adapter");
      const { config } = await import("@/config");

      try {
        // Find the original .mokuro file based on volume title
        const mangaPath = await joinPath(config.mangaDir, mangaId);

        // Try to find the exact mokuro file that matches this volume
        const mokuroFilePath = await joinPath(
          mangaPath,
          `${volume.mokuroData.volume}.mokuro`
        );

        // Read the .mokuro file to get the pages data
        const mokuroContent = await readFile(mokuroFilePath);
        const mokuroData = JSON.parse(mokuroContent);

        // Update the volume with the pages data
        if (mokuroData.pages && mokuroData.pages.length > 0) {
          volume.mokuroData.pages = mokuroData.pages;

          // Update metadata pageCount
          if (volume.metadata) {
            volume.metadata.pageCount = mokuroData.pages.length;
          }
        } else {
          console.error(
            `No pages found in .mokuro file for ${mangaId}/${volume.mokuroData.volume}`
          );
          return [];
        }
      } catch (error) {
        console.error(
          `Error loading .mokuro file for ${mangaId}/${volume.mokuroData.volume}:`,
          error
        );
        return [];
      }
    }

    // Now we should have the pages data, so we can proceed
    return volume.mokuroData.pages.map((pageData, index) => {
      const imageName = pageData.img_path || `page_${index + 1}.jpg`;

      return {
        image: createMangaImageUrl(
          mangaId,
          volume.mokuroData.volume,
          imageName
        ),
        blocks: pageData.blocks || [],
        img_width: pageData.img_width || 800,
        img_height: pageData.img_height || 1200,
        img_path: `${mangaId}/${volume.mokuroData.volume}/${imageName}`,
        page_index: index, // Store the page index for proper linking
      };
    });
  } catch (error) {
    console.error(`Error fetching volume pages for ${mangaId}:`, error);
    return [];
  }
}

/**
 * Get preview pages for a volume (first, a few from the middle, and last)
 * This is used for the volume card to show page thumbnails
 */
export async function fetchVolumePreviewPages(
  mangaId: string,
  volume: Volume
): Promise<MangaPage[]> {
  try {
    // First ensure all pages are loaded
    await ensureVolumeHasPages(mangaId, volume);

    const totalPages = volume.mokuroData.pages.length;
    if (totalPages === 0) {
      return [];
    }

    // Calculate indices for preview pages (max 5 pages)
    const previewIndices: number[] = [];

    // Add first page
    previewIndices.push(0);

    // Add middle pages if we have enough
    if (totalPages > 4) {
      const middleIndex = Math.floor(totalPages / 2);
      previewIndices.push(middleIndex);

      // Add one before and one after the middle if possible
      if (totalPages > 6) {
        previewIndices.push(middleIndex - 2);
        previewIndices.push(middleIndex + 2);
      }
    } else if (totalPages > 2) {
      // For volumes with few pages, grab what we can
      for (let i = 1; i < Math.min(totalPages - 1, 4); i++) {
        previewIndices.push(i);
      }
    }

    // Add last page if different from first page
    if (totalPages > 1) {
      previewIndices.push(totalPages - 1);
    }

    // Sort indices so they're in page order
    previewIndices.sort((a, b) => a - b);

    // Take at most 5 indices
    const limitedIndices = previewIndices.slice(0, 5);

    // Generate the preview pages
    return limitedIndices.map((index) => {
      const pageData = volume.mokuroData.pages[index];
      const imageName = pageData.img_path || `page_${index + 1}.jpg`;

      return {
        image: createMangaImageUrl(
          mangaId,
          volume.mokuroData.volume,
          imageName
        ),
        blocks: pageData.blocks || [],
        img_width: pageData.img_width || 800,
        img_height: pageData.img_height || 1200,
        img_path: `${mangaId}/${volume.mokuroData.volume}/${imageName}`,
        page_index: index, // Store the page index for proper linking
      };
    });
  } catch (error) {
    console.error(`Error creating preview pages for ${mangaId}:`, error);
    return [];
  }
}

/**
 * Helper function to ensure a volume has its pages loaded
 */
async function ensureVolumeHasPages(
  mangaId: string,
  volume: Volume
): Promise<void> {
  // Only do the work if pages aren't already loaded
  if (volume.mokuroData.pages.length === 0) {
    const { readFile, joinPath } = await import("@/lib/server/fs-adapter");
    const { config } = await import("@/config");

    try {
      // Find the original .mokuro file
      const mangaPath = await joinPath(config.mangaDir, mangaId);
      const mokuroFilePath = await joinPath(
        mangaPath,
        `${volume.mokuroData.volume}.mokuro`
      );

      // Read the .mokuro file
      const mokuroContent = await readFile(mokuroFilePath);
      const mokuroData = JSON.parse(mokuroContent);

      // Update the volume object
      if (mokuroData.pages && mokuroData.pages.length > 0) {
        volume.mokuroData.pages = mokuroData.pages;

        // Update metadata pageCount
        if (volume.metadata) {
          volume.metadata.pageCount = mokuroData.pages.length;
        }
      }
    } catch (error) {
      console.error(
        `Error loading pages for ${mangaId}/${volume.mokuroData.volume}:`,
        error
      );
    }
  }
}

/**
 * Search manga by title
 */
export async function searchMangaByTitle(
  query: string
): Promise<MangaMetadata[]> {
  return searchManga(query);
}
