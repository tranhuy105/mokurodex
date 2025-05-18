import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { createReadStream, statSync, existsSync } from "fs";

/**
 * API endpoint to stream manga images from their absolute paths
 *
 * Usage: /api/media?absolutePath=/absolute/path/to/image.jpg
 *
 * The absolutePath parameter should be URL encoded
 */
export async function GET(request: NextRequest) {
  try {
    // Get the image path from query parameters
    const { searchParams } = new URL(request.url);
    const absolutePath = searchParams.get("absolutePath");

    // Validate the absolutePath parameter
    if (!absolutePath) {
      return NextResponse.json(
        { error: "Missing absolutePath parameter" },
        { status: 400 }
      );
    }

    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(absolutePath);

    // Security check: Make sure the path doesn't contain directory traversal
    const normalizedPath = path.normalize(decodedPath);
    console.log("normalizedPath", normalizedPath);

    if (normalizedPath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Check if the client already has a cached version
    const etag = `"${generateEtag(normalizedPath)}"`;
    const ifNoneMatch = request.headers.get("if-none-match");

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 }); // Not Modified
    }

    return streamImageFile(normalizedPath, etag);
  } catch (error) {
    console.error("Error serving media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a simple ETag based on file path and modification time
 */
function generateEtag(filePath: string): string {
  try {
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      // Use a hash of the path instead of the raw path to avoid Unicode issues
      const pathHash = Buffer.from(filePath).toString("base64").substring(0, 8);
      return `${pathHash}-${stats.size}-${stats.mtimeMs}`;
    }
  } catch (error) {
    console.error("Error generating ETag:", error);
  }
  // Return a fallback that doesn't contain Unicode characters
  return `file-${Date.now()}`;
}
/**
 * Helper function to stream an image file
 */
async function streamImageFile(filePath: string, etag: string) {
  try {
    // Check if the file exists (only try the exact path - handling variations in the client is better)
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Image not found", path: filePath },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
    }

    // Create a readable stream from the file and convert it to a Web ReadableStream
    const fileStream = createReadStream(filePath);

    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => {
          controller.enqueue(chunk);
        });

        fileStream.on("end", () => {
          controller.close();
        });

        fileStream.on("error", (error) => {
          controller.error(error);
        });
      },
      cancel() {
        fileStream.destroy();
      },
    });

    // Return the response with appropriate headers
    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Cache-Control": "public, max-age=86400, immutable", // Cache for 1 day, mark as immutable
        ETag: etag,
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("Error streaming file:", error);
    return NextResponse.json(
      {
        error: "Error streaming file",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
