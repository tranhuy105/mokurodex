"use server";

import * as fs from "fs/promises";
import * as path from "path";
import JSZip from "jszip";
import { parseString } from "xml2js";

export interface EpubMetadata {
  title: string;
  creator?: string;
  publisher?: string;
  language?: string;
  identifier?: string;
  description?: string;
}

export interface EpubExtractResult {
  metadata: EpubMetadata;
  coverImagePath?: string;
}

// Define interfaces for XML parsing
interface ContainerXml {
  container: {
    rootfiles: Array<{
      rootfile: Array<{
        $: {
          "full-path": string;
        };
      }>;
    }>;
  };
}

interface OpfPackage {
  package: {
    metadata: Array<{
      "dc:title"?: Array<string | { _: string }>;
      "dc:creator"?: Array<string | { _: string }>;
      "dc:publisher"?: Array<string | { _: string }>;
      "dc:language"?: Array<string>;
      "dc:identifier"?: Array<string>;
      "dc:description"?: Array<string>;
    }>;
  };
}

/**
 * Extract only metadata and cover image from EPUB file
 * This doesn't extract the entire EPUB to the filesystem
 */
export async function extractEpubMetadata(
  epubFilePath: string,
  coverOutputDir: string
): Promise<EpubExtractResult> {
  try {
    // Create the cover output directory if it doesn't exist
    await fs.mkdir(coverOutputDir, { recursive: true });

    // Read the EPUB file
    const fileData = await fs.readFile(epubFilePath);
    const zip = await JSZip.loadAsync(fileData);

    // Extract basic metadata
    const metadata = await extractBasicMetadata(zip);

    // Extract cover image to the output directory
    const coverImagePath = await extractCoverImage(zip, coverOutputDir);

    return {
      metadata,
      coverImagePath,
    };
  } catch (error) {
    console.error("Error extracting EPUB metadata:", error);
    throw error;
  }
}

/**
 * Extract only essential metadata (no heavy content parsing)
 */
async function extractBasicMetadata(zip: JSZip): Promise<EpubMetadata> {
  try {
    // Parse container.xml to find OPF file
    const containerFile = zip.files["META-INF/container.xml"];
    if (!containerFile) {
      throw new Error("Invalid EPUB: container.xml not found");
    }

    const containerXml = await containerFile.async("text");
    const containerData = await parseXml<ContainerXml>(containerXml);

    const opfPath = extractOpfPath(containerData);
    const opfFile = zip.files[opfPath];

    if (!opfFile) {
      throw new Error(`OPF file not found: ${opfPath}`);
    }

    const opfXml = await opfFile.async("text");
    const opfData = await parseXml<OpfPackage>(opfXml);

    // Extract only basic metadata
    const metadata = opfData.package.metadata[0];

    return {
      title: getTextContent(metadata["dc:title"]?.[0]) || "Unknown Title",
      creator: getTextContent(metadata["dc:creator"]?.[0]),
      publisher: getTextContent(metadata["dc:publisher"]?.[0]),
      language: metadata["dc:language"]?.[0],
      identifier: metadata["dc:identifier"]?.[0],
      description: metadata["dc:description"]?.[0],
    };
  } catch (error) {
    console.warn("Failed to extract metadata:", error);
    return { title: "Unknown Title" };
  }
}

/**
 * Enhanced cover image extraction with multiple fallback strategies
 */
async function extractCoverImage(
  zip: JSZip,
  outputDir: string
): Promise<string | undefined> {
  try {
    // Strategy 1: Look for explicit cover references in OPF metadata
    const coverFromMetadata = await findCoverFromMetadata(zip);
    if (coverFromMetadata && zip.files[coverFromMetadata]) {
      const coverPath = await saveCoverImage(
        zip.files[coverFromMetadata],
        outputDir,
        coverFromMetadata
      );
      if (coverPath) return coverPath;
    }

    // Strategy 2: Look for common cover image naming patterns
    const coverCandidates = Object.keys(zip.files).filter((path) => {
      const lowerPath = path.toLowerCase();
      const fileName = path.split("/").pop()?.toLowerCase() || "";

      return (
        !zip.files[path].dir && // Not a directory
        isImageFile(path) &&
        // Common cover naming patterns
        (lowerPath.includes("cover") ||
          fileName === "cover.jpg" ||
          fileName === "cover.jpeg" ||
          fileName === "cover.png" ||
          fileName === "cover.gif" ||
          fileName === "cover.webp" ||
          fileName.startsWith("cover.") ||
          lowerPath.includes("title") ||
          lowerPath.includes("front") ||
          // Sometimes covers are just named after the book
          fileName.includes("vol") ||
          fileName.includes("volume"))
      );
    });

    // Try the best cover candidates first
    const sortedCandidates = coverCandidates.sort((a, b) => {
      const scoreA = getCoverScore(a);
      const scoreB = getCoverScore(b);
      return scoreB - scoreA; // Higher score first
    });

    for (const coverPath of sortedCandidates) {
      const savedPath = await saveCoverImage(
        zip.files[coverPath],
        outputDir,
        coverPath
      );
      if (savedPath) return savedPath;
    }

    // Strategy 3: Find the first image in common image directories
    const imageDirectories = [
      "images",
      "img",
      "pics",
      "pictures",
      "assets",
      "OEBPS/images",
      "OEBPS/img",
    ];

    for (const dir of imageDirectories) {
      const imagesInDir = Object.keys(zip.files)
        .filter((path) => {
          const normalizedPath = path.toLowerCase();
          return (
            normalizedPath.startsWith(dir.toLowerCase() + "/") &&
            !zip.files[path].dir &&
            isImageFile(path)
          );
        })
        .sort(); // Sort to get consistent "first" image

      if (imagesInDir.length > 0) {
        const savedPath = await saveCoverImage(
          zip.files[imagesInDir[0]],
          outputDir,
          imagesInDir[0]
        );
        if (savedPath) return savedPath;
      }
    }

    // Strategy 4: Find the first image anywhere in the EPUB
    const allImages = Object.keys(zip.files)
      .filter((path) => !zip.files[path].dir && isImageFile(path))
      .sort(); // Sort for consistency

    if (allImages.length > 0) {
      // Prefer images that are likely to be covers based on file size or name
      const likelyCovers = allImages.filter((path) => {
        const fileName = path.split("/").pop()?.toLowerCase() || "";
        return (
          fileName.includes("cover") ||
          fileName.includes("title") ||
          fileName.includes("front") ||
          (!fileName.includes("icon") && // Avoid small icons
            !fileName.includes("bullet") &&
            !fileName.includes("ornament"))
        );
      });

      const imagesToTry = likelyCovers.length > 0 ? likelyCovers : allImages;

      for (const imagePath of imagesToTry) {
        const savedPath = await saveCoverImage(
          zip.files[imagePath],
          outputDir,
          imagePath
        );
        if (savedPath) return savedPath;
      }
    }

    return undefined;
  } catch (error) {
    console.warn("Failed to extract cover image:", error);
    return undefined;
  }
}

