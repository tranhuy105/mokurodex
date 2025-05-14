"use server";

import { createTag, getAllTags } from "@/actions/manga-management-actions";
import { Tag } from "@/lib/database/DatabaseInterface";

// Popular genres with colors
const GENRES: Array<Omit<Tag, "id">> = [
  { name: "Action", type: "genre", color: "red" },
  { name: "Adventure", type: "genre", color: "amber" },
  { name: "Comedy", type: "genre", color: "yellow" },
  { name: "Drama", type: "genre", color: "orange" },
  { name: "Fantasy", type: "genre", color: "purple" },
  { name: "Horror", type: "genre", color: "gray" },
  { name: "Mystery", type: "genre", color: "indigo" },
  { name: "Romance", type: "genre", color: "pink" },
  { name: "Sci-Fi", type: "genre", color: "cyan" },
  { name: "Slice of Life", type: "genre", color: "green" },
  { name: "Sports", type: "genre", color: "lime" },
  { name: "Supernatural", type: "genre", color: "violet" },
  { name: "Thriller", type: "genre", color: "rose" },
  { name: "Historical", type: "genre", color: "amber" },
  { name: "Mecha", type: "genre", color: "gray" },
  { name: "Music", type: "genre", color: "fuchsia" },
  { name: "Psychological", type: "genre", color: "indigo" },
  { name: "Isekai", type: "genre", color: "teal" },
];

// Common content tags
const CONTENT_TAGS: Array<Omit<Tag, "id">> = [
  { name: "Shounen", type: "content", color: "blue" },
  { name: "Shoujo", type: "content", color: "pink" },
  { name: "Seinen", type: "content", color: "gray" },
  { name: "Josei", type: "content", color: "purple" },
  { name: "Harem", type: "content", color: "red" },
  { name: "Reverse Harem", type: "content", color: "rose" },
  { name: "School Life", type: "content", color: "sky" },
  { name: "Magic", type: "content", color: "violet" },
  { name: "Gore", type: "content", color: "red" },
  { name: "Martial Arts", type: "content", color: "amber" },
  { name: "Military", type: "content", color: "green" },
  { name: "Super Power", type: "content", color: "yellow" },
  { name: "Demons", type: "content", color: "red" },
  { name: "Vampire", type: "content", color: "red" },
  { name: "Ecchi", type: "content", color: "pink" },
  { name: "Supernatural", type: "content", color: "indigo" },
  { name: "Time Travel", type: "content", color: "blue" },
  { name: "Cooking", type: "content", color: "amber" },
  { name: "Reincarnation", type: "content", color: "teal" },
  { name: "Office", type: "content", color: "blue" },
  { name: "Crossdressing", type: "content", color: "fuchsia" },
];

/**
 * Initializes the tag database with common manga genres and content tags
 * if they don't already exist
 */
export async function initializeTags(): Promise<{
  created: number;
  existing: number;
}> {
  try {
    const existingTags = await getAllTags();
    const existingTagNames = new Set(
      existingTags.map((tag) => tag.name.toLowerCase())
    );

    let created = 0;
    const allTags = [...GENRES, ...CONTENT_TAGS];

    for (const tag of allTags) {
      // Only create tags that don't exist
      if (!existingTagNames.has(tag.name.toLowerCase())) {
        await createTag(tag);
        created++;
      }
    }

    return {
      created,
      existing: existingTags.length,
    };
  } catch (error) {
    console.error("Error initializing tags:", error);
    throw error;
  }
}
