"use server";

import { db } from "@/server/db/client";
import { z } from "zod";

// Schema definitions
const ContentIdSchema = z.object({
    id: z.string().min(1),
});

const VolumeIdSchema = z.object({
    id: z.string().min(1),
});

const ReadingHistorySchema = z.object({
    contentId: z.string().min(1),
    volumeId: z.string().min(1),
    position: z.number().int().min(0),
    chapterHref: z.string().optional(),
});

/**
 * Get content with volumes
 */
export async function getContentWithVolumes(input: {
    id: string;
}) {
    try {
        const { id } = ContentIdSchema.parse(input);

        return await db.content.findUnique({
            where: { id },
            include: {
                contentVolumes: {
                    orderBy: { volumeNumber: "asc" },
                },
                userData: true,
            },
        });
    } catch (error) {
        console.error(
            `Error getting content with volumes:`,
            error
        );
        return null;
    }
}

/**
 * Get volume details by ID
 */
export async function getVolumeById(input: { id: string }) {
    try {
        const { id } = VolumeIdSchema.parse(input);

        return await db.volume.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error(`Error getting volume:`, error);
        return null;
    }
}

/**
 * Get pages for a specific volume
 */
export async function getVolumePages(input: {
    id: string;
}) {
    try {
        const { id: volumeId } =
            VolumeIdSchema.parse(input);

        return await db.page.findMany({
            where: { volumeId },
            orderBy: { pageNumber: "asc" },
            include: {
                textBlocks: true,
            },
        });
    } catch (error) {
        console.error(
            `Error getting pages for volume:`,
            error
        );
        return [];
    }
}

/**
 * Update reading history for a manga
 */
export async function updateReadingHistory(data: {
    contentId: string;
    volumeId: string;
    position: number;
    chapterHref?: string;
}) {
    try {
        const validatedData =
            ReadingHistorySchema.parse(data);
        const {
            contentId,
            volumeId,
            position,
            chapterHref,
        } = validatedData;

        // Create a unique ID for the reading history entry
        const id = `${contentId}_${volumeId}`;
        const timestamp = new Date();

        // Upsert the reading history entry
        await db.readingHistory.upsert({
            where: { id },
            update: {
                position,
                chapterHref,
                timestamp,
            },
            create: {
                id,
                contentId,
                volumeId,
                position,
                chapterHref,
                timestamp,
            },
        });

        return true;
    } catch (error) {
        console.error(
            `Error updating reading history:`,
            error
        );
        return false;
    }
}

/**
 * Get reading history for a specific content
 */
export async function getReadingHistory(input: {
    id: string;
}) {
    try {
        const { id } = ContentIdSchema.parse(input);

        return await db.readingHistory.findMany({
            where: { contentId: id },
            include: {
                volume: true,
            },
            orderBy: { timestamp: "desc" },
        });
    } catch (error) {
        console.error(
            `Error getting reading history:`,
            error
        );
        return [];
    }
}

/**
 * Get the most recent reading history for a content
 */
export async function getLatestReadingHistory(input: {
    id: string;
}) {
    try {
        const { id } = ContentIdSchema.parse(input);

        return await db.readingHistory.findFirst({
            where: { contentId: id },
            include: {
                volume: true,
            },
            orderBy: { timestamp: "desc" },
        });
    } catch (error) {
        console.error(
            `Error getting latest reading history:`,
            error
        );
        return null;
    }
}
