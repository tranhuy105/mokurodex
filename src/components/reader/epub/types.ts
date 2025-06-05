import { RefObject } from "react";

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
    containerRef: RefObject<HTMLDivElement>;
}
