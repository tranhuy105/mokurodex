"use server";

import {
  Tag,
  Collection,
  UserMangaMetadata,
  ReadingHistoryEntry,
  MangaEntity,
  VolumeEntity,
  SettingsEntity,
} from "./DatabaseInterface";
import { MangaMetadata } from "@/types/manga";
import { searchManga } from "@/actions/manga-actions";
import { nanoid } from "nanoid";
import path from "path";

// Use better-sqlite3 for server-side SQLite operations
import Database from "better-sqlite3";

// Create a path for the SQLite database file relative to the manga directory
const DB_PATH = path.join(process.cwd(), "data", "manga-management.db");

// Define row types for type safety
interface MangaEntityRow {
  id: string;
  title: string;
  volumes: number;
  coverImage: string | null;
  addedDate: string;
  lastModified: string;
  directoryPath: string;
  lastScanned: string;
  scanStatus: string;
  errorMessage: string | null;
}

interface VolumeEntityRow {
  id: string;
  mangaId: string;
  volumeNumber: number;
  volumeTitle: string;
  filePath: string;
  coverImage: string | null;
  pageCount: number;
  addedDate: string;
  lastModified: string;
  volumeUuid: string;
  previewImages: string | null;
}

interface TagRow {
  id: string;
  name: string;
  color: string | null;
  type: string;
}

interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MangaTagRow {
  mangaId: string;
  tagId: string;
}

interface CollectionMangaRow {
  collectionId: string;
  mangaId: string;
}

interface UserMangaMetadataRow {
  id: string;
  mangaId: string;
  rating: number | null;
  progress: number | null;
  status: string | null;
  notes: string | null;
  favorite: number;
  isNsfw: number;
  customCover: string | null;
  author: string | null;
  artist: string | null;
  releaseYear: number | null;
  publisher: string | null;
  updatedAt: string;
}

interface ReadingHistoryRow {
  id: string;
  mangaId: string;
  volumeId: string;
  page: number;
  timestamp: string;
}

interface SettingsEntityRow {
  id: string;
  darkMode: number;
  invertColors: number;
  rightToLeft: number;
  hasCover: number;
  showTooltips: number;
  ankiEnabled: number;
  fontSize: string;
  readingMode: string;
  animatePageTurns: number;
  highlightColor: string;
  readerBackground: string;
  pageMargin: number;
  furiganaDisplay: string;
  autoSavePosition: number;
  dictionaryProvider: string;
  customDictionaryUrl: string | null;
  pageNavigationMethod: string;
  updatedAt: string;
}

// Define the join result type for queries that join manga with user metadata
interface MangaWithUserDataRow extends MangaEntityRow {
  um_id?: string;
  um_mangaId?: string;
  rating?: number;
  progress?: number;
  status?: string;
  notes?: string;
  favorite?: number;
  isNsfw?: number;
  customCover?: string;
  author?: string;
  artist?: string;
  releaseYear?: number;
  publisher?: string;
  updatedAt?: string;
  tagIds?: string;
  collectionIds?: string;
  volumeCount?: number;
}

// Cache the database connection to avoid creating multiple instances
let db: Database.Database | null = null;

/**
 * Get the database connection, initializing it if necessary
 * This is not exported so it can't be called directly as a server action
 */
function getDb(): Database.Database {
  if (!db) {
    try {
      db = new Database(DB_PATH, { verbose: console.log });
      initializeDatabase(db);
    } catch (error) {
      console.error(`Error initializing database at ${DB_PATH}:`, error);
      throw error;
    }
  }
  return db;
}

/**
 * Initialize the database schema if it doesn't exist
 */
function initializeDatabase(database: Database.Database) {
  // Create tables if they don't exist
  database.exec(`
    -- Manga table (stores manga that have been scanned)
    CREATE TABLE IF NOT EXISTS manga (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      volumes INTEGER NOT NULL DEFAULT 0,
      coverImage TEXT,
      addedDate TEXT NOT NULL,
      lastModified TEXT NOT NULL,
      directoryPath TEXT NOT NULL,
      lastScanned TEXT NOT NULL,
      scanStatus TEXT NOT NULL DEFAULT 'pending',
      errorMessage TEXT
    );
    
    -- Volumes table (stores volume information for manga)
    CREATE TABLE IF NOT EXISTS volumes (
      id TEXT PRIMARY KEY,
      mangaId TEXT NOT NULL,
      volumeNumber INTEGER NOT NULL,
      volumeTitle TEXT NOT NULL,
      filePath TEXT NOT NULL,
      coverImage TEXT,
      pageCount INTEGER NOT NULL DEFAULT 0,
      addedDate TEXT NOT NULL,
      lastModified TEXT NOT NULL,
      volumeUuid TEXT NOT NULL,
      previewImages TEXT,
      FOREIGN KEY (mangaId) REFERENCES manga(id) ON DELETE CASCADE
    );

    -- Tags table
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT,
      type TEXT NOT NULL
    );

    -- Collections table
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      coverImage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    -- Collection manga mapping table
    CREATE TABLE IF NOT EXISTS collection_manga (
      collectionId TEXT NOT NULL,
      mangaId TEXT NOT NULL,
      PRIMARY KEY (collectionId, mangaId),
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (mangaId) REFERENCES manga(id) ON DELETE CASCADE
    );

    -- User manga metadata table
    CREATE TABLE IF NOT EXISTS user_manga_metadata (
      id TEXT PRIMARY KEY,
      mangaId TEXT UNIQUE NOT NULL,
      rating REAL,
      progress INTEGER,
      status TEXT,
      notes TEXT,
      favorite INTEGER NOT NULL DEFAULT 0,
      isNsfw INTEGER NOT NULL DEFAULT 0,
      customCover TEXT,
      author TEXT,
      artist TEXT,
      releaseYear INTEGER,
      publisher TEXT,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (mangaId) REFERENCES manga(id) ON DELETE CASCADE
    );

    -- Manga tag mapping table
    CREATE TABLE IF NOT EXISTS manga_tags (
      mangaId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (mangaId, tagId),
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE,
      FOREIGN KEY (mangaId) REFERENCES manga(id) ON DELETE CASCADE
    );

    -- Reading history table
    CREATE TABLE IF NOT EXISTS reading_history (
      id TEXT PRIMARY KEY,
      mangaId TEXT NOT NULL,
      volumeId TEXT NOT NULL,
      page INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (mangaId) REFERENCES manga(id) ON DELETE CASCADE,
      FOREIGN KEY (volumeId) REFERENCES volumes(id) ON DELETE CASCADE
    );
    
    -- Settings table (stores application settings)
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      darkMode INTEGER NOT NULL DEFAULT 1,
      invertColors INTEGER NOT NULL DEFAULT 0,
      rightToLeft INTEGER NOT NULL DEFAULT 0,
      hasCover INTEGER NOT NULL DEFAULT 0,
      showTooltips INTEGER NOT NULL DEFAULT 1,
      ankiEnabled INTEGER NOT NULL DEFAULT 1,
      fontSize TEXT NOT NULL DEFAULT 'auto',
      readingMode TEXT NOT NULL DEFAULT 'singlePage',
      animatePageTurns INTEGER NOT NULL DEFAULT 1,
      highlightColor TEXT NOT NULL DEFAULT '#FFD700',
      readerBackground TEXT NOT NULL DEFAULT '#FFFFFF',
      pageMargin INTEGER NOT NULL DEFAULT 20,
      furiganaDisplay TEXT NOT NULL DEFAULT 'hover',
      autoSavePosition INTEGER NOT NULL DEFAULT 1,
      dictionaryProvider TEXT NOT NULL DEFAULT 'jisho',
      customDictionaryUrl TEXT,
      pageNavigationMethod TEXT NOT NULL DEFAULT 'click',
      updatedAt TEXT NOT NULL
    );
  `);

  // Check if we need to add the isNsfw column
  const columns = database
    .prepare("PRAGMA table_info(user_manga_metadata)")
    .all() as { name: string }[];
  const hasIsNsfwColumn = columns.some((col) => col.name === "isNsfw");

  if (!hasIsNsfwColumn) {
    console.log("Adding isNsfw column to user_manga_metadata table");
    database.exec(`
      ALTER TABLE user_manga_metadata ADD COLUMN isNsfw INTEGER NOT NULL DEFAULT 0;
    `);
  }
}

