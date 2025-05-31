"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAllContentWithUserData } from "@/hooks/use-content-management";
import {
    ContentWithUserData,
    ReadingHistory,
} from "@/types/content";
import { Book, BookOpen, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ContinueReadingProps {
    limit?: number;
    showHeader?: boolean;
}

export function ContinueReading({
    limit = 3,
    showHeader = true,
}: ContinueReadingProps) {
    const { data: contentList = [], isLoading } =
        useAllContentWithUserData();
    const [continuableContent, setContinuableContent] =
        useState<ContentWithUserData[]>([]);

    useEffect(() => {
        if (!contentList.length) return;

        // Filter content that has reading history
        const withHistory = contentList.filter(
            (content) =>
                content.readingHistory &&
                content.readingHistory.length > 0
        );

        // Sort by most recently read
        const sorted = [...withHistory].sort((a, b) => {
            const aHistory = a.readingHistory?.[0];
            const bHistory = b.readingHistory?.[0];

            if (!aHistory || !bHistory) return 0;

            return (
                new Date(bHistory.timestamp).getTime() -
                new Date(aHistory.timestamp).getTime()
            );
        });

        // Take only the requested number of items
        setContinuableContent(sorted.slice(0, limit));
    }, [contentList, limit]);

    // Render skeleton loading state
    if (isLoading) {
        return (
            <div className="space-y-5">
                {showHeader && (
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 flex"
                        >
                            <Skeleton className="w-20 h-28 rounded-md" />
                            <div className="ml-4 flex-1 space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-6 w-32 mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Don't render anything if no content with reading history
    if (continuableContent.length === 0) {
        return null;
    }

    // Determine the appropriate href based on content type
    const getReaderHref = (
        content: ContentWithUserData
    ) => {
        const history = content.readingHistory?.[0];

        // If no history, go to content page
        if (!history) return `/content/${content.id}`;

        const volume = content.contentVolumes?.find(
            (vol) => vol.id === history.volumeId
        );

        // If no matching volume, go to content page
        if (!volume) return `/content/${content.id}`;

        // Go directly to reader with correct position
        return content.contentType === "manga"
            ? `/reader/manga/${content.id}/${
                  volume.volumeNumber
              }/${history.position || 1}`
            : `/reader/epub/${content.id}/${volume.volumeNumber}`;
    };

    const getVolumeCoverImage = (
        content: ContentWithUserData,
        readingHistory: ReadingHistory
    ) => {
        const volume = content.contentVolumes?.find(
            (vol) => vol.id === readingHistory.volumeId
        );

        return volume?.coverImage || "";
    };

    return (
        <div className="space-y-5">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-orange-500" />
                        Continue Reading
                    </h2>
                    <Link
                        href="/content?reading=true"
                        className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                    >
                        View all
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {continuableContent.map((content) => {
                    const readingHistory =
                        content.readingHistory?.[0];
                    const volume =
                        content.contentVolumes?.find(
                            (vol) =>
                                vol.id ===
                                readingHistory?.volumeId
                        );

                    // Calculate progress percentage
                    const progress =
                        readingHistory && volume
                            ? content.contentType ===
                              "manga"
                                ? Math.min(
                                      Math.round(
                                          (readingHistory.position /
                                              (volume.pageCount ||
                                                  1)) *
                                              100
                                      ),
                                      100
                                  )
                                : Math.min(
                                      readingHistory.position,
                                      100
                                  )
                            : 0;

                    const readerHref =
                        getReaderHref(content);

                    return (
                        <div
                            key={content.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
                        >
                            <div className="flex">
                                <Link
                                    href={readerHref}
                                    className="w-20 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative"
                                >
                                    {content &&
                                    readingHistory &&
                                    content.contentVolumes ? (
                                        <Image
                                            src={getVolumeCoverImage(
                                                content,
                                                readingHistory
                                            )}
                                            alt={
                                                content.title
                                            }
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Book className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Progress indicator on cover */}
                                    {readingHistory &&
                                        progress > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                </Link>

                                <div className="ml-4 flex-1 min-w-0">
                                    <Link href={readerHref}>
                                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                            {content.title}
                                        </h3>
                                    </Link>

                                    <div className="mt-2 space-y-2">
                                        {volume && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Volume{" "}
                                                {
                                                    volume.volumeNumber
                                                }
                                            </p>
                                        )}

                                        {readingHistory && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                                    <span>
                                                        {content.contentType ===
                                                        "manga"
                                                            ? `Page ${readingHistory.position}`
                                                            : `${progress}% complete`}
                                                    </span>
                                                </div>

                                                <Progress
                                                    value={
                                                        progress
                                                    }
                                                    className="h-1.5"
                                                />
                                            </div>
                                        )}

                                        <Button
                                            asChild
                                            size="sm"
                                            className="mt-2 w-full"
                                        >
                                            <Link
                                                href={
                                                    readerHref
                                                }
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Continue
                                                Reading
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
