import { db } from "@/server/db/client";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Get the volumeId from the query parameters
        const { searchParams } = new URL(request.url);
        const volumeId = searchParams.get("volumeId");

        if (!volumeId) {
            return NextResponse.json(
                { error: "Volume ID is required" },
                { status: 400 }
            );
        }

        // Get the volume from the database
        const volume = await db.volume.findUnique({
            where: { id: volumeId },
            include: { content: true },
        });

        if (!volume) {
            return NextResponse.json(
                { error: "Volume not found" },
                { status: 404 }
            );
        }

        // Get the file path of the .mokuro file
        const mokuroFilePath = volume.filePath;

        // Create the HTML file path by replacing .mokuro extension with .html
        const htmlFilePath = mokuroFilePath.replace(
            /\.mokuro$/,
            ".html"
        );

        try {
            // Try to read the HTML file
            const htmlContent = await readFile(
                htmlFilePath,
                "utf-8"
            );

            // Return the HTML content
            return new NextResponse(htmlContent, {
                headers: {
                    "Content-Type": "text/html",
                },
            });
        } catch (fileError) {
            console.error(
                "Error reading HTML file:",
                fileError
            );
            return NextResponse.json(
                {
                    error: "HTML file not found or cannot be read",
                },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("Error serving Mokuro HTML:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