// ========== Tag operations ==========

export async function getTags(): Promise<Tag[]> {
  const database = getDb();
  const tags = database
    .prepare("SELECT * FROM tags ORDER BY name")
    .all() as TagRow[];
  // Convert from TagRow to Tag (handle null to undefined conversion)
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color === null ? undefined : tag.color,
    type: tag.type as "genre" | "content" | "custom",
  }));
}

export async function getTag(id: string): Promise<Tag | null> {
  const database = getDb();
  const tag = database.prepare("SELECT * FROM tags WHERE id = ?").get(id) as
    | TagRow
    | undefined;
  if (!tag) return null;

  // Convert from TagRow to Tag
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color === null ? undefined : tag.color,
    type: tag.type as "genre" | "content" | "custom",
  };
}

export async function createTag(tag: Omit<Tag, "id">): Promise<Tag> {
  const database = getDb();
  const id = nanoid();
  const newTag = { id, ...tag };

  database
    .prepare("INSERT INTO tags (id, name, color, type) VALUES (?, ?, ?, ?)")
    .run(newTag.id, newTag.name, newTag.color || null, newTag.type);

  return newTag;
}

export async function updateTag(
  id: string,
  tag: Partial<Tag>
): Promise<Tag | null> {
  const database = getDb();
  const existingTag = await getTag(id);
  if (!existingTag) return null;

  const updates: string[] = [];
  const params: (string | null)[] = [];

  if (tag.name !== undefined) {
    updates.push("name = ?");
    params.push(tag.name);
  }
  if (tag.color !== undefined) {
    updates.push("color = ?");
    params.push(tag.color || null);
  }
  if (tag.type !== undefined) {
    updates.push("type = ?");
    params.push(tag.type);
  }

  if (updates.length === 0) return existingTag;

  params.push(id);
  database
    .prepare(`UPDATE tags SET ${updates.join(", ")} WHERE id = ?`)
    .run(...params);

  return getTag(id);
}

export async function deleteTag(id: string): Promise<boolean> {
  const database = getDb();
  const result = database.prepare("DELETE FROM tags WHERE id = ?").run(id);
  return result.changes > 0;
}

// ========== Collection operations ==========

export async function getCollections(): Promise<Collection[]> {
  const database = getDb();

  // First, get all collections
  const collections = database
    .prepare("SELECT * FROM collections ORDER BY name")
    .all() as CollectionRow[];

  if (collections.length === 0) {
    return [];
  }

  // Use a single query with JOIN to get all collection-manga associations at once
  const collectionMangaMap = database
    .prepare(
      `
      SELECT collectionId, mangaId 
      FROM collection_manga
    `
    )
    .all() as CollectionMangaRow[];

  // Group manga IDs by collection ID
  const mangaIdsByCollection = new Map<string, string[]>();
  collectionMangaMap.forEach((row) => {
    if (!mangaIdsByCollection.has(row.collectionId)) {
      mangaIdsByCollection.set(row.collectionId, []);
    }
    mangaIdsByCollection.get(row.collectionId)!.push(row.mangaId);
  });

  // Create the collection objects with their manga IDs
  return collections.map(
    (collection) =>
      ({
        ...collection,
        mangaIds: mangaIdsByCollection.get(collection.id) || [],
      } as Collection)
  );
}

export async function getCollection(id: string): Promise<Collection | null> {
  const database = getDb();
  const collection = database
    .prepare("SELECT * FROM collections WHERE id = ?")
    .get(id) as CollectionRow | undefined;

  if (!collection) return null;

  const mangaIds = database
    .prepare("SELECT mangaId FROM collection_manga WHERE collectionId = ?")
    .all(id) as CollectionMangaRow[];

  return {
    ...collection,
    mangaIds: mangaIds.map((row) => row.mangaId),
  } as Collection;
}

