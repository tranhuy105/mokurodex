import { z } from "zod";

// ========== Tag Schema ==========
export const TagSchema = z.object({
    name: z.string().min(1),
    color: z.string().optional(),
    type: z.enum(["genre", "content", "custom"]),
});

export const TagUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().optional(),
    type: z.enum(["genre", "content", "custom"]).optional(),
});

export const IdSchema = z.object({
    id: z.string().min(1),
});

export const CollectionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    contentIds: z.array(z.string()).optional(),
});

export const CollectionUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    contentIds: z.array(z.string()).optional(),
});

export const ContentCollectionSchema = z.object({
    collectionId: z.string().min(1),
    contentId: z.string().min(1),
});

export const UserMetadataSchema = z.object({
    contentId: z.string().min(1),
    rating: z.number().min(0).max(5).nullable().optional(),
    progress: z.number().int().min(0).nullable().optional(),
    status: z
        .enum([
            "reading",
            "completed",
            "on-hold",
            "dropped",
            "plan-to-read",
        ])
        .nullable()
        .optional(),
    notes: z.string().nullable().optional(),
    favorite: z.boolean().optional(),
    isNsfw: z.boolean().optional(),
    customCover: z.string().nullable().optional(),
    author: z.string().nullable().optional(),
    artist: z.string().nullable().optional(),
    releaseYear: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
    publisher: z.string().nullable().optional(),
    tagIds: z.array(z.string()).optional(),
    collectionIds: z.array(z.string()).optional(),
});

export const ReadingHistorySchema = z.object({
    contentId: z.string().min(1),
    volumeId: z.string().min(1),
    position: z.number().int().min(0),
    chapterHref: z.string().optional(),
});

export const SearchSchema = z.object({
    query: z.string().optional(),
    tags: z.array(z.string()).optional(),
    collections: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    favorite: z.boolean().optional(),
    isNsfw: z.boolean().optional(),
    contentType: z.array(z.string()).optional(),
});

export const ContentImportSchema = z.object({
    directoryPath: z.string().min(1),
    providedContentId: z.string().nullable().optional(),
    isCustomPath: z.boolean().optional().default(false),
});

export const ContentIdSchema = z.object({
    id: z.string().min(1),
});

export const VolumeIdSchema = z.object({
    id: z.string().min(1),
});

export const EpubRequestSchema = z.object({
    contentId: z.string().min(1),
    volumeNumber: z.number().int().positive().default(1),
});

export const ScanDirectorySchema = z.object({
    baseDir: z.string().min(1),
    contentType: z.enum(["manga", "ln"]),
});
