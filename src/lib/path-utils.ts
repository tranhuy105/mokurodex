/**
 * Converts a filesystem path to a public URL path
 * @param fsPath Path in the filesystem
 * @returns Public URL path
 */
export function fsPathToPublicUrl(fsPath: string): string {
  // Get the path relative to the public/MANGA directory
  const publicPath = fsPath.replace(
    /^\.\/public\/MANGA\/?|^public\/MANGA\/?/,
    ""
  );
  return `/MANGA/${publicPath}`;
}

/**
 * Converts manga, volume, and image into a public URL path
 * Ensures each segment is properly URL-encoded
 */
export function createMangaImageUrl(
  manga: string,
  volume: string,
  image: string
): string {
  // First try to decode each parameter to avoid double-encoding
  try {
    // If these are already encoded URLs, decode first to avoid double-encoding
    const decodedManga = decodeURIComponent(manga);
    const decodedVolume = decodeURIComponent(volume);
    const decodedImage = decodeURIComponent(image);

    // Then encode again to ensure all parts are properly encoded
    return `/MANGA/${encodeURIComponent(decodedManga)}/${encodeURIComponent(
      decodedVolume
    )}/${encodeURIComponent(decodedImage)}`;
  } catch {
    // If decoding fails, encode as-is (this is safer as a fallback)
    console.warn("Failed to decode URL parts for image URL creation", {
      manga,
      volume,
      image,
    });
    return `/MANGA/${encodeURIComponent(manga)}/${encodeURIComponent(
      volume
    )}/${encodeURIComponent(image)}`;
  }
}

/**
 * Properly decodes URL parameters, handling potential double-encoding issues
 * This is especially useful for non-ASCII characters like Japanese text
 */
export function decodeUrlParam(param: string): string {
  let result = param;

  try {
    // Try first decode attempt
    const decoded = decodeURIComponent(param);

    // If it was actually encoded, use the decoded value
    if (decoded !== param) {
      result = decoded;

      // Try a second decode attempt for double-encoded parameters
      try {
        const doubleDecoded = decodeURIComponent(decoded);
        if (doubleDecoded !== decoded) {
          result = doubleDecoded;
        }
      } catch {
        // Ignore errors from second decode attempt
      }
    }
  } catch {
    // If decoding fails, return the original parameter
  }

  return result;
}

/**
 * Safely join and encode URI components
 */
export function joinUrlPath(...segments: string[]): string {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}
