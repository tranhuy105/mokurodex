/**
 * Consolidated types for content management
 */

import { Page, TextBlock } from "@prisma/client";

// Types from content.ts
export type ContentType = "manga" | "lightnovel";
export type VolumeType = "manga" | "epub";

// Types from content-management.ts
export type TagType = "genre" | "content" | "custom";
export type ContentStatus =
    | "reading"
    | "completed"
    | "on-hold"
    | "dropped"
    | "plan-to-read";

// Add this somewhere appropriate in the file
export type SortOption = "relevance" | "newest" | "title";

/**
 * Content interface matching the Prisma Content model
 */
export interface Content {
    id: string;
    title: string;
    volumes: number;
    coverImage?: string | null;
    addedDate: Date;
    lastModified: Date;
    directoryPath: string;
    lastScanned: Date;
    scanStatus: string;
    errorMessage?: string | null;
    contentType: ContentType;
}

/**
 * Volume interface matching the Prisma Volume model
 */
export interface Volume {
    id: string;
    contentId: string;
    volumeNumber: number;
    volumeTitle: string;
    filePath: string;
    coverImage?: string | null;
    pageCount: number;
    addedDate: Date;
    lastModified: Date;
    volumeUuid: string;
    previewImages?: string | null;
    volumeType: VolumeType;
    metadata?: string | null;
}

/**
 * UserContentMetadata interface matching the Prisma UserContentMetadata model
 */
export interface UserContentMetadata {
    id: string;
    contentId: string;
    rating?: number | null;
    progress?: number | null;
    status?: ContentStatus | null;
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

/**
 * Tag interface matching the Prisma Tag model
 */
export interface Tag {
    id: string;
    name: string;
    color?: string | null;
    type: TagType;
}

/**
 * Collection interface matching the Prisma Collection model
 */
export interface Collection {
    id: string;
    name: string;
    description?: string | null;
    coverImage?: string | null;
    createdAt: Date;
    updatedAt: Date;
    contentIds?: string[];
}

/**
 * ReadingHistory interface matching the Prisma ReadingHistory model
 */
export interface ReadingHistory {
    id: string;
    contentId: string;
    volumeId: string;
    position: number;
    chapterHref?: string | null;
    timestamp: Date;
    volume?: Volume;
}

/**
 * ContentTag interface for content-tag relationships
 */
export interface ContentTag {
    contentId: string;
    tagId: string;
    tag: Tag;
}

/**
 * ContentWithUserData interface for content with user metadata
 */
export interface ContentWithUserData extends Content {
    userData?: UserContentMetadata | null;
    contentTags?: ContentTag[];
    readingHistory?: ReadingHistory[];
    contentVolumes?: Volume[];
}

export interface ExtendedCollection extends Collection {
    contentIds?: string[];
    collectionContent?: {
        contentId: string;
        content: Content;
    }[];
}

export interface PageWithTextBlocks extends Page {
    textBlocks: TextBlock[];
}

export interface VolumeWithPages extends Volume {
    pages: PageWithTextBlocks[];
}

