"use client";

import { useAllContentWithUserData } from "@/hooks/use-content-management";
import { ContentWithUserData } from "@/types/content";
import { Book, Clock, ExternalLink } from "lucide-react";
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

    if (isLoading) {
        return (
            <div className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>
        );
    }

    if (continuableContent.length === 0) {
        return null;
    }

    const href = (content: ContentWithUserData) => {
        if (content.contentType === "manga") {
            return `/content/${content.id}`;
        }
        return `/content/${content.id}`;
    };

    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {continuableContent.map((content) => {
                    const readingHistory =
                        content.readingHistory?.[0];
                    const volume =
                        content.contentVolumes?.find(
                            (vol) =>
                                vol.id ===
                                readingHistory?.volumeId
                        );

                    return (
                        <Link
                            key={content.id}
                            href={href(content)}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 flex hover:border-orange-300 dark:hover:border-orange-600 transition-colors group"
                        >
                            <div className="w-16 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative">
                                {content.coverImage ? (
                                    <Image
                                        src={
                                            content.coverImage
                                        }
                                        alt={content.title}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Book className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="ml-4 flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                    {content.title}
                                </h3>

                                <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    {volume && (
                                        <p className="truncate">
                                            Volume{" "}
                                            {
                                                volume.volumeNumber
                                            }
                                        </p>
                                    )}

                                    {readingHistory && (
                                        <div className="flex items-center">
                                            <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                            <span>
                                                {content.contentType ===
                                                "manga"
                                                    ? `Page ${readingHistory.position}`
                                                    : `${readingHistory.position}% complete`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 inline-flex items-center text-xs font-medium text-orange-600 dark:text-orange-400 group-hover:text-orange-700 dark:group-hover:text-orange-300">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                    Continue reading
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
