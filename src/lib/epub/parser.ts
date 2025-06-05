import {
    EpubChapter,
    EpubMetadata,
    ManifestItem,
    ParsedEpub,
} from "@/components/reader/epub/types";
import JSZip from "jszip";
import { parseStringPromise } from "xml2js";

/**
 * Parse an EPUB file and extract its contents
 */
export async function parseEpub(
    epubData: ArrayBuffer,
    signal: AbortSignal
): Promise<ParsedEpub> {
    // Load the EPUB file using JSZip
    const zip = new JSZip();
    const epubZip = await zip.loadAsync(epubData);

    // Find and parse container.xml to get the OPF path
    const containerXml = await epubZip
        .file("META-INF/container.xml")
        ?.async("text");

    if (!containerXml) {
        throw new Error(
            "Invalid EPUB: container.xml not found"
        );
    }

    // Parse container.xml to find the OPF path
    const containerData = await parseStringPromise(
        containerXml
    );
    const opfPath =
        containerData.container.rootfiles[0].rootfile[0].$[
            "full-path"
        ];

    // Read the OPF file
    const opfContent = await epubZip
        .file(opfPath)
        ?.async("text");
    if (!opfContent) {
        throw new Error("Invalid EPUB: OPF file not found");
    }

    if (signal.aborted) return createDefaultParsedEpub();

    // Parse the OPF file
    const opfData = await parseStringPromise(opfContent);
    const manifest = opfData.package.manifest[0].item;
    const spine = opfData.package.spine[0].itemref;

    // Extract metadata
    const metadata = extractMetadata(
        opfData.package.metadata[0]
    );

    // Get the base directory for resolving relative paths
    const basePath = opfPath
        .split("/")
        .slice(0, -1)
        .join("/");
    const basePathPrefix = basePath ? `${basePath}/` : "";

    // Create a map of all manifest items
    const manifestMap = manifest.reduce(
        (
            acc: Record<string, ManifestItem>,
            item: { $: ManifestItem }
        ) => {
            acc[item.$.id] = item.$;
            return acc;
        },
        {}
    );

    // Process images and chapters in parallel
    const imagePromise = processImages(
        manifest,
        epubZip,
        basePathPrefix,
        signal
    );

    const spineItems = spine.map(
        (item: { $: { idref: string } }) => item.$.idref
    );

    const chaptersPromise = processChapters(
        spineItems,
        manifestMap,
        epubZip,
        basePathPrefix,
        signal
    );

    // Wait for both promises to resolve
    const [images, chapters] = await Promise.all([
        imagePromise,
        chaptersPromise,
    ]);

    return {
        metadata,
        chapters,
        images,
        spine: spineItems,
        manifestMap,
    };
}

/**
 * Extract metadata from the OPF file
 */
function extractMetadata(
    metadataNode: Record<string, unknown>
): EpubMetadata {
    const metadata: EpubMetadata = {};

    console.log("metadataNode", metadataNode);

    // Extract title from dc:title
    if (
        metadataNode["dc:title"] &&
        Array.isArray(metadataNode["dc:title"]) &&
        metadataNode["dc:title"][0]
    ) {
        const titleObj = metadataNode["dc:title"][0] as {
            _: string;
        };
        metadata.title = titleObj._;
    }

    // Extract creator from dc:creator
    if (
        metadataNode["dc:creator"] &&
        Array.isArray(metadataNode["dc:creator"]) &&
        metadataNode["dc:creator"][0]
    ) {
        const creatorObj = metadataNode[
            "dc:creator"
        ][0] as { _: string };
        metadata.creator = creatorObj._;
    }

    // Extract publisher from dc:publisher
    if (
        metadataNode["dc:publisher"] &&
        Array.isArray(metadataNode["dc:publisher"]) &&
        metadataNode["dc:publisher"][0]
    ) {
        const publisherObj = metadataNode[
            "dc:publisher"
        ][0] as { _: string };
        metadata.publisher = publisherObj._;
    }

    // Extract language from dc:language
    if (
        metadataNode["dc:language"] &&
        Array.isArray(metadataNode["dc:language"]) &&
        metadataNode["dc:language"][0]
    ) {
        // Language seems to be stored directly as string in the array
        metadata.language = metadataNode[
            "dc:language"
        ][0] as string;
    }

    return metadata;
}

/**
 * Process all images in the EPUB
 */
async function processImages(
    manifest: Array<{ $: ManifestItem }>,
    epubZip: JSZip,
    basePathPrefix: string,
    signal: AbortSignal
): Promise<Record<string, string>> {
    const imageMap: Record<string, string> = {};

    // Find all image items in the manifest
    const imageItems = manifest.filter(
        (item: { $: ManifestItem }) => {
            return (
                item.$ &&
                item.$["media-type"] &&
                item.$["media-type"].startsWith("image/")
            );
        }
    );

    // Process images in batches for better performance
    const BATCH_SIZE = 5;

    for (
        let i = 0;
        i < imageItems.length;
        i += BATCH_SIZE
    ) {
        if (signal.aborted) break;

        const batch = imageItems.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(
            async (itemObj: { $: ManifestItem }) => {
                const item = itemObj.$;
                try {
                    // Process an individual image
                    const result = await processImage(
                        item,
                        epubZip,
                        basePathPrefix
                    );

                    // Add all paths to the image map
                    Object.entries(result).forEach(
                        ([path, dataUrl]) => {
                            imageMap[path] = dataUrl;
                        }
                    );
                } catch (err) {
                    console.warn(
                        `Failed to process image: ${item.href}`,
                        err
                    );
                }
            }
        );

        await Promise.all(batchPromises);

        // Add yield point for better responsiveness
        await new Promise((resolve) =>
            setTimeout(resolve, 0)
        );
    }

    return imageMap;
}

