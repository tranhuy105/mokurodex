import {
  IMangaRepository,
  MangaEntity,
  VolumeEntity,
  UserMangaMetadata,
  SettingsEntity,
} from "./DatabaseInterface";
import { MangaMetadata } from "@/types/manga";

/**
 * Extended repository interface that includes methods for manga and volume management
 */
export interface MangaRepository extends IMangaRepository {
  // Manga entity operations
  getManga(id: string): Promise<MangaEntity | null>;
  getAllManga(): Promise<MangaEntity[]>;
  createManga(manga: MangaEntity): Promise<MangaEntity>;
  updateManga(
    id: string,
    manga: Partial<MangaEntity>
  ): Promise<MangaEntity | null>;
  deleteManga(id: string): Promise<boolean>;

  // Get manga with volumes in a single operation
  getMangaWithVolumes(
    id: string
  ): Promise<{ manga: MangaEntity; volumes: VolumeEntity[] } | null>;

  // Volume operations
  getVolume(id: string): Promise<VolumeEntity | null>;
  getVolumesByMangaId(mangaId: string): Promise<VolumeEntity[]>;
  saveVolumes(
    mangaId: string,
    volumes: VolumeEntity[]
  ): Promise<VolumeEntity[]>;
  updateVolume(
    id: string,
    volume: Partial<VolumeEntity>
  ): Promise<VolumeEntity | null>;
  deleteVolume(id: string): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<SettingsEntity | null>;
  updateSettings(settings: Partial<SettingsEntity>): Promise<SettingsEntity>;

  // Combined data operations (from IMangaRepository)
  getMangaWithUserData(
    mangaId: string
  ): Promise<(MangaMetadata & { userData: UserMangaMetadata | null }) | null>;
}