export async function createCollection(
  collection: Omit<Collection, "id" | "createdAt" | "updatedAt">
): Promise<Collection> {
  const database = getDb();
  const id = nanoid();
  const now = new Date().toISOString();

  database
    .prepare(
      "INSERT INTO collections (id, name, description, coverImage, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      id,
      collection.name,
      collection.description || null,
      collection.coverImage || null,
      now,
      now
    );

  // Add manga IDs to the collection
  const addMangaStmt = database.prepare(
    "INSERT INTO collection_manga (collectionId, mangaId) VALUES (?, ?)"
  );

  if (collection.mangaIds && collection.mangaIds.length > 0) {
    const insertMany = database.transaction((mangaIds: string[]) => {
      for (const mangaId of mangaIds) {
        addMangaStmt.run(id, mangaId);
      }
    });

    insertMany(collection.mangaIds);
  }

  return {
    id,
    name: collection.name,
    description: collection.description,
    coverImage: collection.coverImage,
    mangaIds: collection.mangaIds || [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCollection(
  id: string,
  collection: Partial<Collection>
): Promise<Collection | null> {
  const database = getDb();
  const existingCollection = await getCollection(id);
  if (!existingCollection) return null;

  const updates: string[] = [];
  const params: (string | null)[] = [];
  const now = new Date().toISOString();

  if (collection.name !== undefined) {
    updates.push("name = ?");
    params.push(collection.name);
  }
  if (collection.description !== undefined) {
    updates.push("description = ?");
    params.push(collection.description || null);
  }
  if (collection.coverImage !== undefined) {
    updates.push("coverImage = ?");
    params.push(collection.coverImage || null);
  }

  updates.push("updatedAt = ?");
  params.push(now);
  params.push(id);

  if (updates.length > 1) {
    // More than just updatedAt
    database
      .prepare(`UPDATE collections SET ${updates.join(", ")} WHERE id = ?`)
      .run(...params);
  }

  // Update manga IDs if provided
  if (collection.mangaIds !== undefined) {
    // Clear existing manga associations
    database
      .prepare("DELETE FROM collection_manga WHERE collectionId = ?")
      .run(id);

    // Add new manga associations
    if (collection.mangaIds.length > 0) {
      const addMangaStmt = database.prepare(
        "INSERT INTO collection_manga (collectionId, mangaId) VALUES (?, ?)"
      );

      const insertMany = database.transaction((mangaIds: string[]) => {
        for (const mangaId of mangaIds) {
          addMangaStmt.run(id, mangaId);
        }
      });

      insertMany(collection.mangaIds);
    }
  }

  return getCollection(id);
}

export async function deleteCollection(id: string): Promise<boolean> {
  const database = getDb();
  const result = database
    .prepare("DELETE FROM collections WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export async function addMangaToCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  try {
    // Check if collection exists
    const collection = await getCollection(collectionId);
    if (!collection) return false;

    // Check if manga is already in collection
    const exists = getDb()
      .prepare(
        "SELECT 1 FROM collection_manga WHERE collectionId = ? AND mangaId = ?"
      )
      .get(collectionId, mangaId);

    if (exists) return true; // Already in collection

    // Add manga to collection
    getDb()
      .prepare(
        "INSERT INTO collection_manga (collectionId, mangaId) VALUES (?, ?)"
      )
      .run(collectionId, mangaId);

    // Update collection updatedAt timestamp
    const now = new Date().toISOString();
    getDb()
      .prepare("UPDATE collections SET updatedAt = ? WHERE id = ?")
      .run(now, collectionId);

    // Log success for debugging
    console.log(`Added manga ${mangaId} to collection ${collectionId}`);

    return true;
  } catch (error) {
    console.error(
      `Error adding manga ${mangaId} to collection ${collectionId}:`,
      error
    );
    return false;
  }
}

export async function removeMangaFromCollection(
  collectionId: string,
  mangaId: string
): Promise<boolean> {
  try {
    const result = getDb()
      .prepare(
        "DELETE FROM collection_manga WHERE collectionId = ? AND mangaId = ?"
      )
      .run(collectionId, mangaId);

    if (result.changes > 0) {
      // Update collection updatedAt timestamp
      const now = new Date().toISOString();
      getDb()
        .prepare("UPDATE collections SET updatedAt = ? WHERE id = ?")
        .run(now, collectionId);
    }

    return result.changes > 0;
  } catch (error) {
    console.error(
      `Error removing manga ${mangaId} from collection ${collectionId}:`,
      error
    );
    return false;
  }
}

// ========== User manga metadata operations ==========

export async function getUserMangaMetadata(
  mangaId: string
): Promise<UserMangaMetadata | null> {
  const database = getDb();

  // Use a transaction to execute all queries and combine data
  const getUserData = database.transaction((id: string) => {
    const metadata = database
      .prepare("SELECT * FROM user_manga_metadata WHERE mangaId = ?")
      .get(id) as UserMangaMetadataRow | undefined;

    if (!metadata) return null;

    // Get tag IDs and collection IDs in a single query each
    const tagIds = database
      .prepare("SELECT tagId FROM manga_tags WHERE mangaId = ?")
      .all(id)
      .map((row) => (row as MangaTagRow).tagId);

    const collectionIds = database
      .prepare("SELECT collectionId FROM collection_manga WHERE mangaId = ?")
      .all(id)
      .map((row) => (row as CollectionMangaRow).collectionId);

    // Combine all data
    return {
      ...metadata,
      favorite: Boolean(metadata.favorite),
      isNsfw: Boolean(metadata.isNsfw),
      tagIds,
      collectionIds,
    } as UserMangaMetadata;
  });

  return getUserData(mangaId);
}

export async function getAllUserMangaMetadata(): Promise<UserMangaMetadata[]> {
  const database = getDb();
  const allMetadata = database
    .prepare("SELECT * FROM user_manga_metadata")
    .all() as UserMangaMetadataRow[];

  return Promise.all(
    allMetadata.map(async (metadata) => {
      // Get tag IDs
      const tagIds = database
        .prepare("SELECT tagId FROM manga_tags WHERE mangaId = ?")
        .all(metadata.mangaId) as MangaTagRow[];

      // Get collection IDs
      const collectionIds = database
        .prepare("SELECT collectionId FROM collection_manga WHERE mangaId = ?")
        .all(metadata.mangaId) as CollectionMangaRow[];

      return {
        ...metadata,
        favorite: Boolean(metadata.favorite),
        isNsfw: Boolean(metadata.isNsfw),
        tagIds: tagIds.map((row) => row.tagId),
        collectionIds: collectionIds.map((row) => row.collectionId),
      } as UserMangaMetadata;
    })
  );
}

export async function updateUserMangaMetadata(
  mangaId: string,
  metadata: Partial<UserMangaMetadata>
): Promise<UserMangaMetadata | null> {
  const database = getDb();
  const now = new Date().toISOString();
  let existingMetadata = await getUserMangaMetadata(mangaId);

  if (!existingMetadata) {
    // Create new metadata record if it doesn't exist
    const id = nanoid();
    database
      .prepare(
        `
      INSERT INTO user_manga_metadata 
      (id, mangaId, favorite, isNsfw, updatedAt) 
      VALUES (?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        mangaId,
        metadata.favorite ? 1 : 0,
        metadata.isNsfw ? 1 : 0,
        now
      );

    existingMetadata = {
      id,
      mangaId,
      favorite: metadata.favorite || false,
      isNsfw: metadata.isNsfw || false,
      tagIds: [],
      collectionIds: [],
      updatedAt: now,
    };
  }

  // Update fields
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (metadata.rating !== undefined) {
    updates.push("rating = ?");
    params.push(metadata.rating);
  }
  if (metadata.progress !== undefined) {
    updates.push("progress = ?");
    params.push(metadata.progress);
  }
  if (metadata.status !== undefined) {
    updates.push("status = ?");
    params.push(metadata.status);
  }
  if (metadata.notes !== undefined) {
    updates.push("notes = ?");
    params.push(metadata.notes);
  }
  if (metadata.favorite !== undefined) {
    updates.push("favorite = ?");
    params.push(metadata.favorite ? 1 : 0);
  }
  if (metadata.isNsfw !== undefined) {
    updates.push("isNsfw = ?");
    params.push(metadata.isNsfw ? 1 : 0);
  }
  if (metadata.customCover !== undefined) {
    updates.push("customCover = ?");
    params.push(metadata.customCover || null);
  }
  if (metadata.author !== undefined) {
    updates.push("author = ?");
    params.push(metadata.author || null);
  }
  if (metadata.artist !== undefined) {
    updates.push("artist = ?");
    params.push(metadata.artist || null);
  }
  if (metadata.releaseYear !== undefined) {
    updates.push("releaseYear = ?");
    params.push(metadata.releaseYear);
  }
  if (metadata.publisher !== undefined) {
    updates.push("publisher = ?");
    params.push(metadata.publisher || null);
  }

  updates.push("updatedAt = ?");
  params.push(now);
  params.push(mangaId);

  if (updates.length > 1) {
    // More than just updatedAt
    database
      .prepare(
        `UPDATE user_manga_metadata SET ${updates.join(", ")} WHERE mangaId = ?`
      )
      .run(...params);
  }

  // Update tags if provided
  if (metadata.tagIds !== undefined) {
    // Clear existing tags
    database.prepare("DELETE FROM manga_tags WHERE mangaId = ?").run(mangaId);

    // Add new tags
    if (metadata.tagIds.length > 0) {
      const addTagStmt = database.prepare(
        "INSERT INTO manga_tags (mangaId, tagId) VALUES (?, ?)"
      );

      const insertMany = database.transaction((tagIds: string[]) => {
        for (const tagId of tagIds) {
          addTagStmt.run(mangaId, tagId);
        }
      });

      insertMany(metadata.tagIds);
    }
  }

  return getUserMangaMetadata(mangaId);
}

// ========== Reading history operations ==========

export async function getReadingHistory(
  mangaId: string
): Promise<ReadingHistoryEntry[]> {
  const database = getDb();
  const history = database
    .prepare(
      "SELECT * FROM reading_history WHERE mangaId = ? ORDER BY timestamp DESC"
    )
    .all(mangaId) as ReadingHistoryRow[];

  return history;
}

export async function addReadingHistoryEntry(
  entry: Omit<ReadingHistoryEntry, "id" | "timestamp">
): Promise<ReadingHistoryEntry> {
  const database = getDb();
  const id = nanoid();
  const timestamp = new Date().toISOString();

  database
    .prepare(
      "INSERT INTO reading_history (id, mangaId, volumeId, page, timestamp) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, entry.mangaId, entry.volumeId, entry.page, timestamp);

  // Update user manga metadata last read time and progress
  const existingMetadata = await getUserMangaMetadata(entry.mangaId);
  if (existingMetadata) {
    await updateUserMangaMetadata(entry.mangaId, {
      updatedAt: timestamp,
    });
  } else {
    // Create basic metadata if it doesn't exist
    await updateUserMangaMetadata(entry.mangaId, {
      favorite: false,
      updatedAt: timestamp,
    });
  }

  return {
    id,
    mangaId: entry.mangaId,
    volumeId: entry.volumeId,
    page: entry.page,
    timestamp,
  };
}

// ========== Combined operations ==========

export async function getMangaWithUserData(
  mangaId: string
): Promise<(MangaMetadata & { userData: UserMangaMetadata | null }) | null> {
  try {
    console.log(
      `getMangaWithUserData: Retrieving data for manga ID ${mangaId}`
    );

    const database = getDb();

    // Use a single JOIN query to get manga with all its related data
    // This is much more efficient than multiple separate queries
    const query = `
      SELECT m.*, 
             um.id as um_id, um.mangaId as um_mangaId, um.rating, um.progress, 
             um.status, um.notes, um.favorite, um.isNsfw, um.customCover, um.author, 
             um.artist, um.releaseYear, um.publisher, um.updatedAt,
             GROUP_CONCAT(DISTINCT mt.tagId) as tagIds,
             GROUP_CONCAT(DISTINCT cm.collectionId) as collectionIds,
             (SELECT COUNT(*) FROM volumes WHERE mangaId = m.id) as volumeCount
      FROM manga m
      LEFT JOIN user_manga_metadata um ON m.id = um.mangaId
      LEFT JOIN manga_tags mt ON m.id = mt.mangaId
      LEFT JOIN collection_manga cm ON m.id = cm.mangaId
      WHERE m.id = ?
      GROUP BY m.id
    `;

    const row = database.prepare(query).get(mangaId) as
      | MangaWithUserDataRow
      | undefined;

    if (!row) {
      console.log(
        `getMangaWithUserData: Manga with ID ${mangaId} not found in database`
      );
      return null;
    }

    console.log(
      `getMangaWithUserData: Found manga "${
        row.title
      }" with ID ${mangaId} and ${row.volumeCount || 0} volumes`
    );

    // Convert the database row to the expected MangaMetadata with userData format
    const result: MangaMetadata & { userData: UserMangaMetadata | null } = {
      id: row.id,
      title: row.title,
      volumes: row.volumes,
      coverImage: row.coverImage,
      addedDate: row.addedDate,
      lastModified: row.lastModified,
      userData: row.um_id
        ? ({
            id: row.um_id,
            mangaId: row.um_mangaId!,
            rating: row.rating || null,
            progress: row.progress || null,
            status: row.status || null,
            notes: row.notes || null,
            favorite: Boolean(row.favorite),
            isNsfw: Boolean(row.isNsfw),
            customCover: row.customCover || null,
            author: row.author || null,
            artist: row.artist || null,
            releaseYear: row.releaseYear || null,
            publisher: row.publisher || null,
            updatedAt: row.updatedAt!,
            tagIds: row.tagIds ? row.tagIds.split(",") : [],
            collectionIds: row.collectionIds
              ? row.collectionIds.split(",")
              : [],
          } as UserMangaMetadata)
        : null,
    };

    console.log(
      `getMangaWithUserData: Retrieved user data for ${mangaId}:`,
      result.userData ? "exists" : "null"
    );

    return result;
  } catch (error) {
    console.error(`Error getting manga with user data for ${mangaId}:`, error);
    return null;
  }
}

export async function getAllMangaWithUserData(): Promise<
  Array<MangaMetadata & { userData: UserMangaMetadata | null }>
> {
  try {
    console.log("getAllMangaWithUserData: Fetching all manga with user data");
    const database = getDb();

    // Use a single efficient JOIN query to get all manga with related data
    // This replaces multiple separate queries with one comprehensive query
    const query = `
      SELECT m.*, 
             um.id as um_id, um.mangaId as um_mangaId, um.rating, um.progress, 
             um.status, um.notes, um.favorite, um.isNsfw, um.customCover, um.author, 
             um.artist, um.releaseYear, um.publisher, um.updatedAt,
             GROUP_CONCAT(DISTINCT mt.tagId) as tagIds,
             GROUP_CONCAT(DISTINCT cm.collectionId) as collectionIds
      FROM manga m
      LEFT JOIN user_manga_metadata um ON m.id = um.mangaId
      LEFT JOIN manga_tags mt ON m.id = mt.mangaId
      LEFT JOIN collection_manga cm ON m.id = cm.mangaId
      GROUP BY m.id
      ORDER BY m.title
    `;

    const rows = database.prepare(query).all() as MangaWithUserDataRow[];

    console.log(
      `getAllMangaWithUserData: Retrieved ${rows.length} manga with related data`
    );

    // Convert rows to the expected format
    const result = rows.map((row) => ({
      id: row.id,
      title: row.title,
      volumes: row.volumes,
      coverImage: row.coverImage,
      addedDate: row.addedDate,
      lastModified: row.lastModified,
      userData: row.um_id
        ? ({
            id: row.um_id,
            mangaId: row.um_mangaId!,
            rating: row.rating || null,
            progress: row.progress || null,
            status: row.status || null,
            notes: row.notes || null,
            favorite: Boolean(row.favorite),
            isNsfw: Boolean(row.isNsfw),
            customCover: row.customCover || null,
            author: row.author || null,
            artist: row.artist || null,
            releaseYear: row.releaseYear || null,
            publisher: row.publisher || null,
            updatedAt: row.updatedAt!,
            tagIds: row.tagIds ? row.tagIds.split(",") : [],
            collectionIds: row.collectionIds
              ? row.collectionIds.split(",")
              : [],
          } as UserMangaMetadata)
        : null,
    }));

    return result;
  } catch (error) {
    console.error("Error getting all manga with user data:", error);
    return [];
  }
}

export async function getMangaByTag(
  tagId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    // Get manga IDs with this tag
    const mangaIds = getDb()
      .prepare("SELECT mangaId FROM manga_tags WHERE tagId = ?")
      .all(tagId) as MangaTagRow[];

    if (mangaIds.length === 0) return [];

    // Get manga with user data for each ID
    const mangaWithData = await Promise.all(
      mangaIds.map((row) => getMangaWithUserData(row.mangaId))
    );

    return mangaWithData.filter(
      (manga): manga is NonNullable<typeof manga> => manga !== null
    );
  } catch (error) {
    console.error(`Error getting manga by tag ${tagId}:`, error);
    return [];
  }
}

export async function getMangaByCollection(
  collectionId: string
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    // Get manga IDs in this collection
    const mangaIds = getDb()
      .prepare("SELECT mangaId FROM collection_manga WHERE collectionId = ?")
      .all(collectionId) as CollectionMangaRow[];

    console.log(
      `Found ${mangaIds.length} manga in collection ${collectionId}:`,
      mangaIds.map((row) => row.mangaId)
    );

    if (mangaIds.length === 0) return [];

    // Get manga with user data for each ID
    const mangaWithData = await Promise.all(
      mangaIds.map((row) => getMangaWithUserData(row.mangaId))
    );

    const result = mangaWithData.filter(
      (manga): manga is NonNullable<typeof manga> => manga !== null
    );

    console.log(
      `Retrieved ${result.length} manga with user data for collection ${collectionId}`
    );

    return result;
  } catch (error) {
    console.error(`Error getting manga by collection ${collectionId}:`, error);
    return [];
  }
}

