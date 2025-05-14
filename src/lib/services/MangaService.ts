import { MangaMetadata, Volume, MangaPage, MokuroPage } from "@/types/manga";
import { createMangaImageUrl } from "@/lib/path-utils";
import { config } from "@/config";

// Cache for manga data
let mangaCache: MangaMetadata[] | null = null;
const volumesCache: Record<string, Volume[]> = {};

// Check if we're running on the server
const isServer = typeof window === "undefined";

/**
 * Service for handling manga operations
 */
export class MangaService {
  /**
   * Get all available manga
   */
  public static async getAllManga(): Promise<MangaMetadata[]> {
    // Return from cache if available
    if (mangaCache) {
      return mangaCache;
    }

    // Only run on server
    if (!isServer) {
      console.error("getAllManga can only be called on the server");
      return [];
    }

    try {
      // Dynamically import server-only functions to prevent client-side inclusion
      const { readDirectory, isDirectory, readFile, joinPath, getFileStats } =
        await import("../server/fs-adapter");

      const mangaDirs = await readDirectory(config.mangaDir);
      const mangaList = await Promise.all(
        mangaDirs.map(async (mangaId: string) => {
          try {
            // Note: joinPath will handle decoding internally
            const mangaPath = await joinPath(config.mangaDir, mangaId);
            const isDir = await isDirectory(mangaPath);

            // Skip if not a directory
            if (!isDir) {
              return null;
            }

            // Look for .mokuro files directly in the manga directory
            const files = await readDirectory(mangaPath);
            const mokuroFiles = files.filter((file: string) =>
              file.endsWith(".mokuro")
            );

            if (mokuroFiles.length === 0) {
              console.warn(`No .mokuro files found in ${mangaPath}`);
              return null;
            }

            // Get stats for the directory to get the added date
            const stats = await getFileStats(mangaPath);
            const addedDate = stats.mtime; // Use modification time of the directory
            const lastModified = stats.mtime; // Use modification time for lastModified too

            // Read the first mokuro file to get manga info
            const firstMokuroFile = await joinPath(mangaPath, mokuroFiles[0]);
            const firstMokuroContent = await readFile(firstMokuroFile);
            const firstMokuroData = JSON.parse(firstMokuroContent);

            // Get the last mokuro file for the cover (usually the latest volume)
            const lastMokuroFile = await joinPath(
              mangaPath,
              mokuroFiles[mokuroFiles.length - 1]
            );
            let lastMokuroData = firstMokuroData;

            // If we have more than one volume, read the last file for cover
            if (mokuroFiles.length > 1 && lastMokuroFile !== firstMokuroFile) {
              try {
                const lastMokuroContent = await readFile(lastMokuroFile);
                lastMokuroData = JSON.parse(lastMokuroContent);
              } catch (error) {
                console.warn(
                  `Error reading last mokuro file for ${mangaId}:`,
                  error
                );
                // Fall back to the first mokuro data if there's an error
              }
            }

            // Get the first page image from the last volume for cover
            let coverImage = null;
            if (lastMokuroData.pages && lastMokuroData.pages.length > 0) {
              const firstPage = lastMokuroData.pages[0];
              const imageName = firstPage.img_path || "page_1.jpg";
              coverImage = createMangaImageUrl(
                mangaId,
                lastMokuroData.volume,
                imageName
              );
            }

            return {
              id: mangaId,
              title: firstMokuroData.title || mangaId,
              volumes: mokuroFiles.length,
              coverImage: coverImage,
              addedDate: addedDate.toISOString(),
              lastModified: lastModified.toISOString(),
            };
          } catch (error) {
            console.error(`Error processing manga ${mangaId}:`, error);
            return null;
          }
        })
      );

      // Filter out null entries and sort by lastModified date (newest first)
      const validMangaList = mangaList
        .filter((manga): manga is NonNullable<typeof manga> => manga !== null)
        .sort((a, b) => {
          // Sort by lastModified date (newest first)
          if (a.lastModified && b.lastModified) {
            return (
              new Date(b.lastModified).getTime() -
              new Date(a.lastModified).getTime()
            );
          }
          // Fallback to title sort if lastModified is not available
          return a.title.localeCompare(b.title);
        });

      // Store in cache
      mangaCache = validMangaList;
      return validMangaList;
    } catch (error) {
      console.error("Error loading manga list:", error);
      return [];
    }
  }

  /**
   * Get manga volumes by ID
   */
  public static async getMangaVolumes(mangaId: string): Promise<Volume[]> {
    // Return from cache if available
    if (volumesCache[mangaId]) {
      return volumesCache[mangaId];
    }

    // Only run on server
    if (!isServer) {
      console.error("getMangaVolumes can only be called on the server");
      return [];
    }

    try {
      // Dynamically import server-only functions to prevent client-side inclusion
      const { readDirectoryWithFileTypes, readFile, joinPath, getFileStats } =
        await import("../server/fs-adapter");

      // Note: joinPath will handle decoding internally
      const mangaPath = await joinPath(config.mangaDir, mangaId);
      const entries = await readDirectoryWithFileTypes(mangaPath);

      // Get all mokuro files in the root directory
      const mokuroFiles = entries
        .filter(
          (entry) => !entry.isDirectory() && entry.name.endsWith(".mokuro")
        )
        .map((entry) => entry.name);

      if (mokuroFiles.length === 0) {
        return [];
      }

      // Read all mokuro files to get volume info
      const volumes = await Promise.all(
        mokuroFiles.map(async (mokuroFile: string) => {
          const mokuroPath = await joinPath(mangaPath, mokuroFile);
          const mokuroContent = await readFile(mokuroPath);
          const mokuroData = JSON.parse(mokuroContent);

          // Get file stats for creation date
          const stats = await getFileStats(mokuroPath);
          const releaseDate = stats.birthtime || stats.mtime; // Use creation time or modification time as fallback
          const lastModified = stats.mtime;

          // Get the first page image for volume cover
          let coverImage = null;
          if (mokuroData.pages && mokuroData.pages.length > 0) {
            const firstPage = mokuroData.pages[0];
            const imageName = firstPage.img_path || "page_1.jpg";
            coverImage = createMangaImageUrl(
              mangaId,
              mokuroData.volume,
              imageName
            );
          }

          return {
            mokuroData,
            coverImage,
            metadata: {
              releaseDate: releaseDate.toISOString(),
              lastModified: lastModified.toISOString(),
              publisher: "Auto-detected", // Default value, could be overridden in the future
              pageCount: mokuroData.pages.length,
            },
          };
        })
      );

      // Store in cache
      volumesCache[mangaId] = volumes;
      return volumes;
    } catch (error) {
      console.error(`Error loading volumes for manga ${mangaId}:`, error);
      return [];
    }
  }

  /**
   * Get pages for a specific volume
   * This method is safe to call from both client and server
   */
  public static getVolumePages(manga: string, volume: Volume): MangaPage[] {
    return volume.mokuroData.pages.map(
      (pageData: MokuroPage, index: number) => {
        // Get the image path
        const imageName = pageData.img_path || `page_${index + 1}.jpg`;

        return {
          // Use direct URL to the image in public directory
          image: createMangaImageUrl(
            manga,
            volume.mokuroData.volume,
            imageName
          ),
          blocks: pageData.blocks || [],
          img_width: pageData.img_width || 800,
          img_height: pageData.img_height || 1200,
          // Store the relative path for potential direct access
          img_path: `${manga}/${volume.mokuroData.volume}/${imageName}`,
        };
      }
    );
  }
}
