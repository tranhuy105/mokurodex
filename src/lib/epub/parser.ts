import {
    EpubChapter,
    EpubMetadata,
    ManifestItem,
    NavPoint,
    ParsedEpub,
    TocItem,
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

    // Debug manifest
    console.log(
        "Manifest items:",
        manifest.map((item: any) => ({
            id: item.$.id,
            href: item.$.href,
            mediaType: item.$["media-type"],
            properties: item.$.properties,
        }))
    );

    // Find TOC using improved logic
    const tocPath = await findTocPath(
        opfData,
        manifest,
        epubZip,
        basePathPrefix
    );
    console.log("Final TOC path found:", tocPath);

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

    console.log("Spine items:", spineItems);

    const chaptersPromise = processChapters(
        spineItems,
        manifestMap,
        epubZip,
        basePathPrefix,
        signal
    );

    // Extract TOC if available
    let tocItems: TocItem[] = [];
    if (tocPath) {
        try {
            tocItems = await extractToc(
                epubZip,
                tocPath,
                basePathPrefix,
                manifestMap,
                signal
            );
            console.log("Extracted TOC items:", tocItems);
        } catch (err) {
            console.warn("Failed to extract TOC:", err);
        }
    } else {
        console.warn("No TOC path found");
    }

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
        toc: tocItems,
    };
}

/**
 * Find TOC path using multiple methods
 */
async function findTocPath(
    opfData: {
        package: { spine: { $: { toc: string } }[] };
    },
    manifest: {
        $: {
            id: string;
            href: string;
            "media-type": string;
        };
    }[],
    epubZip: JSZip,
    basePathPrefix: string
): Promise<string> {
    let tocPath = "";

    // Method 1: Check spine toc attribute first (most reliable)
    if (
        opfData.package.spine[0].$ &&
        opfData.package.spine[0].$.toc
    ) {
        const tocId = opfData.package.spine[0].$.toc;
        const tocItem = manifest.find(
            (item: any) => item.$.id === tocId
        );
        if (tocItem) {
            tocPath = `${basePathPrefix}${tocItem.$.href}`;
            console.log(
                `Found TOC via spine toc attribute: ${tocPath}`
            );
            return tocPath;
        }
    }

    // Method 2: Look for NCX media type in manifest
    const ncxItem = manifest.find(
        (item: any) =>
            item.$["media-type"] ===
                "application/x-dtbncx+xml" ||
            item.$["media-type"] ===
                "application/dtbncx+xml" ||
            item.$.href.endsWith(".ncx")
    );
    if (ncxItem) {
        tocPath = `${basePathPrefix}${ncxItem.$.href}`;
        console.log(
            `Found TOC via manifest media-type: ${tocPath}`
        );
        return tocPath;
    }

    // Method 3: Look for nav.xhtml (EPUB3 format)
    const navItem = manifest.find(
        (item: any) =>
            (item.$.properties &&
                item.$.properties.includes("nav")) ||
            item.$.href.includes("nav") ||
            item.$.href.includes("toc.xhtml")
    );
    if (navItem) {
        tocPath = `${basePathPrefix}${navItem.$.href}`;
        console.log(
            `Found TOC via nav properties: ${tocPath}`
        );
        return tocPath;
    }

    // Method 4: Try common file names
    const commonTocPaths = [
        `${basePathPrefix}toc.ncx`,
        `${basePathPrefix}TOC.ncx`,
        `${basePathPrefix}nav.xhtml`,
        `${basePathPrefix}toc.xhtml`,
        `${basePathPrefix}navigation.ncx`,
        `${basePathPrefix}ncx/toc.ncx`,
        `toc.ncx`,
        `TOC.ncx`,
        `nav.xhtml`,
        `toc.xhtml`,
        `OEBPS/toc.ncx`,
        `OEBPS/nav.xhtml`,
    ];

    for (const path of commonTocPaths) {
        if (epubZip.file(path)) {
            tocPath = path;
            console.log(
                `Found TOC via common paths: ${tocPath}`
            );
            return tocPath;
        }
    }

    console.warn("No TOC file found");
    return "";
}

