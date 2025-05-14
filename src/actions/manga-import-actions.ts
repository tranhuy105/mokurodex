"use server";

import { MangaImportService } from "@/lib/services/MangaImportService";
import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import { MangaRepository } from "@/lib/database/MangaRepository";
import { MangaEntity, VolumeEntity } from "@/lib/database/DatabaseInterface";

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
