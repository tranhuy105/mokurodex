import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * GET /api/epub?mangaId=xxx&volumeNumber=1
 * Returns the full EPUB file as a binary stream
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const mangaId = searchParams.get("mangaId");
    const volumeNumber = searchParams.get("volumeNumber")
      ? parseInt(searchParams.get("volumeNumber") || "1", 10)
      : 1;

    // Serve the full EPUB file
    return await serveFullEpubFile(mangaId, volumeNumber);
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
async function serveFullEpubFile(mangaId: string | null, volumeNumber: number) {
  try {
    if (!mangaId) {
      return NextResponse.json({ error: "Missing mangaId" }, { status: 400 });
    }

    // Get the EPUB file path from the database
    const volume = await prisma.epubVolume.findFirst({
      where: { mangaId, volumeNumber },
      select: { filePath: true, volumeTitle: true },
    });

    if (!volume || !volume.filePath) {
      return NextResponse.json({ error: "EPUB not found" }, { status: 404 });
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
    const fileBuffer = await fs.readFile(volume.filePath);

    // Return the EPUB file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${path.basename(
          volume.filePath
        )}"`,
      },
    });
  } catch (error) {
    console.error("Error serving full EPUB file:", error);
    return NextResponse.json(
      { error: "Failed to serve EPUB file" },
      { status: 500 }
    );
  }
}
