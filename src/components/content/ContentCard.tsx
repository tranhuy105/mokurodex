"use client";

import {
    ContentTag,
    ContentWithUserData,
    Tag,
    UserContentMetadata,
} from "@/types/content";
import { formatDistanceToNow } from "date-fns";
import {
    BookMarked,
    BookOpen,
    Clock,
    EyeOff,
    Star,
    Tag as TagIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ContentCardProps {
    content: ContentWithUserData;
}

export function ContentCard({ content }: ContentCardProps) {
    const { id, title, coverImage, contentType, volumes } =
        content;

    // Get user metadata with proper typing
    const userData =
        content.userData || ({} as UserContentMetadata);
    const { status, favorite, isNsfw } = userData;

    // Get tags if available
    const tags =
        content.contentTags?.map(
            (ct: ContentTag) => ct.tag
        ) || [];

    // Get most recent reading history
    const recentHistory = content.readingHistory?.[0];
    const lastReadTime = recentHistory?.timestamp;

    // Determine the detail page URL
    const detailUrl = `/content/${id}`;

    // Determine content type icon and label
    const contentTypeInfo = {
        manga: {
            icon: <BookOpen className="h-4 w-4" />,
            label: "Manga",
        },
        lightnovel: {
            icon: <BookMarked className="h-4 w-4" />,
            label: "Novel",
        },
    }[contentType] || {
        icon: <BookOpen className="h-4 w-4" />,
        label: "Content",
    };

    // Get status badge color
    const statusColor =
        {
            reading:
                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            completed:
                "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            "on-hold":
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            dropped:
                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            "plan-to-read":
                "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        }[status as string] ||
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
            <Link href={detailUrl} className="block">
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-900">
                    {coverImage ? (
                        <>
                            <Image
                                src={coverImage}
                                alt={title}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className={`object-cover ${
                                    isNsfw ? "blur-md" : ""
                                }`}
                            />
                            {/* NSFW overlay */}
                            {isNsfw && (
                                <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center">
                                    <EyeOff className="h-10 w-10 text-white opacity-70" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {contentTypeInfo.icon}
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {/* Content type badge */}
                        <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-md flex items-center">
                            {contentTypeInfo.icon}
                            <span className="ml-1">
                                {contentTypeInfo.label}
                            </span>
                        </div>

                        {/* Volumes badge */}
                        {volumes > 1 && (
                            <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-md">
                                {volumes} volumes
                            </div>
                        )}
                    </div>

                    {/* Status badge */}
                    {status && (
                        <div className="absolute top-2 right-2">
                            <div
                                className={`px-2 py-1 text-xs rounded-md ${statusColor}`}
                            >
                                {status.replace("-", " ")}
                            </div>
                        </div>
                    )}

                    {/* NSFW badge */}
                    {isNsfw && (
                        <div className="absolute bottom-2 right-2">
                            <div className="px-2 py-1 bg-purple-600 text-white text-xs rounded-md flex items-center">
                                <EyeOff className="h-3 w-3 mr-1" />
                                NSFW
                            </div>
                        </div>
                    )}

                    {/* Favorite badge */}
                    {favorite && (
                        <div className="absolute bottom-2 left-2">
                            <div className="p-1 bg-yellow-500/90 text-white rounded-full">
                                <Star className="h-4 w-4 fill-current" />
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <Link href={detailUrl} className="block">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {title}
                    </h3>
                </Link>

                {/* Metadata */}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {/* Progress */}
                    {/* {progress !== undefined &&
                        progress !== null && (
                            <div className="flex items-center">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mr-2">
                                    <div
                                        className="bg-blue-600 h-1.5 rounded-full"
                                        style={{
                                            width: `${Math.min(
                                                progress,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs whitespace-nowrap">
                                    {progress}%
                                </span>
                            </div>
                        )} */}

                    {/* Last read time */}
                    {lastReadTime && (
                        <div className="flex items-center text-xs">
                            <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            <span>
                                Read{" "}
                                {formatDistanceToNow(
                                    new Date(lastReadTime)
                                )}{" "}
                                ago
                            </span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {tags
                            .slice(0, 3)
                            .map((tag: Tag) => (
                                <div
                                    key={tag.id}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center"
                                    style={
                                        tag.color
                                            ? {
                                                  backgroundColor: `${tag.color}20`,
                                                  color: tag.color,
                                              }
                                            : {}
                                    }
                                >
                                    <TagIcon className="h-3 w-3 mr-1" />
                                    {tag.name}
                                </div>
                            ))}
                        {tags.length > 3 && (
                            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                +{tags.length - 3} more
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