export async function searchMangaWithFilters(options: {
  query?: string;
  tags?: string[];
  collections?: string[];
  status?: string[];
  favorite?: boolean;
  isNsfw?: boolean;
}): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    console.log(
      "searchMangaWithFilters called with options:",
      JSON.stringify(options, null, 2)
    );

    // If we're filtering by collections, handle that first as the primary filter
    if (options.collections && options.collections.length > 0) {
      return await filterByCollections(options);
    }

    // Otherwise, start with all manga and apply filters
    return await filterByOtherCriteria(options);
  } catch (error) {
    console.error("Error searching manga with filters:", error);
    return [];
  }
}

// Helper function to filter by collections first
async function filterByCollections(options: {
  query?: string;
  tags?: string[];
  collections?: string[];
  status?: string[];
  favorite?: boolean;
  isNsfw?: boolean;
}): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  console.log(`Filtering by collections: ${options.collections?.join(", ")}`);

  try {
    const database = getDb();

    // Get all manga in the specified collections using proper SQL JOIN
    // This replaces the individual queries with a more efficient single query
    const collectionIds = options.collections || [];
    const placeholders = collectionIds.map(() => "?").join(",");

    // Start with a query that gets all manga IDs in the specified collections
    const query = `
      SELECT m.*, cm.collectionId
      FROM manga m
      JOIN collection_manga cm ON m.id = cm.mangaId
      WHERE cm.collectionId IN (${placeholders})
      ORDER BY m.title
    `;

    console.log(
      `Executing query to find manga in collections: ${collectionIds.join(
        ", "
      )}`
    );
    const mangaRows = database
      .prepare(query)
      .all(collectionIds) as (MangaEntityRow & { collectionId: string })[];

    console.log(
      `Found ${mangaRows.length} manga entries in the selected collections`
    );

    if (mangaRows.length === 0) {
      console.log(
        "No manga found in the selected collections, returning empty result"
      );
      return [];
    }

    // Get unique manga IDs (a manga can be in multiple collections)
    const uniqueMangaMap = new Map<string, MangaEntity>();

    // Build MangaEntity objects
    mangaRows.forEach((row) => {
      if (!uniqueMangaMap.has(row.id)) {
        uniqueMangaMap.set(row.id, {
          ...row,
          scanStatus: row.scanStatus as "pending" | "complete" | "error",
          volumes: row.volumes || 0,
          coverImage: row.coverImage || null,
          errorMessage: row.errorMessage || undefined,
        });
      }
    });

    console.log(`Unique manga in selected collections: ${uniqueMangaMap.size}`);

    // Get all user metadata for these manga in a single query
    const mangaIds = Array.from(uniqueMangaMap.keys());
    const metadataPlaceholders = mangaIds.map(() => "?").join(",");

    // Get user metadata, tags, collections in one go for all manga
    const userMetadataQuery = `
      SELECT um.*, 
             GROUP_CONCAT(DISTINCT mt.tagId) as tagIds,
             GROUP_CONCAT(DISTINCT cm.collectionId) as collectionIds
      FROM user_manga_metadata um
      LEFT JOIN manga_tags mt ON um.mangaId = mt.mangaId
      LEFT JOIN collection_manga cm ON um.mangaId = cm.mangaId
      WHERE um.mangaId IN (${metadataPlaceholders})
      GROUP BY um.mangaId
    `;

    const userMetadataRows = database
      .prepare(userMetadataQuery)
      .all(mangaIds) as (UserMangaMetadataRow & {
      tagIds: string | null;
      collectionIds: string | null;
    })[];

    // Map user metadata by manga ID
    const userMetadataMap = new Map<string, UserMangaMetadata>();

    userMetadataRows.forEach((row) => {
      userMetadataMap.set(row.mangaId, {
        ...row,
        favorite: Boolean(row.favorite),
        isNsfw: Boolean(row.isNsfw),
        tagIds: row.tagIds ? row.tagIds.split(",") : [],
        collectionIds: row.collectionIds ? row.collectionIds.split(",") : [],
      } as UserMangaMetadata);
    });

    // Create result objects combining manga data with user metadata
    const result = mangaIds.map((id) => {
      const mangaEntity = uniqueMangaMap.get(id)!;
      return {
        id: mangaEntity.id,
        title: mangaEntity.title,
        volumes: mangaEntity.volumes,
        coverImage: mangaEntity.coverImage,
        addedDate: mangaEntity.addedDate,
        lastModified: mangaEntity.lastModified,
        userData: userMetadataMap.get(id) || null,
      };
    });

    console.log(
      `Final result after collection filtering: ${result.length} manga`
    );

    // Apply other filters if needed
    if (
      options.tags ||
      options.status ||
      options.favorite !== undefined ||
      options.query
    ) {
      return await applyAdditionalFilters(result, options);
    }

    return result;
  } catch (error) {
    console.error("Error in filterByCollections:", error);
    return [];
  }
}

