import { db } from "@/server/db/client";
import * as fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

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
            select: {
                filePath: true,
                volumeTitle: true,
            },
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

        // Create safe ASCII-only filename to avoid encoding issues
        const createSafeFilename = (
            title: string | null,
            volumeNumber: number
        ): string => {
            if (!title) {
                return `volume_${volumeNumber}.epub`;
            }

            // Convert to ASCII-safe filename
            const asciiName = title
                .normalize("NFD") // Decompose Unicode
                .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
                .replace(/[^\w\s-]/g, "") // Keep only word chars, spaces, hyphens
                .replace(/\s+/g, "_") // Replace spaces with underscores
                .substring(0, 100) // Limit length
                .trim();

            return asciiName
                ? `${asciiName}.epub`
                : `volume_${volumeNumber}.epub`;
        };

        const safeFilename = createSafeFilename(
            volume.volumeTitle,
            volumeNumber
        );

        // Return the EPUB file with appropriate headers
        // Use Response constructor instead of NextResponse for binary data
        return new Response(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/epub+zip",
                "Content-Length":
                    fileBuffer.length.toString(),
                "Content-Disposition": `inline; filename="${safeFilename}"`,
                "Cache-Control": "public, max-age=31536000", // Cache for 1 year
                "Accept-Ranges": "bytes",
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