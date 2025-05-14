import { nanoid } from "nanoid";
import { MangaEntity, VolumeEntity } from "../database/DatabaseInterface";
import { config } from "@/config";
import { MangaRepository } from "../database/MangaRepository";

/**
 * Service responsible for scanning the manga directory and importing manga into the database
 */
export class MangaImportService {
  private repository: MangaRepository;

  constructor(repository: MangaRepository) {
    this.repository = repository;
  }

  /**
   * Extract and save preview images for a volume during import
   * @param mangaId Manga ID
   * @param volumeData Mokuro data for the volume
   * @param volumeName Volume name
   * @returns Array of preview image paths
   */
  private extractPreviewImages(
    mangaId: string,
    volumeData: { pages?: Array<{ img_path?: string }> },
    volumeName: string
  ): string[] {
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
          // For i=0 this gives index 0 (first page)
          // For i=7 this gives index (totalPages-1) (last page)
          const index = Math.floor((i * (totalPages - 1)) / 7);
          previewIndices.push(index);
        }
      }

      // Get preview image paths
      return previewIndices.map((index) => {
        const pageData = pages[index];
        const imageName = pageData.img_path || `page_${index + 1}.jpg`;
        return this.createMangaImagePath(mangaId, volumeName, imageName);
      });
    } catch (error) {
      console.error(
        `Error extracting preview images for ${mangaId}/${volumeName}:`,
        error
      );
      return [];
    }
  }

  /**
   * Create default user metadata for a newly imported manga
   * @param mangaId Manga ID
   */
  private async createDefaultUserMetadata(mangaId: string): Promise<void> {
    try {
      // Check if user metadata already exists for this manga
      const existingMetadata = await this.repository.getUserMangaMetadata(
        mangaId
      );

      // Only create if it doesn't exist
      if (!existingMetadata) {
        const now = new Date().toISOString();

        // Create basic metadata with default values
        await this.repository.updateUserMangaMetadata(mangaId, {
          favorite: false,
          status: "plan-to-read",
          progress: 0,
          updatedAt: now,
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
   * Scan a specific manga directory and import it into the database
   * @param directoryPath Path to the manga directory
   */
  public async importMangaDirectory(
    directoryPath: string
  ): Promise<MangaEntity | null> {
    const now = new Date().toISOString();
    let mangaEntity: MangaEntity | null = null;

    try {
      // Dynamically import server-only functions
      const { readDirectory, isDirectory, readFile, joinPath, getFileStats } =
        await import("../server/fs-adapter");

      // Extract manga ID from the directory path
      const mangaId = directoryPath.split("/").pop() || directoryPath;

      // Check if manga already exists in the database
      mangaEntity = await this.repository.getManga(mangaId);

      // Check if the directory exists
      const mangaPath = await joinPath(config.mangaDir, directoryPath);
      const isDir = await isDirectory(mangaPath);

      if (!isDir) {
        throw new Error(`Directory does not exist: ${mangaPath}`);
      }

      // Look for .mokuro files in the manga directory
      const files = await readDirectory(mangaPath);
      const mokuroFiles = files.filter((file: string) =>
        file.endsWith(".mokuro")
      );

      if (mokuroFiles.length === 0) {
        throw new Error(`No .mokuro files found in ${mangaPath}`);
      }

      // Get stats for the directory
      const stats = await getFileStats(mangaPath);
      const addedDate = stats.birthtime || stats.mtime;
      const lastModified = stats.mtime;

      // Read the first .mokuro file to get manga info
      const firstMokuroFile = await joinPath(mangaPath, mokuroFiles[0]);
      const firstMokuroContent = await readFile(firstMokuroFile);
      const firstMokuroData = JSON.parse(firstMokuroContent);

      // Get the cover image from the first page of the first volume
      let coverImage = null;
      if (firstMokuroData.pages && firstMokuroData.pages.length > 0) {
        const firstPage = firstMokuroData.pages[0];
        const imageName = firstPage.img_path || "page_1.jpg";
        coverImage = this.createMangaImagePath(
          mangaId,
          firstMokuroData.volume,
          imageName
        );
      }

      // Create or update the manga entity
      const mangaData: MangaEntity = {
        id: mangaId,
        title: firstMokuroData.title || mangaId,
        volumes: mokuroFiles.length,
        coverImage: coverImage,
        addedDate: addedDate.toISOString(),
        lastModified: lastModified.toISOString(),
        directoryPath: directoryPath,
        lastScanned: now,
        scanStatus: "complete",
      };

      if (mangaEntity) {
        // Update existing manga
        mangaEntity = await this.repository.updateManga(mangaId, mangaData);
      } else {
        // Create new manga
        mangaEntity = await this.repository.createManga(mangaData);

        // Create default user metadata for new manga
        await this.createDefaultUserMetadata(mangaId);
      }

      // Process and import each volume
      const volumes: VolumeEntity[] = [];

      for (const mokuroFile of mokuroFiles) {
        const mokuroPath = await joinPath(mangaPath, mokuroFile);
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
          volumeCoverImage = this.createMangaImagePath(
            mangaId,
            mokuroData.volume,
            imageName
          );
        }

        // Extract preview images
        const previewImages = this.extractPreviewImages(
          mangaId,
          mokuroData,
          mokuroData.volume
        );

        // Extract volume number from volume name or use index
        const volumeNumber =
          this.extractVolumeNumber(mokuroData.volume) ||
          mokuroFiles.indexOf(mokuroFile) + 1;

        // Create volume entity
        const volumeEntity: VolumeEntity = {
          id: nanoid(),
          mangaId: mangaId,
          volumeNumber: volumeNumber,
          volumeTitle: mokuroData.volume || `Volume ${volumeNumber}`,
          filePath: mokuroPath,
          coverImage: volumeCoverImage,
          pageCount: mokuroData.pages?.length || 0,
          addedDate: volumeAddedDate.toISOString(),
          lastModified: volumeLastModified.toISOString(),
          volumeUuid: mokuroData.volume_uuid || nanoid(),
          previewImages: previewImages,
        };

        volumes.push(volumeEntity);
      }

      // Save volumes to database
      await this.repository.saveVolumes(mangaId, volumes);

      return mangaEntity;
    } catch (error) {
      console.error(`Error importing manga directory ${directoryPath}:`, error);

      // Update manga entity with error status if it exists
      if (mangaEntity) {
        await this.repository.updateManga(mangaEntity.id, {
          scanStatus: "error",
          errorMessage: error instanceof Error ? error.message : String(error),
          lastScanned: now,
        });
      }

      return null;
    }
  }

  /**
   * Scan the entire manga directory and import all manga
   */
  public async scanAllManga(): Promise<MangaEntity[]> {
    try {
      // Dynamically import server-only functions
      const { readDirectory, isDirectory } = await import(
        "../server/fs-adapter"
      );

      const mangaDirs = await readDirectory(config.mangaDir);
      const results: MangaEntity[] = [];

      for (const dir of mangaDirs) {
        const fullPath = await import("path").then((p) =>
          p.join(config.mangaDir, dir)
        );

        const isDir = await isDirectory(fullPath);
        if (!isDir) continue;

        const result = await this.importMangaDirectory(dir);
        if (result) results.push(result);
      }

      return results;
    } catch (error) {
      console.error("Error scanning all manga:", error);
      return [];
    }
  }

  /**
   * Extract volume number from volume name
   * @param volumeName Volume name (e.g. "Volume 1")
   */
  private extractVolumeNumber(volumeName: string): number | null {
    const match = volumeName.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  /**
   * Create a path to a manga image
   */
  private createMangaImagePath(
    mangaId: string,
    volumeName: string,
    imageName: string
  ): string {
    return `/manga/${encodeURIComponent(mangaId)}/${encodeURIComponent(
      volumeName
    )}/${encodeURIComponent(imageName)}`;
  }
}
