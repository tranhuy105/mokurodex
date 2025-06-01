import { db } from "@/server/db/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to get all pages for a specific volume
 *
 * Usage: /api/pages?volumeId=xxx
 */
export async function GET(request: NextRequest) {
    try {
        // Get the volume ID from query parameters
        const { searchParams } = new URL(request.url);
        const volumeId = searchParams.get("volumeId");

        // Validate the volumeId parameter
        if (!volumeId) {
            return NextResponse.json(
                { error: "Missing volumeId parameter" },
                { status: 400 }
            );
        }

        // Get all pages for this volume
        const pages = await db.page.findMany({
            where: { volumeId },
            orderBy: { pageNumber: "asc" },
            include: {
                textBlocks: true,
            },
        });

        return NextResponse.json(pages);
    } catch (error) {
        console.error("Error serving pages:", error);
        return NextResponse.json(
            { error: "Failed to retrieve pages" },
            { status: 500 }
        );
    }
}