/**
 * Extract metadata from the OPF file
 */
function extractMetadata(
    metadataNode: Record<string, unknown>
): EpubMetadata {
    const metadata: EpubMetadata = {};
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

/**
 * Extract the table of contents from TOC file
 */
async function extractToc(
    epubZip: JSZip,
    tocPath: string,
    basePathPrefix: string,
    manifestMap: Record<string, ManifestItem>,
    signal: AbortSignal
): Promise<TocItem[]> {
    const tocContent = await epubZip
        .file(tocPath)
        ?.async("text");
    if (!tocContent) {
        throw new Error("TOC file not found");
    }

    if (signal.aborted) return [];

    // Check if it's an XHTML file (EPUB3 nav)
    if (
        tocPath.endsWith(".xhtml") ||
        tocPath.endsWith(".html")
    ) {
        return await extractEpub3Nav(
            tocContent,
            basePathPrefix
        );
    } else {
        // Assume it's NCX format
        return await extractNcxToc(
            tocContent,
            basePathPrefix,
            manifestMap,
            epubZip
        );
    }
}

/**
 * Extract TOC from NCX format (EPUB2)
 */
async function extractNcxToc(
    ncxContent: string,
    basePathPrefix: string,
    manifestMap: Record<string, ManifestItem>,
    epubZip: JSZip
): Promise<TocItem[]> {
    try {
        const ncxData = await parseStringPromise(
            ncxContent
        );
        console.log(
            "NCX Data structure:",
            JSON.stringify(ncxData, null, 2)
        );

        const navMap = ncxData.ncx?.navMap?.[0];
        if (!navMap || !navMap.navPoint) {
            console.warn(
                "No navMap or navPoint found in NCX"
            );
            return [];
        }

        const navPoints = processNavPoints(navMap.navPoint);
        return await navPointsToTocItems(
            navPoints,
            basePathPrefix,
            0,
            manifestMap,
            epubZip
        );
    } catch (error) {
        console.error("Error parsing NCX:", error);
        return [];
    }
}

/**
 * Extract TOC from EPUB3 nav format
 */
async function extractEpub3Nav(
    navContent: string,
    basePathPrefix: string
): Promise<TocItem[]> {
    try {
        // Parse XHTML content to extract nav elements
        const parser = new DOMParser();
        const doc = parser.parseFromString(
            navContent,
            "text/html"
        );

        // Look for nav element with epub:type="toc"
        const navElement =
            doc.querySelector('nav[epub\\:type="toc"]') ||
            doc.querySelector("nav") ||
            doc.querySelector("ol") ||
            doc.querySelector("ul");

        if (!navElement) {
            console.warn(
                "No navigation element found in EPUB3 nav"
            );
            return [];
        }

        console.log(
            "Found nav element:",
            navElement.outerHTML.substring(0, 200)
        );
        return parseNavElement(navElement, 0);
    } catch (error) {
        console.error("Error parsing EPUB3 nav:", error);
        return [];
    }
}

/**
 * Parse nav element recursively for EPUB3
 */
function parseNavElement(
    element: Element,
    level: number
): TocItem[] {
    const items: TocItem[] = [];
    const children = element.children;

    for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.tagName.toLowerCase() === "li") {
            const link = child.querySelector("a");
            if (link) {
                const tocItem: TocItem = {
                    id:
                        link.getAttribute("id") ||
                        `toc-item-${level}-${i}`,
                    title:
                        link.textContent?.trim() ||
                        "Untitled",
                    href: link.getAttribute("href") || "",
                    level: level,
                    position: (i / children.length) * 100,
                };

                // Look for nested lists
                const nestedList =
                    child.querySelector("ol, ul");
                if (nestedList) {
                    tocItem.children = parseNavElement(
                        nestedList,
                        level + 1
                    );
                }

                items.push(tocItem);
            }
        } else if (
            child.tagName.toLowerCase() === "ol" ||
            child.tagName.toLowerCase() === "ul"
        ) {
            // Direct nested list without li wrapper
            items.push(...parseNavElement(child, level));
        }
    }

    return items;
}