/**
 * Process a single image from the EPUB
 */
async function processImage(
    item: ManifestItem,
    epubZip: JSZip,
    basePathPrefix: string
): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    // Normalize the image path
    const imagePath = `${basePathPrefix}${item.href}`;

    // Handle relative paths in image href
    let resolvedPath = item.href;
    if (item.href.includes("../")) {
        const parts = item.href.split("/");
        const fileName = parts.pop() || "";

        // Count how many levels up we need to go
        let upCount = 0;
        for (const part of parts) {
            if (part === "..") upCount++;
        }

        // Get base directory parts
        const basePathParts = basePathPrefix
            .split("/")
            .filter((p) => p);

        // Go up the required number of levels
        const newBasePath = basePathParts.slice(
            0,
            Math.max(0, basePathParts.length - upCount)
        );

        // Remove all '../' parts from the path
        const remainingParts = parts.filter(
            (p) => p !== ".."
        );

        // Construct the resolved path
        resolvedPath = [
            ...newBasePath,
            ...remainingParts,
            fileName,
        ].join("/");
    }

    // Generate a list of possible paths for this image
    const fileName = item.href.split("/").pop() || "";
    const possiblePaths = [
        imagePath,
        imagePath.replace(/^\//, ""),
        `OEBPS/${item.href}`,
        item.href,
        resolvedPath,
        fileName,
        `images/${fileName}`,
        `Images/${fileName}`,
        `OEBPS/images/${fileName}`,
        `OEBPS/Images/${fileName}`,
        `OEBPS/${fileName}`,
        `${basePathPrefix}images/${fileName}`,
        `${basePathPrefix}Images/${fileName}`,
    ];

    let imageFile = null;
    let foundPath = null;

    // Try each possible path
    for (const path of possiblePaths) {
        imageFile = epubZip.file(path);
        if (imageFile) {
            foundPath = path;
            break;
        }
    }

    if (imageFile) {
        const imageData = await imageFile.async("base64");
        const mimeType = item["media-type"] || "image/jpeg";
        const dataUrl = `data:${mimeType};base64,${imageData}`;

        // Store image with all possible paths for better lookup
        for (const path of possiblePaths) {
            result[path] = dataUrl;
        }

        // If this is the path that worked, log it
        if (foundPath) {
            console.log(
                `Image found at: ${foundPath} (original href: ${item.href})`
            );
        }
    } else {
        console.warn(
            `Failed to find image: ${item.href} (tried ${possiblePaths.length} paths)`
        );
    }

    return result;
}

/**
 * Process all chapters in the EPUB
 */
async function processChapters(
    spineItems: string[],
    manifestMap: Record<string, ManifestItem>,
    epubZip: JSZip,
    basePathPrefix: string,
    signal: AbortSignal
): Promise<EpubChapter[]> {
    const chapters: EpubChapter[] = [];

    // Process chapters in batches for better performance
    const BATCH_SIZE = 3;

    for (
        let i = 0;
        i < spineItems.length;
        i += BATCH_SIZE
    ) {
        if (signal.aborted) break;

        const batchItems = spineItems.slice(
            i,
            i + BATCH_SIZE
        );
        const batchChapters = await Promise.all(
            batchItems.map(async (itemId: string) => {
                const item = manifestMap[itemId];
                if (!item || !item.href) return null;

                // Get the chapter content
                const chapterPath = `${basePathPrefix}${item.href}`;
                const chapterContent =
                    (await epubZip
                        .file(chapterPath)
                        ?.async("text")) || "";

                if (!chapterContent) return null;

                return {
                    id: item.id,
                    href: item.href,
                    content: chapterContent,
                };
            })
        );

        // Add valid chapters to our array
        chapters.push(
            ...(batchChapters.filter(
                Boolean
            ) as EpubChapter[])
        );

        // Add yield point for better responsiveness
        await new Promise((resolve) =>
            setTimeout(resolve, 0)
        );
    }

    return chapters;
}

/**
 * Return a default empty ParsedEpub object
 */
function createDefaultParsedEpub(): ParsedEpub {
    return {
        metadata: {},
        chapters: [],
        images: {},
        spine: [],
    };
}

/**
 * Load a single chapter on demand
 * Used for dynamically loading chapters as needed
 */
export async function loadChapterById(
    epubZip: JSZip,
    chapterId: string,
    manifestMap: Record<string, ManifestItem>,
    basePathPrefix: string
): Promise<EpubChapter | null> {
    const item = manifestMap[chapterId];
    if (!item || !item.href) return null;

    // Get the chapter content
    const chapterPath = `${basePathPrefix}${item.href}`;
    try {
        const chapterContent =
            (await epubZip
                .file(chapterPath)
                ?.async("text")) || "";

        if (!chapterContent) return null;

        return {
            id: item.id,
            href: item.href,
            content: chapterContent,
        };
    } catch (error) {
        console.error(
            `Failed to load chapter ${chapterId}:`,
            error
        );
        return null;
    }
}

/**
 * Get the next chapter ID from the spine
 */
export function getNextChapterId(
    currentChapterId: string,
    spine: string[]
): string | null {
    const currentIndex = spine.indexOf(currentChapterId);
    if (
        currentIndex === -1 ||
        currentIndex === spine.length - 1
    ) {
        return null;
    }
    return spine[currentIndex + 1];
}

/**
 * Get the previous chapter ID from the spine
 */
export function getPreviousChapterId(
    currentChapterId: string,
    spine: string[]
): string | null {
    const currentIndex = spine.indexOf(currentChapterId);
    if (currentIndex <= 0) {
        return null;
    }
    return spine[currentIndex - 1];
}
