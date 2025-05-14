import { initializeTags } from "@/scripts/initialize-tags";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await initializeTags();

    return NextResponse.json({
      success: true,
      message: `Initialized tags: ${result.created} new tags created, ${result.existing} tags already existed.`,
      ...result,
    });
  } catch (error) {
    console.error("Error in tag initialization API:", error);
    return NextResponse.json(
      { success: false, message: "Failed to initialize tags" },
      { status: 500 }
    );
  }
}

// To initialize tags, visit /api/init-tags in your browser