// Helper function for filtering by criteria other than collections
async function filterByOtherCriteria(options: {
  query?: string;
  tags?: string[];
  collections?: string[];
  status?: string[];
  favorite?: boolean;
  isNsfw?: boolean;
}): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  try {
    let filteredManga: Array<
      MangaMetadata & { userData: UserMangaMetadata | null }
    >;

    // Start with title query if provided
    if (options.query) {
      console.log(`Searching by title query: "${options.query}"`);
      const searchResults = await searchManga(options.query);
      console.log(`Title search returned ${searchResults.length} results`);

      const database = getDb();
      const mangaIds = searchResults.map((m) => m.id);

      if (mangaIds.length === 0) {
        return [];
      }

      // Use a single JOIN query to get manga with user data in one go
      const placeholders = mangaIds.map(() => "?").join(",");
      const query = `
        SELECT m.*, 
               um.id as um_id, um.mangaId as um_mangaId, um.rating, um.progress, 
               um.status, um.notes, um.favorite, um.isNsfw, um.customCover, um.author, 
               um.artist, um.releaseYear, um.publisher, um.updatedAt,
               GROUP_CONCAT(DISTINCT mt.tagId) as tagIds,
               GROUP_CONCAT(DISTINCT cm.collectionId) as collectionIds
        FROM manga m
        LEFT JOIN user_manga_metadata um ON m.id = um.mangaId
        LEFT JOIN manga_tags mt ON m.id = mt.mangaId
        LEFT JOIN collection_manga cm ON m.id = cm.mangaId
        WHERE m.id IN (${placeholders})
        GROUP BY m.id
        ORDER BY m.title
      `;

      const rows = database
        .prepare(query)
        .all(mangaIds) as MangaWithUserDataRow[];

      filteredManga = rows.map((row) => ({
        id: row.id,
        title: row.title,
        volumes: row.volumes,
        coverImage: row.coverImage,
        addedDate: row.addedDate,
        lastModified: row.lastModified,
        userData: row.um_id
          ? ({
              id: row.um_id,
              mangaId: row.um_mangaId!,
              rating: row.rating || null,
              progress: row.progress || null,
              status: row.status || null,
              notes: row.notes || null,
              favorite: Boolean(row.favorite),
              isNsfw: Boolean(row.isNsfw),
              customCover: row.customCover || null,
              author: row.author || null,
              artist: row.artist || null,
              releaseYear: row.releaseYear || null,
              publisher: row.publisher || null,
              updatedAt: row.updatedAt!,
              tagIds: row.tagIds ? row.tagIds.split(",") : [],
              collectionIds: row.collectionIds
                ? row.collectionIds.split(",")
                : [],
            } as UserMangaMetadata)
          : null,
      })) as Array<MangaMetadata & { userData: UserMangaMetadata | null }>;

      console.log(`After adding user data, have ${filteredManga.length} manga`);
    } else {
      // Otherwise get all manga with a more efficient query
      console.log("No title query, getting all manga with user data");

      const database = getDb();
      const query = `
        SELECT m.*, 
               um.id as um_id, um.mangaId as um_mangaId, um.rating, um.progress, 
               um.status, um.notes, um.favorite, um.isNsfw, um.customCover, um.author, 
               um.artist, um.releaseYear, um.publisher, um.updatedAt,
               GROUP_CONCAT(DISTINCT mt.tagId) as tagIds,
               GROUP_CONCAT(DISTINCT cm.collectionId) as collectionIds
        FROM manga m
        LEFT JOIN user_manga_metadata um ON m.id = um.mangaId
        LEFT JOIN manga_tags mt ON m.id = mt.mangaId
        LEFT JOIN collection_manga cm ON m.id = cm.mangaId
        GROUP BY m.id
        ORDER BY m.title
      `;

      const rows = database.prepare(query).all() as MangaWithUserDataRow[];

      filteredManga = rows.map((row) => ({
        id: row.id,
        title: row.title,
        volumes: row.volumes,
        coverImage: row.coverImage,
        addedDate: row.addedDate,
        lastModified: row.lastModified,
        userData: row.um_id
          ? ({
              id: row.um_id,
              mangaId: row.um_mangaId!,
              rating: row.rating || null,
              progress: row.progress || null,
              status: row.status || null,
              notes: row.notes || null,
              favorite: Boolean(row.favorite),
              isNsfw: Boolean(row.isNsfw),
              customCover: row.customCover || null,
              author: row.author || null,
              artist: row.artist || null,
              releaseYear: row.releaseYear || null,
              publisher: row.publisher || null,
              updatedAt: row.updatedAt!,
              tagIds: row.tagIds ? row.tagIds.split(",") : [],
              collectionIds: row.collectionIds
                ? row.collectionIds.split(",")
                : [],
            } as UserMangaMetadata)
          : null,
      })) as Array<MangaMetadata & { userData: UserMangaMetadata | null }>;

      console.log(
        `Retrieved ${filteredManga.length} total manga with user data`
      );
    }

    // Apply other filters
    return await applyAdditionalFilters(filteredManga, options);
  } catch (error) {
    console.error("Error in filterByOtherCriteria:", error);
    return [];
  }
}

