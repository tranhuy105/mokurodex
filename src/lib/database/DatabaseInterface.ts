import { MangaMetadata } from "@/types/manga";

/**
 * Represents a manga entity in the database
 * Extends MangaMetadata with additional fields for file system tracking
 */
export interface MangaEntity extends MangaMetadata {
  id: string;
  title: string;
  volumes: number;
  coverImage?: string | null;
  addedDate: string;
  lastModified: string;

  // File system tracking
  directoryPath: string;
  lastScanned: string;
  scanStatus: "pending" | "complete" | "error";
  errorMessage?: string;
}

/**
 * Represents volume information in the database
 */
export interface VolumeEntity {
  id: string;
  mangaId: string;
  volumeNumber: number;
  volumeTitle: string;
  filePath: string;
  coverImage?: string | null;
  pageCount: number;
  addedDate: string;
  lastModified: string;
  volumeUuid: string;
  previewImages?: string[]; // Array of preview image paths
}

/**
 * Represents a tag for manga
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
  type: "genre" | "content" | "custom";
}

/**
 * Represents a collection of manga
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  mangaIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata that can be manually added to a manga
 */
export interface UserMangaMetadata {
  id: string;
  mangaId: string;
  rating?: number;
  progress?: number;
  status?: "reading" | "completed" | "on-hold" | "dropped" | "plan-to-read";
  notes?: string;
  favorite: boolean;
  isNsfw?: boolean;
  customCover?: string;
  tagIds: string[];
  collectionIds: string[];
  author?: string;
  artist?: string;
  releaseYear?: number;
  publisher?: string;
  updatedAt: string;
}

/**
 * Reading history entry
 */
export interface ReadingHistoryEntry {
  id: string;
  mangaId: string;
  volumeId: string;
  page: number;
  timestamp: string;
}

/**
 * Application settings stored in the database
 */
export interface SettingsEntity {
  id: string;
  darkMode: boolean;
  invertColors: boolean;
  rightToLeft: boolean;
  hasCover: boolean;
  showTooltips: boolean;
  ankiEnabled: boolean;
  fontSize: number | "auto";
  readingMode: "singlePage" | "doublePage" | "longStrip";
  animatePageTurns: boolean;
  highlightColor: string;
  readerBackground: string;
  pageMargin: number;
  furiganaDisplay: "always" | "hover" | "never";
  autoSavePosition: boolean;
  dictionaryProvider: "jisho" | "google" | "custom";
  customDictionaryUrl: string | null;
  pageNavigationMethod: "click" | "tap" | "swipe" | "arrows";
  updatedAt: string;
}

/**
 * Interface for the manga repository operations
 */
export interface IMangaRepository {
  // Tag operations
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | null>;
  createTag(tag: Omit<Tag, "id">): Promise<Tag>;
  updateTag(id: string, tag: Partial<Tag>): Promise<Tag | null>;
  deleteTag(id: string): Promise<boolean>;

  // Collection operations
  getCollections(): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | null>;
  createCollection(
    collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
  ): Promise<Collection>;
  updateCollection(
    id: string,
    collection: Partial<Collection>
  ): Promise<Collection | null>;
  deleteCollection(id: string): Promise<boolean>;
  addMangaToCollection(collectionId: string, mangaId: string): Promise<boolean>;
  removeMangaFromCollection(
    collectionId: string,
    mangaId: string
  ): Promise<boolean>;

  // User manga metadata operations
  getUserMangaMetadata(mangaId: string): Promise<UserMangaMetadata | null>;
  getAllUserMangaMetadata(): Promise<UserMangaMetadata[]>;
  updateUserMangaMetadata(
    mangaId: string,
    metadata: Partial<UserMangaMetadata>
  ): Promise<UserMangaMetadata | null>;

  // Reading history operations
  getReadingHistory(mangaId: string): Promise<ReadingHistoryEntry[]>;
  addReadingHistoryEntry(
    entry: Omit<ReadingHistoryEntry, "id" | "timestamp">
  ): Promise<ReadingHistoryEntry>;

  // Combined operations
  getMangaWithUserData(
    mangaId: string
  ): Promise<(MangaMetadata & { userData: UserMangaMetadata | null }) | null>;
  getAllMangaWithUserData(): Promise<
    Array<MangaMetadata & { userData: UserMangaMetadata | null }>
  >;
  getMangaByTag(
    tagId: string
  ): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>>;
  getMangaByCollection(
    collectionId: string
  ): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>>;
  searchMangaWithFilters(options: {
    query?: string;
    tags?: string[];
    collections?: string[];
    status?: string[];
    favorite?: boolean;
    isNsfw?: boolean;
  }): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>>;
}