/**
 * Process navigation points recursively for NCX
 */
function processNavPoints(
    navPoints: Array<Record<string, unknown>>
): NavPoint[] {
    console.log("Processing navPoints:", navPoints.length);

    return navPoints.map(
        (point: Record<string, unknown>, index) => {
            console.log(
                `NavPoint ${index}:`,
                JSON.stringify(point, null, 2)
            );

            const navPoint: NavPoint = {
                id: point.$
                    ? (point.$ as Record<string, string>)
                          .id || `nav-${index}`
                    : `nav-${index}`,
                label: extractNavLabel(point),
                href: extractNavHref(point),
                playOrder: extractPlayOrder(point, index),
            };

            // Process children if present
            if (
                point.navPoint &&
                Array.isArray(point.navPoint) &&
                point.navPoint.length > 0
            ) {
                navPoint.children = processNavPoints(
                    point.navPoint as Array<
                        Record<string, unknown>
                    >
                );
            }

            console.log(`Processed navPoint:`, navPoint);
            return navPoint;
        }
    );
}

/**
 * Extract nav label from NCX navPoint
 */
function extractNavLabel(
    point: Record<string, unknown>
): string {
    try {
        if (
            point.navLabel &&
            Array.isArray(point.navLabel) &&
            point.navLabel[0]
        ) {
            const navLabel = point.navLabel[0] as Record<
                string,
                unknown
            >;
            if (
                navLabel.text &&
                Array.isArray(navLabel.text)
            ) {
                return (
                    String(navLabel.text[0]) || "Untitled"
                );
            }
            if (typeof navLabel.text === "string") {
                return navLabel.text;
            }
        }
    } catch (error) {
        console.warn("Error extracting nav label:", error);
    }
    return "Untitled";
}

/**
 * Extract nav href from NCX navPoint
 */
function extractNavHref(
    point: Record<string, unknown>
): string {
    try {
        if (
            point.content &&
            Array.isArray(point.content) &&
            point.content[0]
        ) {
            const content = point.content[0] as Record<
                string,
                unknown
            >;
            if (
                content.$ &&
                typeof content.$ === "object"
            ) {
                const attrs = content.$ as Record<
                    string,
                    string
                >;
                return attrs.src || "";
            }
        }
    } catch (error) {
        console.warn("Error extracting nav href:", error);
    }
    return "";
}

/**
 * Extract play order from NCX navPoint
 */
function extractPlayOrder(
    point: Record<string, unknown>,
    fallbackIndex: number
): number {
    try {
        if (point.$ && typeof point.$ === "object") {
            const attrs = point.$ as Record<string, string>;
            if (attrs.playOrder) {
                return (
                    parseInt(attrs.playOrder, 10) ||
                    fallbackIndex
                );
            }
        }
    } catch (error) {
        console.warn("Error extracting play order:", error);
    }
    return fallbackIndex;
}

/**
 * Convert NavPoints to TocItems with position calculation
 */
