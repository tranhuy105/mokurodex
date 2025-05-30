import { db } from "@/server/db/client";
import { Tag } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Create genre tags
        const genreTags: Omit<Tag, "id">[] = [
            {
                name: "Action",
                color: "red",
                type: "genre" as const,
            },
            {
                name: "Adventure",
                color: "blue",
                type: "genre" as const,
            },
            {
                name: "Comedy",
                color: "yellow",
                type: "genre" as const,
            },
            {
                name: "Drama",
                color: "purple",
                type: "genre" as const,
            },
            {
                name: "Fantasy",
                color: "indigo",
                type: "genre" as const,
            },
            {
                name: "Horror",
                color: "gray",
                type: "genre" as const,
            },
            {
                name: "Mystery",
                color: "green",
                type: "genre" as const,
            },
            {
                name: "Romance",
                color: "pink",
                type: "genre" as const,
            },
            {
                name: "Sci-Fi",
                color: "blue",
                type: "genre" as const,
            },
            {
                name: "Slice of Life",
                color: "green",
                type: "genre" as const,
            },
            {
                name: "Sports",
                color: "orange",
                type: "genre" as const,
            },
            {
                name: "Supernatural",
                color: "purple",
                type: "genre" as const,
            },
            {
                name: "Thriller",
                color: "red",
                type: "genre" as const,
            },
        ];

        // Create content tags
        const contentTags: Omit<Tag, "id">[] = [
            {
                name: "School Setting",
                color: "blue",
                type: "content" as const,
            },
            {
                name: "Time Travel",
                color: "purple",
                type: "content" as const,
            },
            {
                name: "Isekai",
                color: "indigo",
                type: "content" as const,
            },
            {
                name: "Magic",
                color: "purple",
                type: "content" as const,
            },
            {
                name: "Military",
                color: "gray",
                type: "content" as const,
            },
            {
                name: "Cooking",
                color: "yellow",
                type: "content" as const,
            },
            {
                name: "Music",
                color: "pink",
                type: "content" as const,
            },
            {
                name: "Art",
                color: "orange",
                type: "content" as const,
            },
            {
                name: "Martial Arts",
                color: "red",
                type: "content" as const,
            },
            {
                name: "Mecha",
                color: "gray",
                type: "content" as const,
            },
            {
                name: "Superpower",
                color: "blue",
                type: "content" as const,
            },
            {
                name: "Psychological",
                color: "purple",
                type: "content" as const,
            },
        ];

        // Insert data
        const createdGenreTags = await Promise.all(
            genreTags.map((tag) =>
                db.tag.create({
                    data: { ...tag, id: tag.name },
                })
            )
        );

        const createdContentTags = await Promise.all(
            contentTags.map((tag) =>
                db.tag.create({
                    data: { ...tag, id: tag.name },
                })
            )
        );

        return NextResponse.json({
            success: true,
            data: {
                genreTags: createdGenreTags.length,
                contentTags: createdContentTags.length,
            },
        });
    } catch (error) {
        console.error("Error seeding database:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