// Apply tag, status, and favorite filters
async function applyAdditionalFilters(
  manga: Array<MangaMetadata & { userData: UserMangaMetadata | null }>,
  options: {
    query?: string;
    tags?: string[];
    collections?: string[];
    status?: string[];
    favorite?: boolean;
    isNsfw?: boolean;
  }
): Promise<Array<MangaMetadata & { userData: UserMangaMetadata | null }>> {
  let filteredManga = [...manga];

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    console.log(
      `Filtering by ${options.tags.length} tags: ${options.tags.join(", ")}`
    );

    const database = getDb();
    const tagIds = options.tags;
    const mangaIds = manga.map((m) => m.id);

    if (mangaIds.length === 0) {
      return [];
    }

    // Find manga that have ALL the specified tags using a more efficient query
    const placeholders = mangaIds.map(() => "?").join(",");
    const tagPlaceholders = tagIds.map(() => "?").join(",");

    const query = `
      SELECT mt.mangaId
      FROM manga_tags mt
      WHERE mt.mangaId IN (${placeholders})
        AND mt.tagId IN (${tagPlaceholders})
      GROUP BY mt.mangaId
      HAVING COUNT(DISTINCT mt.tagId) = ?
    `;

    // Combine the parameters: first manga IDs, then tag IDs, then the count of tags
    const params = [...mangaIds, ...tagIds, tagIds.length];

    const tagResults = database.prepare(query).all(...params) as {
      mangaId: string;
    }[];
    console.log(`Found ${tagResults.length} manga matching all tags`);

    const tagMangaIds = new Set(tagResults.map((row) => row.mangaId));

    // Filter manga by the IDs that have all tags
    const beforeFilterCount = filteredManga.length;
    filteredManga = filteredManga.filter((manga) => tagMangaIds.has(manga.id));
    console.log(
      `Tag filtering reduced manga from ${beforeFilterCount} to ${filteredManga.length}`
    );
  }

  // Filter by status
  if (options.status && options.status.length > 0) {
    console.log(
      `Filtering by ${options.status.length} statuses: ${options.status.join(
        ", "
      )}`
    );

    const beforeFilterCount = filteredManga.length;
    filteredManga = filteredManga.filter(
      (manga) =>
        manga.userData !== null &&
        manga.userData.status !== undefined &&
        options.status?.includes(manga.userData.status)
    );

    console.log(
      `Status filtering reduced manga from ${beforeFilterCount} to ${filteredManga.length}`
    );
  }

  // Filter by favorite
  if (options.favorite !== undefined) {
    console.log(`Filtering by favorite: ${options.favorite}`);

    const beforeFilterCount = filteredManga.length;
    filteredManga = filteredManga.filter(
      (manga) => manga.userData?.favorite === options.favorite
    );

    console.log(
      `Favorite filtering reduced manga from ${beforeFilterCount} to ${filteredManga.length}`
    );
  }

  // Filter by NSFW
  if (options.isNsfw !== undefined) {
    console.log(`Filtering by NSFW: ${options.isNsfw}`);

    const beforeFilterCount = filteredManga.length;
    filteredManga = filteredManga.filter(
      (manga) => manga.userData?.isNsfw === options.isNsfw
    );

    console.log(
      `NSFW filtering reduced manga from ${beforeFilterCount} to ${filteredManga.length}`
    );
  }

  console.log(`Final result after all filters: ${filteredManga.length} manga`);
  return filteredManga;
}

// ========== Manga operations ==========

export async function getManga(id: string): Promise<MangaEntity | null> {
  const database = getDb();
  const manga = database.prepare("SELECT * FROM manga WHERE id = ?").get(id) as
    | MangaEntityRow
    | undefined;

  if (!manga) return null;

  // Convert from MangaEntityRow to MangaEntity
  return {
    ...manga,
    scanStatus: manga.scanStatus as "pending" | "complete" | "error",
    volumes: manga.volumes || 0,
    coverImage: manga.coverImage || null,
    errorMessage: manga.errorMessage || undefined,
  };
}

export async function getAllManga(): Promise<MangaEntity[]> {
  const database = getDb();
  const manga = database
    .prepare("SELECT * FROM manga ORDER BY title")
    .all() as MangaEntityRow[];

  console.log(`getAllManga: Retrieved ${manga.length} manga from database`);

  // Debug log to check if UminekoEp1 is in the database
  const uminekoManga = manga.find((m) => m.id === "UminekoEp1");
  if (uminekoManga) {
    console.log(`Found UminekoEp1 in database:`, uminekoManga);
  } else {
    console.log(`UminekoEp1 not found in database!`);
  }

  // Convert rows to entities
  return manga.map((row) => ({
    ...row,
    scanStatus: row.scanStatus as "pending" | "complete" | "error",
    volumes: row.volumes || 0,
    coverImage: row.coverImage || null,
    errorMessage: row.errorMessage || undefined,
  }));
}

