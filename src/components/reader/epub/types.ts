import { RefObject } from "react";

// Extend Window interface to include literaReader
declare global {
    interface Window {
        literaReader?: {
            updateProgressBar: () => void;
            toggleSidebar: () => void;
            scrollToChapter: (chapterId: string) => void;
            appendChapter: (chapterHtml: string, chapterId: string) => void;
            setSpine: (spineData: string[]) => void;
        };
        _progressTimeout: NodeJS.Timeout;
    }
}

// Event detail types
export interface ChapterNearEndEvent {
    percentage: number;
    currentChapterId: string;
}

export interface LoadChapterEvent {
    chapterId: string;
    direction: 'next' | 'prev';
}

// Common types for EPUB reader components

export interface ManifestItem {
    id: string;
    href: string;
    "media-type": string;
}

export interface EpubImage {
    id: string;
    href: string;
    mediaType: string;
    dataUrl: string;
}

export interface EpubChapter {
    id: string;
    href: string;
    content: string;
}

export interface EpubMetadata {
    title?: string;
    creator?: string;
    publisher?: string;
    language?: string;
}

export interface ParsedEpub {
    metadata: EpubMetadata;
    chapters: EpubChapter[];
    images: Record<string, string>; // path -> dataUrl
    spine: string[]; // chapter IDs in reading order
    manifestMap?: Record<string, ManifestItem>; // Added for dynamic loading
}

export interface EpubReaderProps {
    epubData: ArrayBuffer;
    onPositionChange?: (position: number) => void;
    initialPosition?: number;
}

export interface ContentRendererProps {
    content: string;
    isLoading: boolean;
    error: string | null;
    containerRef: RefObject<HTMLDivElement | null>;
}
