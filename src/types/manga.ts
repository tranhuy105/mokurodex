/**
 * Represents a block of text on a manga page
 */
export interface TextBlock {
  box: [number, number, number, number];
  lines: string[];
  font_size: number;
  vertical: boolean;
  lines_coords?: number[][][];
}

/**
 * Represents a single page in a manga volume
 */
export interface MangaPage {
  image: string;
  blocks: TextBlock[];
  img_width: number;
  img_height: number;
  img_path?: string;
}

/**
 * Represents metadata for a mokuro page
 */
export interface MokuroPage {
  version?: string;
  img_path?: string;
  img_width: number;
  img_height: number;
  blocks: TextBlock[];
  [key: string]: unknown;
}

/**
 * Represents a volume of a manga
 */
export interface Volume {
  mokuroData: {
    version: string;
    volume_uuid: string;
    title_uuid: string;
    title: string;
    volume: string;
    pages: MokuroPage[];
  };
  volumeName?: string;
  files?: Record<string, unknown>;
  coverImage?: string | null;
  metadata?: {
    releaseDate: string;
    lastModified: string;
    publisher: string;
    pageCount: number;
  };
  previewImages?: string[];
}

/**
 * Represents metadata for a manga
 */
export interface MangaMetadata {
  id: string;
  title: string;
  volumes: number;
  coverImage?: string | null;
  addedDate?: string;
  lastModified?: string;
}

/**
 * Extended Collection type that includes mangaIds from CollectionManga relation
 */
export interface ExtendedCollection {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  mangaIds: string[];
}

/**
 * Extended UserMangaMetadata interface to include tagIds and collectionIds
 */
export interface ExtendedUserMangaMetadata {
  id: string;
  mangaId: string;
  rating?: number | null;
  progress?: number | null;
  status?: string | null;
  notes?: string | null;
  favorite: boolean;
  isNsfw: boolean;
  customCover?: string | null;
  author?: string | null;
  artist?: string | null;
  releaseYear?: number | null;
  publisher?: string | null;
  updatedAt: Date;
  tagIds?: string[];
  collectionIds?: string[];
}
