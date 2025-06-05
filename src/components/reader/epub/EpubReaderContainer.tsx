"use client";

import { EpubReader } from "@/components/reader/epub/EpubReader";
import { useEpubFileUrl } from "@/hooks/use-content";
import {
    useLatestReadingHistory,
    useUpdateReadingHistory,
} from "@/hooks/use-manga-reader";
import { Volume } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LoadingOverlay } from "./LoadingOverlay";

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
    const [initialPosition, setInitialPosition] =
        useState(0);

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
            latestHistory.volumeId === volume.id &&
            latestHistory.position > 0
        ) {
            console.log(
                `Setting initial position from history: ${latestHistory.position}%`
            );
            setInitialPosition(latestHistory.position);
        }
    }, [latestHistory, volume.id]);

    // Function to manually save reading position
    const saveReadingPosition = useCallback(() => {
        updateReadingHistory({
            contentId,
            volumeId: volume.id,
            position: currentPosition,
        });

        // Show toast notification
        toast.success("Progress saved!");
    }, [
        contentId,
        volume.id,
        updateReadingHistory,
        currentPosition,
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

    // Handle scroll position changes from the EpubReader
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
            <LoadingOverlay
                isLoading={isLoading}
                title="Preparing EPUB file"
                description="Please wait while we process the EPUB file"
            />
        );
    }

    return (
        <div className="flex flex-col h-screen relative">
            <div className="flex-grow">
                <EpubReader
                    epubData={epubData}
                    onPositionChange={handlePositionChange}
                    initialPosition={initialPosition}
                    saveReadingPosition={
                        saveReadingPosition
                    }
                />
            </div>

            {/* <OfflineManager
                contentId={contentId}
                contentTitle={
                    volume.volumeTitle || "Light Novel"
                }
                contentType="lightnovel"
                volumeId={volume.id}
                volumeNumber={volume.volumeNumber}
                volumeTitle={volume.volumeTitle}
                coverImage={volume.coverImage || undefined}
            /> */}
        </div>
    );
}