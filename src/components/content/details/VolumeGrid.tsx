"use client";

import { Button } from "@/components/ui/button";
import { useReadingHistory } from "@/hooks/use-content-management";
import { cn } from "@/lib/utils";
import {
    ContentType,
    ReadingHistory,
    Volume,
} from "@/types/content";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Eye,
    EyeOff,
    Grid2X2,
    LayoutList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { VolumeCard } from "./VolumeCard";

interface VolumeGridProps {
    volumes: Volume[];
    contentId: string;
    contentType: ContentType;
    showReadingHistory?: boolean;
    isNsfw?: boolean;
}

export function VolumeGrid({
    volumes,
    contentId,
    contentType,
    showReadingHistory = false,
    isNsfw = false,
}: VolumeGridProps) {
    const [sortOrder, setSortOrder] = useState<
        "asc" | "desc"
    >("asc");
    const [readingHistoryMap, setReadingHistoryMap] =
        useState<Map<string, ReadingHistory>>(new Map());
    const [isNsfwRevealed, setIsNsfwRevealed] =
        useState(false);
    const [viewMode, setViewMode] = useState<
        "grid" | "list"
    >("grid");

    // Fetch reading history using the hook
    const { data: readingHistory } =
        useReadingHistory(contentId);

    // Map reading history to volumes
    useEffect(() => {
        if (readingHistory && showReadingHistory) {
            const historyMap = new Map();
            readingHistory.forEach((history) => {
                historyMap.set(history.volumeId, history);
            });
            setReadingHistoryMap(historyMap);
        }
    }, [readingHistory, showReadingHistory]);

    // Sort volumes based on current sort order
    const sortedVolumes = [...volumes].sort((a, b) => {
        const volA = a.volumeNumber || 0;
        const volB = b.volumeNumber || 0;
        return sortOrder === "asc"
            ? volA - volB
            : volB - volA;
    });

    return (
        <div className="space-y-6">
            {/* NSFW warning banner */}
            {isNsfw && !isNsfwRevealed && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-200 dark:bg-amber-800 rounded-full p-1.5">
                            <EyeOff className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                        </div>
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            This content is marked as NSFW.
                            Images are blurred for privacy.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setIsNsfwRevealed(true)
                        }
                        className="border-amber-300 dark:border-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Show Content
                    </Button>
                </div>
            )}

            {/* Controls bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setSortOrder(
                                sortOrder === "asc"
                                    ? "desc"
                                    : "asc"
                            )
                        }
                        className="flex items-center gap-1.5"
                    >
                        {sortOrder === "asc" ? (
                            <>
                                <ArrowUpAZ className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Volume
                                </span>{" "}
                                1-{volumes.length}
                            </>
                        ) : (
                            <>
                                <ArrowDownAZ className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Volume
                                </span>{" "}
                                {volumes.length}-1
                            </>
                        )}
                    </Button>

                    {isNsfw && isNsfwRevealed && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setIsNsfwRevealed(false)
                            }
                            className="border-amber-300 dark:border-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                        >
                            <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                            <span className="hidden sm:inline">
                                Hide
                            </span>{" "}
                            NSFW
                        </Button>
                    )}
                </div>

                <div className="inline-flex items-center rounded-md border border-input bg-transparent p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-sm",
                            viewMode === "list" &&
                                "bg-muted"
                        )}
                        onClick={() => setViewMode("list")}
                    >
                        <LayoutList className="h-4 w-4" />
                        <span className="sr-only">
                            List view
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-sm",
                            viewMode === "grid" &&
                                "bg-muted"
                        )}
                        onClick={() => setViewMode("grid")}
                    >
                        <Grid2X2 className="h-4 w-4" />
                        <span className="sr-only">
                            Grid view
                        </span>
                    </Button>
                </div>
            </div>

            {/* Volumes display */}
            <div
                className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "flex flex-col space-y-4"
                )}
            >
                {sortedVolumes.map((volume) => {
                    // Get reading history for this volume if available
                    const history = readingHistoryMap.get(
                        volume.id
                    );

                    return (
                        <VolumeCard
                            key={volume.id}
                            volume={volume}
                            contentId={contentId}
                            contentType={contentType}
                            readingHistory={history || null}
                            isNsfw={isNsfw}
                            isNsfwRevealed={isNsfwRevealed}
                            viewMode={viewMode}
                        />
                    );
                })}
            </div>
        </div>
    );
}
