import { RefObject } from "react";

// Extend Window interface to include literaReader
declare global {
    interface Window {
        literaReader?: {
            updateProgressBar: () => void;
            toggleSidebar: () => void;
            scrollToChapter: (chapterId: string) => void;
            appendChapter: (
                chapterHtml: string,
                chapterId: string
            ) => void;
            setSpine: (spineData: string[]) => void;
            updateProgressHandle: (
                position: number
            ) => void;
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
    direction: "next" | "prev";
}

// Navigation point in TOC
export interface NavPoint {
    id: string;
    label: string;
    href: string;
    playOrder: number;
    children?: NavPoint[];
}

// TOC structure
export interface TocItem {
    id: string;
    title: string;
    href: string;
    level: number;
    position: number; // Position percentage in the book
    children?: TocItem[];
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
    toc?: TocItem[]; // Table of contents
}

export interface EpubReaderProps {
    epubData: ArrayBuffer;
    onPositionChange?: (position: number) => void;
    initialPosition?: number;
    saveReadingPosition: () => void;
}

export interface ContentRendererProps {
    content: string;
    isLoading: boolean;
    error: string | null;
    containerRef: RefObject<HTMLDivElement | null>;
    saveReadingPosition: () => void;
}