export async function createManga(manga: MangaEntity): Promise<MangaEntity> {
  const database = getDb();

  database
    .prepare(
      `
    INSERT INTO manga (
      id, title, volumes, coverImage, addedDate, lastModified, 
      directoryPath, lastScanned, scanStatus, errorMessage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      manga.id,
      manga.title,
      manga.volumes,
      manga.coverImage || null,
      manga.addedDate,
      manga.lastModified,
      manga.directoryPath,
      manga.lastScanned,
      manga.scanStatus,
      manga.errorMessage || null
    );

  return manga;
}

export async function updateManga(
  id: string,
  manga: Partial<MangaEntity>
): Promise<MangaEntity | null> {
  const database = getDb();
  const existingManga = await getManga(id);
  if (!existingManga) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (manga.title !== undefined) {
    updates.push("title = ?");
    params.push(manga.title);
  }
  if (manga.volumes !== undefined) {
    updates.push("volumes = ?");
    params.push(manga.volumes);
  }
  if (manga.coverImage !== undefined) {
    updates.push("coverImage = ?");
    params.push(manga.coverImage);
  }
  if (manga.addedDate !== undefined) {
    updates.push("addedDate = ?");
    params.push(manga.addedDate);
  }
  if (manga.lastModified !== undefined) {
    updates.push("lastModified = ?");
    params.push(manga.lastModified);
  }
  if (manga.directoryPath !== undefined) {
    updates.push("directoryPath = ?");
    params.push(manga.directoryPath);
  }
  if (manga.lastScanned !== undefined) {
    updates.push("lastScanned = ?");
    params.push(manga.lastScanned);
  }
  if (manga.scanStatus !== undefined) {
    updates.push("scanStatus = ?");
    params.push(manga.scanStatus);
  }
  if (manga.errorMessage !== undefined) {
    updates.push("errorMessage = ?");
    params.push(manga.errorMessage || null);
  }

  if (updates.length === 0) return existingManga;

  params.push(id);
  database
    .prepare(`UPDATE manga SET ${updates.join(", ")} WHERE id = ?`)
    .run(...params);

  return getManga(id);
}

export async function deleteManga(id: string): Promise<boolean> {
  const database = getDb();
  const result = database.prepare("DELETE FROM manga WHERE id = ?").run(id);
  return result.changes > 0;
}

// ========== Volume operations ==========

export async function getVolume(id: string): Promise<VolumeEntity | null> {
  const database = getDb();
  const volume = database
    .prepare("SELECT * FROM volumes WHERE id = ?")
    .get(id) as VolumeEntityRow | undefined;

  if (!volume) return null;

  // Convert from VolumeEntityRow to VolumeEntity
  return {
    ...volume,
    coverImage: volume.coverImage || null,
    previewImages: volume.previewImages
      ? JSON.parse(volume.previewImages)
      : undefined,
  };
}

export async function getVolumesByMangaId(
  mangaId: string
): Promise<VolumeEntity[]> {
  const database = getDb();

  console.log(`Getting volumes for manga ID ${mangaId} using JOIN query`);

  // Use JOIN with manga table to get volumes in a single query
  // This is more efficient than separate queries
  const volumes = database
    .prepare(
      `
      SELECT v.* FROM volumes v
      JOIN manga m ON v.mangaId = m.id
      WHERE v.mangaId = ?
      ORDER BY v.volumeNumber
    `
    )
    .all(mangaId) as VolumeEntityRow[];

  console.log(`Found ${volumes.length} volumes for manga ${mangaId}`);

  // Convert rows to entities
  return volumes.map((row) => ({
    ...row,
    coverImage: row.coverImage || null,
    previewImages: row.previewImages
      ? JSON.parse(row.previewImages)
      : undefined,
  }));
}

export async function saveVolumes(
  mangaId: string,
  volumes: VolumeEntity[]
): Promise<VolumeEntity[]> {
  const database = getDb();

  // Begin transaction
  const transaction = database.transaction((volumesToSave: VolumeEntity[]) => {
    // Clear existing volumes for this manga
    database.prepare("DELETE FROM volumes WHERE mangaId = ?").run(mangaId);

    // Insert new volumes
    const insertStmt = database.prepare(`
      INSERT INTO volumes (
        id, mangaId, volumeNumber, volumeTitle, filePath, coverImage,
        pageCount, addedDate, lastModified, volumeUuid, previewImages
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const volume of volumesToSave) {
      insertStmt.run(
        volume.id,
        mangaId,
        volume.volumeNumber,
        volume.volumeTitle,
        volume.filePath,
        volume.coverImage || null,
        volume.pageCount,
        volume.addedDate,
        volume.lastModified,
        volume.volumeUuid,
        volume.previewImages ? JSON.stringify(volume.previewImages) : null
      );
    }
  });

  // Execute transaction
  transaction(volumes);

  // Return the saved volumes
  return volumes;
}

export async function updateVolume(
  id: string,
  volume: Partial<VolumeEntity>
): Promise<VolumeEntity | null> {
  const database = getDb();
  const existingVolume = await getVolume(id);
  if (!existingVolume) return null;

  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (volume.volumeNumber !== undefined) {
    updates.push("volumeNumber = ?");
    params.push(volume.volumeNumber);
  }
  if (volume.volumeTitle !== undefined) {
    updates.push("volumeTitle = ?");
    params.push(volume.volumeTitle);
  }
  if (volume.filePath !== undefined) {
    updates.push("filePath = ?");
    params.push(volume.filePath);
  }
  if (volume.coverImage !== undefined) {
    updates.push("coverImage = ?");
    params.push(volume.coverImage);
  }
  if (volume.pageCount !== undefined) {
    updates.push("pageCount = ?");
    params.push(volume.pageCount);
  }
  if (volume.addedDate !== undefined) {
    updates.push("addedDate = ?");
    params.push(volume.addedDate);
  }
  if (volume.lastModified !== undefined) {
    updates.push("lastModified = ?");
    params.push(volume.lastModified);
  }
  if (volume.volumeUuid !== undefined) {
    updates.push("volumeUuid = ?");
    params.push(volume.volumeUuid);
  }
  if (volume.previewImages !== undefined) {
    updates.push("previewImages = ?");
    params.push(
      volume.previewImages ? JSON.stringify(volume.previewImages) : null
    );
  }

  if (updates.length === 0) return existingVolume;

  params.push(id);
  database
    .prepare(`UPDATE volumes SET ${updates.join(", ")} WHERE id = ?`)
    .run(...params);

  return getVolume(id);
}

export async function deleteVolume(id: string): Promise<boolean> {
  const database = getDb();
  const result = database.prepare("DELETE FROM volumes WHERE id = ?").run(id);
  return result.changes > 0;
}

export async function getMangaWithVolumes(
  id: string
): Promise<{ manga: MangaEntity; volumes: VolumeEntity[] } | null> {
  const database = getDb();
  console.log(`getMangaWithVolumes: Retrieving manga and volumes for ID ${id}`);

  // First get the manga
  const manga = database.prepare("SELECT * FROM manga WHERE id = ?").get(id) as
    | MangaEntityRow
    | undefined;

  if (!manga) {
    console.log(`getMangaWithVolumes: No manga found with ID ${id}`);
    return null;
  }

  // Then get all volumes in a single query
  const volumes = database
    .prepare(
      `
      SELECT v.* FROM volumes v
      WHERE v.mangaId = ?
      ORDER BY v.volumeNumber
    `
    )
    .all(id) as VolumeEntityRow[];

  console.log(
    `getMangaWithVolumes: Found ${volumes.length} volumes for manga ${id}`
  );

  // Convert to proper entities
  const mangaEntity: MangaEntity = {
    ...manga,
    scanStatus: manga.scanStatus as "pending" | "complete" | "error",
    volumes: manga.volumes || 0,
    coverImage: manga.coverImage || null,
    errorMessage: manga.errorMessage || undefined,
  };

  const volumeEntities: VolumeEntity[] = volumes.map((row) => ({
    ...row,
    coverImage: row.coverImage || null,
    previewImages: row.previewImages
      ? JSON.parse(row.previewImages)
      : undefined,
  }));

  return {
    manga: mangaEntity,
    volumes: volumeEntities,
  };
}

// ========== Settings operations ==========

export async function getSettings(): Promise<SettingsEntity | null> {
  const database = getDb();
  // Get the first settings record - there should be only one
  const settings = database.prepare("SELECT * FROM settings LIMIT 1").get() as
    | SettingsEntityRow
    | undefined;

  // If no settings exist, return null
  if (!settings) return null;

  // Convert from SettingsEntityRow to SettingsEntity
  return {
    id: settings.id,
    darkMode: Boolean(settings.darkMode),
    invertColors: Boolean(settings.invertColors),
    rightToLeft: Boolean(settings.rightToLeft),
    hasCover: Boolean(settings.hasCover),
    showTooltips: Boolean(settings.showTooltips),
    ankiEnabled: Boolean(settings.ankiEnabled),
    fontSize:
      settings.fontSize === "auto" ? "auto" : parseInt(settings.fontSize, 10),
    readingMode: settings.readingMode as
      | "singlePage"
      | "doublePage"
      | "longStrip",
    animatePageTurns: Boolean(settings.animatePageTurns),
    highlightColor: settings.highlightColor,
    readerBackground: settings.readerBackground,
    pageMargin: settings.pageMargin,
    furiganaDisplay: settings.furiganaDisplay as "always" | "hover" | "never",
    autoSavePosition: Boolean(settings.autoSavePosition),
    dictionaryProvider: settings.dictionaryProvider as
      | "jisho"
      | "google"
      | "custom",
    customDictionaryUrl: settings.customDictionaryUrl,
    pageNavigationMethod: settings.pageNavigationMethod as
      | "click"
      | "tap"
      | "swipe"
      | "arrows",
    updatedAt: settings.updatedAt,
  };
}

