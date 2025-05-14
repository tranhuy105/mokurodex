"use server";

import { MangaRepository } from "./MangaRepository";
import * as SqliteMangaRepository from "./SqliteMangaRepository";

let repository: MangaRepository | null = null;

/**
 * Get an instance of the manga repository
 * This factory returns a cached instance when available
 */
export async function getRepository(): Promise<MangaRepository> {
  if (repository) {
    return repository;
  }

  // For now, always use the SQLite repository implementation
  repository = SqliteMangaRepository as unknown as MangaRepository;
  return repository;
}

/**
 * For testing: Reset the repository instance
 */
export async function resetRepository(): Promise<void> {
  // This might need to be implemented in the SQLite repository if needed
  // For now, we're not maintaining a singleton instance, so nothing to do
}
