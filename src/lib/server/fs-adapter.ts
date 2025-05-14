"use server";

/**
 * This file contains server-only functions for file system operations
 * It's marked with 'use server' to ensure it's never executed on the client
 */

export interface DirEntry {
  name: string;
  isDirectory: () => boolean;
}

/**
 * Read a directory
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  try {
    const fs = await import("fs/promises");
    return fs.readdir(dirPath);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Read a directory with file type information
 */
export async function readDirectoryWithFileTypes(
  dirPath: string
): Promise<DirEntry[]> {
  try {
    const fs = await import("fs/promises");
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries as unknown as DirEntry[];
  } catch (error) {
    console.error(`Error reading directory ${dirPath} with file types:`, error);
    return [];
  }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch (error) {
    console.error(`Error checking if ${path} is a directory:`, error);
    return false;
  }
}

/**
 * Read a file
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const fs = await import("fs/promises");
    return fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error; // Re-throw to let callers handle file read errors
  }
}

/**
 * Join path segments
 * Ensures any URL-encoded path segments are properly decoded for filesystem access
 */
export async function joinPath(...segments: string[]): Promise<string> {
  try {
    const path = await import("path");

    // Decode any URL-encoded segments before joining
    const decodedSegments = segments.map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        // If decoding fails, use the original segment
        return segment;
      }
    });

    return path.join(...decodedSegments);
  } catch (error) {
    console.error("Error joining path segments:", error);
    // Fallback implementation if path module fails to load
    return segments.join("/").replace(/\/+/g, "/");
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  mtime: Date; // Modification time
  ctime: Date; // Creation time (or status change time)
  birthtime: Date; // Creation time (only on certain file systems)
}> {
  try {
    const fs = await import("fs/promises");
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
      ctime: stats.ctime,
      birthtime: stats.birthtime,
    };
  } catch (error) {
    console.error(`Error getting stats for ${filePath}:`, error);
    throw error;
  }
}
