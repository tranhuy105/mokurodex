import { PageWithTextBlocks } from "@/types/content";
import { Page, Volume } from "@prisma/client";

/**
 * Interface for the reader props to ensure type safety
 */
export interface MangaReaderProps {
    mangaId: string;
    volume: Volume;
    volumes: Volume[];
    pages: PageWithTextBlocks[];
    initialPage: number;
    initialTimestamp: number; // Used to track when the reader was initialized
}

/**
 * Prepares the props for the manga reader component
 */
export function getMangaReaderProps({
    mangaId,
    volume,
    volumes,
    pages,
    initialPage,
}: {
    mangaId: string;
    volume: Volume;
    volumes: Volume[];
    pages: PageWithTextBlocks[];
    initialPage: number;
}): MangaReaderProps {
    return {
        mangaId,
        volume,
        volumes,
        pages,
        initialPage,
        initialTimestamp: 0, // Use fixed value to avoid hydration mismatch, client will set real timestamp
    };
}

/**
 * Utility function to get the correct URL for a manga page
 */
export function getMangaPageUrl(
    mangaId: string,
    volumeId: string,
    pageNumber: number
): string {
    return `/reader/manga/${encodeURIComponent(
        mangaId
    )}/${volumeId}/${pageNumber}`;
}

/**
 * Type-safe event to dispatch when right-to-left reading mode changes
 */
export function dispatchRightToLeftChangedEvent(
    rightToLeft: boolean
): void {
    const event = new CustomEvent("rightToLeftChanged", {
        detail: { rightToLeft },
        bubbles: true,
    });
    window.dispatchEvent(event);
}

/**
 * Handles navigation between pages with proper state management
 */
export function navigateToPage(
    mangaId: string,
    volumeId: string,
    pageNumber: number,
    replace: boolean = false
): void {
    const url = getMangaPageUrl(
        mangaId,
        volumeId,
        pageNumber
    );

    if (replace) {
        window.history.replaceState({ path: url }, "", url);
    } else {
        window.history.pushState({ path: url }, "", url);
    }

    // Dispatch a custom event that components can listen to
    window.dispatchEvent(
        new CustomEvent("mangaPageChanged", {
            detail: { mangaId, volumeId, pageNumber },
            bubbles: true,
        })
    );
}

/**
 * Type guard to check if an object is a valid Page
 */
export function isValidPage(page: unknown): page is Page {
    return (
        page !== null &&
        typeof page === "object" &&
        "id" in (page as object) &&
        "volumeId" in (page as object) &&
        "pageNumber" in (page as object) &&
        "imagePath" in (page as object)
    );
}

/**
 * Parse URL to get manga reader parameters
 */
export function parseMangaReaderUrl(url: string): {
    mangaId: string | null;
    volumeId: string | null;
    page: number | null;
} {
    try {
        // Handle both absolute and relative URLs
        const path = url.includes("://")
            ? new URL(url).pathname
            : url;

        const segments = path.split("/").filter((s) => s);

        if (
            segments.length >= 4 &&
            segments[0] === "manga"
        ) {
            return {
                mangaId: decodeURIComponent(segments[1]),
                volumeId: segments[2],
                page: parseInt(segments[3], 10),
            };
        }

        return {
            mangaId: null,
            volumeId: null,
            page: null,
        };
    } catch (error) {
        console.error(
            "Failed to parse manga reader URL:",
            error
        );
        return {
            mangaId: null,
            volumeId: null,
            page: null,
        };
    }
}

/**
 * Add a listener for history popstate events with proper types
 */
export function addPopStateListener(
    callback: (event: PopStateEvent) => void
): () => void {
    window.addEventListener("popstate", callback);
    return () =>
        window.removeEventListener("popstate", callback);
}

/**
 * Creates a throttled function that delays execution
 */
export function throttle<
    T extends (...args: unknown[]) => unknown
>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: number | null = null;

    return (...args: Parameters<T>) => {
        const now = Date.now();
        const elapsed = now - lastCall;

        if (elapsed >= delay) {
            lastCall = now;
            func(...args);
        } else if (timeoutId === null) {
            timeoutId = window.setTimeout(() => {
                lastCall = Date.now();
                timeoutId = null;
                func(...args);
            }, delay - elapsed);
        }
    };
}