async function navPointsToTocItems(
    navPoints: NavPoint[],
    basePathPrefix: string,
    level: number,
    manifestMap: Record<string, ManifestItem>,
    epubZip?: JSZip
): Promise<TocItem[]> {
    // First, let's estimate chapter sizes if possible
    let totalSize = 0;
    const navPointSizes: number[] = [];
    let hasAccurateSizes = false;

    // Try to get file sizes for more accurate position calculation
    if (epubZip && Object.keys(manifestMap).length > 0) {
        try {
            // Calculate estimated sizes based on file content lengths
            for (const navPoint of navPoints) {
                let size = 1; // Default minimum size

                // Extract the file path from href
                const href = navPoint.href.split("#")[0];

                // Find the file in the zip
                if (href) {
                    // Try different possible paths to find the file
                    const possiblePaths = [
                        href,
                        `${basePathPrefix}${href}`,
                        href.replace(/^\//, ""),
                        `OEBPS/${href}`,
                    ];

                    let fileContent: Promise<string> | null =
                        null;
                    for (const path of possiblePaths) {
                        const file = epubZip.file(path);
                        if (file) {
                            try {
                                fileContent =
                                    file.async("string");
                                break;
                            } catch (e: unknown) {
                                const error =
                                    e instanceof Error
                                        ? e
                                        : new Error(
                                              String(e)
                                          );
                                console.error(
                                    `Error reading file ${path}:`,
                                    error
                                );
                            }
                        }
                    }

                    if (fileContent) {
                        // Use content length as a size approximation
                        const content = await fileContent;
                        size = content.length;
                        hasAccurateSizes = true;
                    }
                }

                navPointSizes.push(size);
                totalSize += size;
            }
        } catch (error: unknown) {
            const err =
                error instanceof Error
                    ? error
                    : new Error(String(error));
            console.warn(
                "Error calculating chapter sizes:",
                err
            );
            // Fall back to index-based positioning
            hasAccurateSizes = false;
        }
    }

    // If we couldn't get accurate sizes, use fallback method with weighted positions
    if (!hasAccurateSizes) {
        // Use weighted positions based on index but with exponential weighting
        // to simulate varying chapter lengths
        totalSize = 0;
        navPointSizes.length = 0;

        for (let i = 0; i < navPoints.length; i++) {
            // Create varied sizes using a weighted random distribution
            // Lower indices (front matter) tend to be smaller, middle chapters bigger
            let weight = 1;

            if (i === 0) {
                // First item (often copyright/title) is small
                weight = 0.5;
            } else if (i < navPoints.length * 0.1) {
                // Front matter (first 10% of items) is smaller
                weight = 0.7;
            } else if (i > navPoints.length * 0.9) {
                // Back matter (last 10% of items) is smaller
                weight = 0.8;
            } else {
                // Middle chapters vary in size
                // Create a bell curve peaking in the middle
                const normalizedPos = i / navPoints.length;
                weight =
                    1 +
                    Math.sin(normalizedPos * Math.PI) * 0.5;
            }

            const size = Math.max(
                1,
                Math.round(weight * 10)
            );
            navPointSizes.push(size);
            totalSize += size;
        }
    }

    // Now calculate positions based on sizes
    let runningPercentage = 0;

    const tocItems = await Promise.all(
        navPoints.map(async (navPoint, index) => {
            // Extract the fragment identifier if present
            let href = navPoint.href;
            let fragment = "";

            if (href.includes("#")) {
                const parts = href.split("#");
                href = parts[0];
                fragment = parts[1];
            }

            // Resolve relative paths if needed
            if (href.startsWith("../")) {
                // Get the path components
                const parts = href.split("/");
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
                    Math.max(
                        0,
                        basePathParts.length - upCount
                    )
                );

                // Remove all '../' parts from the path
                const remainingParts = parts.filter(
                    (p) => p !== ".."
                );

                // Construct the resolved path
                href = [
                    ...newBasePath,
                    ...remainingParts,
                    fileName,
                ].join("/");
            }

            // Calculate position based on chapter size
            const sizePercentage =
                (navPointSizes[index] / totalSize) * 100;
            const position = Math.min(
                100,
                runningPercentage
            );

            // Update running percentage for next item
            runningPercentage += sizePercentage;

            const tocItem: TocItem = {
                id: navPoint.id,
                title: navPoint.label,
                href:
                    href + (fragment ? `#${fragment}` : ""),
                level,
                position,
            };

            // Process children if present
            if (
                navPoint.children &&
                navPoint.children.length > 0
            ) {
                tocItem.children =
                    await navPointsToTocItems(
                        navPoint.children,
                        basePathPrefix,
                        level + 1,
                        manifestMap,
                        epubZip
                    );
            }

            return tocItem;
        })
    );

    return tocItems;
}