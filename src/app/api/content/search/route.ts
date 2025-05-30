import { searchContent } from "@/server/actions/content-management";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") as string;

        if (!query || query.trim() === "") {
            return NextResponse.json([]);
        }

        const results = await searchContent({ query });
        return NextResponse.json(results);
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json(
            { error: "Failed to search content" },
            { status: 500 }
        );
    }
}
