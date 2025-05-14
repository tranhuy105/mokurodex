"use server";

import { MangaService } from "@/lib/services/MangaService";
import { MangaMetadata, Volume, MangaPage } from "@/types/manga";
import { createMangaImageUrl } from "@/lib/path-utils";

/**
 * Server action to get all manga
 */
export async function getAllManga(): Promise<MangaMetadata[]> {
  try {
    return await MangaService.getAllManga();
  } catch (error) {
    console.error("Error in getAllManga server action:", error);
    return [];
  }
}

/**
 * Server action to get volumes for a specific manga
 */
export async function getMangaVolumes(mangaId: string): Promise<Volume[]> {
  try {
    return await MangaService.getMangaVolumes(mangaId);
  } catch (error) {
    console.error(
      `Error in getMangaVolumes server action for ${mangaId}:`,
      error
    );
    return [];
  }
}

/**
 * Server action to get pages for a specific volume
 * This method is safe to call from both client and server since getVolumePages
 * itself doesn't use any server-only APIs
 */
export async function getVolumePages(
  manga: string,
  volume: Volume
): Promise<MangaPage[]> {
  try {
    return MangaService.getVolumePages(manga, volume);
  } catch (error) {
    console.error(`Error in getVolumePages server action for ${manga}:`, error);
    return [];
  }
}

/**
 * Server action to search manga by title
 */
export async function searchManga(query: string): Promise<MangaMetadata[]> {
  try {
    // Get all manga first
    const allManga = await MangaService.getAllManga();

    // If query is empty, return all manga
    if (!query || query.trim() === "") {
      return allManga;
    }

    // Normalize search query and break it into words for more flexible matching
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerms = normalizedQuery
      .split(/\s+/)
      .filter((term) => term.length > 0);

    // Score function - higher score = better match
    const scoreMatch = (manga: MangaMetadata): number => {
      let score = 0;
      const title = manga.title.toLowerCase();

      // Exact title match (highest priority)
      if (title === normalizedQuery) {
        score += 100;
      }

      // Title starts with query
      if (title.startsWith(normalizedQuery)) {
        score += 50;
      }

      // Title contains the full query
      if (title.includes(normalizedQuery)) {
        score += 30;
      }

      // Check for individual terms in the title
      for (const term of searchTerms) {
        if (title.includes(term)) {
          score += 10;
        }
      }

      // Manga with more volumes might be more important
      score += Math.min(manga.volumes, 10) / 2;

      return score;
    };

    // Filter and score manga
    return allManga
      .map((manga) => ({ manga, score: scoreMatch(manga) }))
      .filter((item) => item.score > 0) // Only include matches
      .sort((a, b) => b.score - a.score) // Sort by score (descending)
      .map((item) => item.manga);
  } catch (error) {
    console.error(
      `Error in searchManga server action for query "${query}":`,
      error
    );
    return [];
  }
}

/**
 * Server action to get preview pages for a volume
 * Returns first page, three middle pages, and last page
 */
export async function getVolumePreviewPages(
  manga: string,
  volume: Volume
): Promise<MangaPage[]> {
  try {
    // First try to get pre-generated preview images from the database
    try {
      const { getRepository } = await import(
        "@/lib/database/MangaRepositoryFactory"
      );
      const repository = await getRepository();
      const volumes = await repository.getVolumesByMangaId(manga);

      // Find the matching volume by volumeUuid
      const dbVolume = volumes.find(
        (v) => v.volumeUuid === volume.mokuroData.volume_uuid
      );

      if (
        dbVolume &&
        dbVolume.previewImages &&
        dbVolume.previewImages.length > 0
      ) {
        // Return preview pages based on the stored preview images
        return dbVolume.previewImages.map((imagePath, index) => {
          return {
            image: imagePath,
            blocks: [],
            img_width: 800, // Default width
            img_height: 1200, // Default height
            img_path: imagePath,
            page_index: index,
          };
        });
      }
    } catch (dbError) {
      console.warn(
        "Failed to get preview images from database, falling back to dynamic generation",
        dbError
      );
    }

    // Fallback to dynamically generating preview pages
    const totalPages = volume.mokuroData.pages.length;

    if (totalPages === 0) {
      return [];
    }

    // Calculate indices for preview pages
    const previewIndices: number[] = [];

    // First page
    previewIndices.push(0);

    // Middle pages (only if we have enough pages)
    if (totalPages > 4) {
      const middleIndex = Math.floor(totalPages / 2);
      previewIndices.push(middleIndex - 1);
      previewIndices.push(middleIndex);
      previewIndices.push(middleIndex + 1);
    } else if (totalPages > 2) {
      // For volumes with few pages, just grab what we can
      for (let i = 1; i < totalPages - 1; i++) {
        previewIndices.push(i);
      }
    }

    // Last page (if different from first page)
    if (totalPages > 1) {
      previewIndices.push(totalPages - 1);
    }

    // Get only the specific pages we need
    const previewPages = previewIndices.map((index) => {
      const pageData = volume.mokuroData.pages[index];
      const imageName = pageData.img_path || `page_${index + 1}.jpg`;

      return {
        image: createMangaImageUrl(manga, volume.mokuroData.volume, imageName),
        blocks: pageData.blocks || [],
        img_width: pageData.img_width || 800,
        img_height: pageData.img_height || 1200,
        img_path: imageName,
        page_index: index, // Store the page index for proper linking
      };
    });

    return previewPages;
  } catch (error) {
    console.error(`Error in getVolumePreviewPages for ${manga}:`, error);
    return [];
  }
}
