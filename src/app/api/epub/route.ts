import { db } from "@/server/db/client";
import * as fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import * as path from "path";

/**
 * GET /api/epub?contentId=xxx&volumeNumber=1
 * Returns the full EPUB file as a binary stream
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Get parameters
        const contentId = searchParams.get("contentId");
        const volumeNumber = searchParams.get(
            "volumeNumber"
        )
            ? parseInt(
                  searchParams.get("volumeNumber") || "1",
                  10
              )
            : 1;

        // Serve the full EPUB file
        return await serveFullEpubFile(
            contentId,
            volumeNumber
        );
    } catch (error) {
        console.error("Error serving EPUB:", error);
        return NextResponse.json(
            { error: "Failed to serve EPUB file" },
            { status: 500 }
        );
    }
}

/**
 * Serve the full EPUB file as a binary stream
 */
async function serveFullEpubFile(
    contentId: string | null,
    volumeNumber: number
) {
    try {
        if (!contentId) {
            return NextResponse.json(
                { error: "Missing contentId" },
                { status: 400 }
            );
        }

        // Get the EPUB file path from the database
        const volume = await db.volume.findFirst({
            where: {
                contentId,
                volumeNumber,
                volumeType: "epub",
            },
            select: { filePath: true, volumeTitle: true },
        });

        if (!volume || !volume.filePath) {
            return NextResponse.json(
                { error: "EPUB not found" },
                { status: 404 }
            );
        }

        // Check if file exists
        try {
            await fs.access(volume.filePath);
        } catch {
            return NextResponse.json(
                { error: "EPUB file not found on disk" },
                { status: 404 }
            );
        }

        // Read the EPUB file
        const fileBuffer = await fs.readFile(
            volume.filePath
        );

        // Return the EPUB file with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/epub+zip",
                "Content-Length":
                    fileBuffer.length.toString(),
                "Content-Disposition": `inline; filename="${path.basename(
                    volume.filePath
                )}"`,
            },
        });
    } catch (error) {
        console.error(
            "Error serving full EPUB file:",
            error
        );
        return NextResponse.json(
            { error: "Failed to serve EPUB file" },
            { status: 500 }
        );
    }
}
