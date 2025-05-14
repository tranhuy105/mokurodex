"use server";

import { MangaEntity, VolumeEntity } from "@/lib/database/DatabaseInterface";
import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import { MangaRepository } from "@/lib/database/MangaRepository";
import { MangaImportService } from "@/lib/services/MangaImportService";

/**
 * Scan all manga directories and import them into the database
 */
export async function scanAllManga(): Promise<MangaEntity[]> {
  try {
    const repository = (await getRepository()) as MangaRepository;
    const importService = new MangaImportService(repository);
    return await importService.scanAllManga();
  } catch (error) {
    console.error("Error in scanAllManga server action:", error);
    return [];
  }
}

/**
 * Import a specific manga directory into the database
 */
export async function importMangaDirectory(
  directoryPath: string
): Promise<MangaEntity | null> {
  try {
    const repository = (await getRepository()) as MangaRepository;
    const importService = new MangaImportService(repository);
    return await importService.importMangaDirectory(directoryPath);
  } catch (error) {
    console.error(
      `Error in importMangaDirectory server action for ${directoryPath}:`,
      error
    );
    return null;
  }
}

/**
 * Get manga from the database
 */
export async function getDatabaseManga(): Promise<MangaEntity[]> {
  try {
    const repository = (await getRepository()) as MangaRepository;
    return await repository.getAllManga();
  } catch (error) {
    console.error("Error in getDatabaseManga server action:", error);
    return [];
  }
}

/**
 * Get a single manga by ID from the database
 */
export async function getDatabaseMangaById(
  id: string
): Promise<MangaEntity | null> {
  try {
    console.log(`getDatabaseMangaById: Retrieving manga with ID ${id}`);
    const repository = (await getRepository()) as MangaRepository;

    // Use the more efficient method that retrieves manga with volumes in one operation
    const result = await repository.getMangaWithVolumes(id);

    // Return just the manga entity from the result
    return result?.manga || null;
  } catch (error) {
    console.error(
      `Error in getDatabaseMangaById server action for ${id}:`,
      error
    );
    return null;
  }
}

/**
 * Delete a manga from the database
 */
export async function deleteDatabaseManga(id: string): Promise<boolean> {
  try {
    const repository = (await getRepository()) as MangaRepository;
    return await repository.deleteManga(id);
  } catch (error) {
    console.error(
      `Error in deleteDatabaseManga server action for ${id}:`,
      error
    );
    return false;
  }
}

/**
 * Get volumes for a manga
 */
export async function getDatabaseVolumes(
  mangaId: string
): Promise<VolumeEntity[]> {
  try {
    console.log(`getDatabaseVolumes: Retrieving volumes for manga ${mangaId}`);
    const repository = (await getRepository()) as MangaRepository;

    // Check if the manga exists first via the combined method
    const result = await repository.getMangaWithVolumes(mangaId);

    // Return the volumes or empty array if manga not found
    return result?.volumes || [];
  } catch (error) {
    console.error(
      `Error in getDatabaseVolumes server action for ${mangaId}:`,
      error
    );
    return [];
  }
}

/**
 * Clear all manga data and rescan everything
 * This is useful after schema changes
 */
export async function clearAndRescanAllManga(): Promise<MangaEntity[]> {
  try {
    console.log("Clearing all manga data and rescanning...");

    const repository = (await getRepository()) as MangaRepository;

    // Get database access - we need to directly access the DB for clearing operations
    // We're using a type assertion here because the repository doesn't expose this method publicly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (repository as any).getDb?.();
    if (!db) {
      console.error(
        "Cannot access database directly for clearing. Falling back to regular scan."
      );
      return scanAllManga();
    }

    // Begin a transaction for the clearing operations
    const clearTransaction = db.transaction(() => {
      // Clear all related data
      db.prepare("DELETE FROM reading_history").run();
      db.prepare("DELETE FROM collection_manga").run();
      db.prepare("DELETE FROM manga_tags").run();
      db.prepare("DELETE FROM user_manga_metadata").run();
      db.prepare("DELETE FROM volumes").run();
      db.prepare("DELETE FROM manga").run();

      console.log("All manga data cleared successfully.");
    });

    // Execute the transaction
    clearTransaction();

    // Now do a full scan
    console.log("Starting full rescan...");
    const importService = new MangaImportService(repository);
    const results = await importService.scanAllManga();

    console.log(`Rescan complete. Imported ${results.length} manga.`);
    return results;
  } catch (error) {
    console.error("Error in clearAndRescanAllManga server action:", error);
    return [];
  }
}
