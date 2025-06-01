"use client";

import { OfflineManager } from "@/components/pwa/OfflineManager";
import { SimpleEpubReader } from "@/components/reader/epub/SimpleEpubReader";
import { useEpubFileUrl } from "@/hooks/use-content";
import {
    useLatestReadingHistory,
    useUpdateReadingHistory,
} from "@/hooks/use-manga-reader";
import { Volume } from "@prisma/client";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

interface EpubReaderContainerProps {
    contentId: string;
    volume: Volume;
    volumes: Volume[];
    initialTimestamp?: number; // Made optional since we don't use it
}

export default function EpubReaderContainer({
    contentId,
    volume,
}: EpubReaderContainerProps) {
    const [epubData, setEpubData] =
        useState<ArrayBuffer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPosition, setCurrentPosition] =
        useState(0);
    const [lastSavedPosition, setLastSavedPosition] =
        useState(0);
    const [initialPosition, setInitialPosition] =
        useState(0);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(
        null
    );

    // Fetch the EPUB file URL
    const { data: epubUrl } = useEpubFileUrl(
        contentId,
        volume.volumeNumber
    );

    // Get latest reading history to set initial position
    const { data: latestHistory } =
        useLatestReadingHistory(contentId);

    // Update reading history mutation
    const { mutate: updateReadingHistory } =
        useUpdateReadingHistory();

    // Set initial position from reading history when available
    useEffect(() => {
        if (
            latestHistory &&
            latestHistory.volumeId === volume.id
        ) {
            setInitialPosition(latestHistory.position);
            setLastSavedPosition(latestHistory.position);
        }
    }, [latestHistory, volume.id]);

    // Function to save reading position
    const saveReadingPosition = useCallback(
        (position: number) => {
            if (position !== lastSavedPosition) {
                updateReadingHistory({
                    contentId,
                    volumeId: volume.id,
                    position,
                });
                setLastSavedPosition(position);
            }
        },
        [
            contentId,
            volume.id,
            updateReadingHistory,
            lastSavedPosition,
        ]
    );

    // Handle position change with debounce
    useEffect(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        if (
            currentPosition > 0 &&
            Math.abs(currentPosition - lastSavedPosition) >
                2
        ) {
            saveTimerRef.current = setTimeout(() => {
                saveReadingPosition(currentPosition);
            }, 2000);
        }

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [
        currentPosition,
        saveReadingPosition,
        lastSavedPosition,
    ]);

    // Fetch the EPUB file when URL is available
    useEffect(() => {
        if (!epubUrl) return;

        const fetchEpub = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(epubUrl);
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch EPUB: ${response.statusText}`
                    );
                }

                const buffer = await response.arrayBuffer();
                setEpubData(buffer);
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching EPUB:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : String(err)
                );
                setIsLoading(false);
            }
        };

        fetchEpub();
    }, [epubUrl]);

    // Save position on unmount
    useEffect(() => {
        return () => {
            if (currentPosition > 0) {
                saveReadingPosition(currentPosition);
            }
        };
    }, [currentPosition, saveReadingPosition]);

    // Handle scroll position changes from the SimpleEpubReader
    const handlePositionChange = useCallback(
        (position: number) => {
            setCurrentPosition(position);
        },
        []
    );

    if (error) {
        return (
            <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
                <div className="max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-xl text-red-500 mb-2">
                        Error Loading EPUB
                    </h2>
                    <p className="text-gray-300">{error}</p>
                </div>
            </div>
        );
    }

    if (isLoading || !epubData) {
        return (
            <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="text-gray-400">
                        Loading EPUB file...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="flex-grow">
                <SimpleEpubReader
                    epubData={epubData}
                    onPositionChange={handlePositionChange}
                    initialPosition={initialPosition}
                />
            </div>
            <div className="sticky bottom-0 left-0 right-0 p-4  flex justify-center z-10">
                <OfflineManager
                    contentId={contentId}
                    contentTitle={
                        volume.volumeTitle || "Light Novel"
                    }
                    contentType="lightnovel"
                    volumeId={volume.id}
                    volumeNumber={volume.volumeNumber}
                    volumeTitle={volume.volumeTitle}
                    coverImage={
                        volume.coverImage || undefined
                    }
                />
            </div>
        </div>
    );
}