/**
 * Look for cover reference in OPF metadata
 */
async function findCoverFromMetadata(zip: JSZip): Promise<string | undefined> {
  try {
    // Parse container.xml to find OPF file
    const containerFile = zip.files["META-INF/container.xml"];
    if (!containerFile) return undefined;

    const containerXml = await containerFile.async("text");
    const containerData = await parseXml<ContainerXml>(containerXml);
    const opfPath = extractOpfPath(containerData);
    const opfFile = zip.files[opfPath];

    if (!opfFile) return undefined;

    const opfXml = await opfFile.async("text");

    // Look for cover references in the OPF file
    // This is a simple regex approach - could be made more robust with full XML parsing
    const coverMatches =
      opfXml.match(/id=["']cover["'][^>]*href=["']([^"']+)["']/i) ||
      opfXml.match(/href=["']([^"']*cover[^"']*)["']/i) ||
      opfXml.match(/<meta name=["']cover["'] content=["']([^"']+)["']/i);

    if (coverMatches && coverMatches[1]) {
      // Resolve relative path from OPF directory
      const opfDir = path.dirname(opfPath);
      return path.posix.join(opfDir, coverMatches[1]).replace(/\\/g, "/");
    }

    return undefined;
  } catch (error) {
    console.warn("Failed to find cover from metadata:", error);
    return undefined;
  }
}

/**
 * Save a cover image to the output directory
 */
async function saveCoverImage(
  file: JSZip.JSZipObject,
  outputDir: string,
  originalPath: string
): Promise<string | undefined> {
  try {
    const coverBuffer = await file.async("nodebuffer");

    // Validate it's actually an image by checking the buffer
    if (!isValidImageBuffer(coverBuffer)) {
      return undefined;
    }

    const originalExtension = path.extname(originalPath);
    const coverFileName = `cover${originalExtension}`;
    const coverOutputPath = path.join(outputDir, coverFileName);

    await fs.writeFile(coverOutputPath, coverBuffer);

    // Return the path to the saved cover image
    return coverOutputPath;
  } catch (error) {
    console.warn("Failed to save cover image:", error);
    return undefined;
  }
}

/**
 * Check if a file path represents an image
 */
function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].includes(
    ext
  );
}

/**
 * Score a potential cover image path (higher score = more likely to be cover)
 */
function getCoverScore(filePath: string): number {
  const lowerPath = filePath.toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();
  let score = 0;

  // Prefer files with "cover" in the name
  if (fileName.includes("cover")) score += 10;
  if (fileName === "cover.jpg" || fileName === "cover.png") score += 15;

  // Other good indicators
  if (fileName.includes("title")) score += 8;
  if (fileName.includes("front")) score += 8;

  // Prefer images in root or images directory
  if (!lowerPath.includes("/") || lowerPath.startsWith("images/")) score += 5;

  // Penalize likely non-cover images
  if (fileName.includes("icon")) score -= 5;
  if (fileName.includes("bullet")) score -= 5;
  if (fileName.includes("ornament")) score -= 5;
  if (fileName.includes("decoration")) score -= 5;

  // Prefer common image formats
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) score += 2;
  if (fileName.endsWith(".png")) score += 2;

  return score;
}

/**
 * Basic validation that a buffer contains image data
 */
function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

  // Check for common image file signatures
  const signatures = [
    [0xff, 0xd8, 0xff], // JPEG
    [0x89, 0x50, 0x4e, 0x47], // PNG
    [0x47, 0x49, 0x46], // GIF
    [0x52, 0x49, 0x46, 0x46], // WebP (starts with RIFF)
    [0x42, 0x4d], // BMP
  ];

  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

// Helper functions
function parseXml<T>(xmlString: string): Promise<T> {
  return new Promise((resolve, reject) => {
    parseString(xmlString, { explicitArray: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result as T);
    });
  });
}

function extractOpfPath(containerData: ContainerXml): string {
  // Handle various container.xml structures
  if (
    containerData.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.["full-path"]
  ) {
    return containerData.container.rootfiles[0].rootfile[0].$["full-path"];
  }
  // Add other fallback patterns as needed
  throw new Error("Could not find OPF path in container.xml");
}

function getTextContent(
  item: string | { _: string } | undefined
): string | undefined {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "_" in item) return item._;
  return undefined;
}