export async function updateSettings(
  partialSettings: Partial<SettingsEntity>
): Promise<SettingsEntity> {
  const database = getDb();
  const now = new Date().toISOString();
  const existingSettings = await getSettings();

  // Merge with default settings if no existing settings
  let settings: SettingsEntity;
  if (!existingSettings) {
    // Create new metadata record if it doesn't exist
    const id = nanoid();
    settings = {
      id,
      darkMode: partialSettings.darkMode ?? true,
      invertColors: partialSettings.invertColors ?? false,
      rightToLeft: partialSettings.rightToLeft ?? false,
      hasCover: partialSettings.hasCover ?? false,
      showTooltips: partialSettings.showTooltips ?? true,
      ankiEnabled: partialSettings.ankiEnabled ?? true,
      fontSize: partialSettings.fontSize ?? "auto",
      readingMode: partialSettings.readingMode ?? "singlePage",
      animatePageTurns: partialSettings.animatePageTurns ?? true,
      highlightColor: partialSettings.highlightColor ?? "#FFD700",
      readerBackground: partialSettings.readerBackground ?? "#FFFFFF",
      pageMargin: partialSettings.pageMargin ?? 20,
      furiganaDisplay: partialSettings.furiganaDisplay ?? "hover",
      autoSavePosition: partialSettings.autoSavePosition ?? true,
      dictionaryProvider: partialSettings.dictionaryProvider ?? "jisho",
      customDictionaryUrl: partialSettings.customDictionaryUrl ?? null,
      pageNavigationMethod: partialSettings.pageNavigationMethod ?? "click",
      updatedAt: now,
    };

    // Insert into database as new settings
    database
      .prepare(
        `
      INSERT INTO settings (
        id, darkMode, invertColors, rightToLeft, hasCover,
        showTooltips, ankiEnabled, fontSize, readingMode, animatePageTurns,
        highlightColor, readerBackground, pageMargin, furiganaDisplay,
        autoSavePosition, dictionaryProvider, customDictionaryUrl, pageNavigationMethod,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        settings.id,
        settings.darkMode ? 1 : 0,
        settings.invertColors ? 1 : 0,
        settings.rightToLeft ? 1 : 0,
        settings.hasCover ? 1 : 0,
        settings.showTooltips ? 1 : 0,
        settings.ankiEnabled ? 1 : 0,
        settings.fontSize.toString(),
        settings.readingMode,
        settings.animatePageTurns ? 1 : 0,
        settings.highlightColor,
        settings.readerBackground,
        settings.pageMargin,
        settings.furiganaDisplay,
        settings.autoSavePosition ? 1 : 0,
        settings.dictionaryProvider,
        settings.customDictionaryUrl,
        settings.pageNavigationMethod,
        settings.updatedAt
      );
  } else {
    // Merge existing settings with provided partial settings
    settings = { ...existingSettings };
    let hasUpdates = false;

    // Build SQL update statement
    const updates: string[] = [];
    const params: (string | number | null)[] = []; // Allow null values in params

    if (partialSettings.darkMode !== undefined) {
      updates.push("darkMode = ?");
      params.push(partialSettings.darkMode ? 1 : 0);
      settings.darkMode = partialSettings.darkMode;
      hasUpdates = true;
    }

    if (partialSettings.invertColors !== undefined) {
      updates.push("invertColors = ?");
      params.push(partialSettings.invertColors ? 1 : 0);
      settings.invertColors = partialSettings.invertColors;
      hasUpdates = true;
    }

    if (partialSettings.rightToLeft !== undefined) {
      updates.push("rightToLeft = ?");
      params.push(partialSettings.rightToLeft ? 1 : 0);
      settings.rightToLeft = partialSettings.rightToLeft;
      hasUpdates = true;
    }

    if (partialSettings.hasCover !== undefined) {
      updates.push("hasCover = ?");
      params.push(partialSettings.hasCover ? 1 : 0);
      settings.hasCover = partialSettings.hasCover;
      hasUpdates = true;
    }

    if (partialSettings.showTooltips !== undefined) {
      updates.push("showTooltips = ?");
      params.push(partialSettings.showTooltips ? 1 : 0);
      settings.showTooltips = partialSettings.showTooltips;
      hasUpdates = true;
    }

    if (partialSettings.ankiEnabled !== undefined) {
      updates.push("ankiEnabled = ?");
      params.push(partialSettings.ankiEnabled ? 1 : 0);
      settings.ankiEnabled = partialSettings.ankiEnabled;
      hasUpdates = true;
    }

    if (partialSettings.fontSize !== undefined) {
      updates.push("fontSize = ?");
      params.push(partialSettings.fontSize.toString());
      settings.fontSize = partialSettings.fontSize;
      hasUpdates = true;
    }

    if (partialSettings.readingMode !== undefined) {
      updates.push("readingMode = ?");
      params.push(partialSettings.readingMode);
      settings.readingMode = partialSettings.readingMode;
      hasUpdates = true;
    }

    if (partialSettings.animatePageTurns !== undefined) {
      updates.push("animatePageTurns = ?");
      params.push(partialSettings.animatePageTurns ? 1 : 0);
      settings.animatePageTurns = Boolean(partialSettings.animatePageTurns);
      hasUpdates = true;
    }

    if (partialSettings.highlightColor !== undefined) {
      updates.push("highlightColor = ?");
      params.push(partialSettings.highlightColor);
      settings.highlightColor = partialSettings.highlightColor;
      hasUpdates = true;
    }

    if (partialSettings.readerBackground !== undefined) {
      updates.push("readerBackground = ?");
      params.push(partialSettings.readerBackground);
      settings.readerBackground = partialSettings.readerBackground;
      hasUpdates = true;
    }

    if (partialSettings.pageMargin !== undefined) {
      updates.push("pageMargin = ?");
      params.push(partialSettings.pageMargin);
      settings.pageMargin = partialSettings.pageMargin;
      hasUpdates = true;
    }

    if (partialSettings.furiganaDisplay !== undefined) {
      updates.push("furiganaDisplay = ?");
      params.push(partialSettings.furiganaDisplay);
      settings.furiganaDisplay = partialSettings.furiganaDisplay;
      hasUpdates = true;
    }

    if (partialSettings.autoSavePosition !== undefined) {
      updates.push("autoSavePosition = ?");
      params.push(partialSettings.autoSavePosition ? 1 : 0);
      settings.autoSavePosition = Boolean(partialSettings.autoSavePosition);
      hasUpdates = true;
    }

    if (partialSettings.dictionaryProvider !== undefined) {
      updates.push("dictionaryProvider = ?");
      params.push(partialSettings.dictionaryProvider);
      settings.dictionaryProvider = partialSettings.dictionaryProvider;
      hasUpdates = true;
    }

    if (partialSettings.customDictionaryUrl !== undefined) {
      updates.push("customDictionaryUrl = ?");
      params.push(partialSettings.customDictionaryUrl || null);
      settings.customDictionaryUrl = partialSettings.customDictionaryUrl;
      hasUpdates = true;
    }

    if (partialSettings.pageNavigationMethod !== undefined) {
      updates.push("pageNavigationMethod = ?");
      params.push(partialSettings.pageNavigationMethod);
      settings.pageNavigationMethod = partialSettings.pageNavigationMethod;
      hasUpdates = true;
    }

    // Only update if changes were made
    if (hasUpdates) {
      updates.push("updatedAt = ?");
      params.push(now);
      settings.updatedAt = now;

      params.push(settings.id);
      database
        .prepare(
          `
        UPDATE settings SET ${updates.join(", ")} WHERE id = ?
      `
        )
        .run(...params);
    }
  }

  return settings;
}
