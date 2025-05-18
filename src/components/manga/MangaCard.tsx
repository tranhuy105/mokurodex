"use client";

import { formatDate } from "@/lib/utils";
import { MangaMetadata } from "@/types/manga";
import { UserMangaMetadata } from "@prisma/client";
import {
    Book,
    BookmarkX,
    CircleCheck,
    Clock,
    Eye,
    EyeOff,
    Heart,
    PauseCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface MangaCardProps {
    manga: MangaMetadata & {
        userData?: UserMangaMetadata | null;
    };
}

// Get status icon based on reading status
function getStatusIcon(status: string) {
    switch (status) {
        case "reading":
            return (
                <CircleCheck className="w-3 h-3 text-green-500" />
            );
        case "completed":
            return (
                <CircleCheck className="w-3 h-3 text-blue-500" />
            );
        case "on-hold":
            return (
                <PauseCircle className="w-3 h-3 text-orange-500" />
            );
        case "dropped":
            return (
                <BookmarkX className="w-3 h-3 text-red-500" />
            );
        case "plan-to-read":
            return (
                <Clock className="w-3 h-3 text-purple-500" />
            );
        default:
            return null;
    }
}

export function MangaCard({ manga }: MangaCardProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const isNsfw = manga.userData?.isNsfw || false;

    // Toggle reveal state for NSFW content
    const toggleReveal = (e: React.MouseEvent) => {
        if (isNsfw) {
            e.preventDefault();
            e.stopPropagation();
            setIsRevealed(!isRevealed);
        }
    };

    return (
        <Link
            href={`/manga/${encodeURIComponent(manga.id)}`}
            className="group flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:ring-2 hover:ring-orange-500/30 hover:shadow-md transition-all h-full"
        >
            {/* Cover Image */}
            <div className="relative pt-[150%] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {manga.coverImage ? (
                    <Image
                        src={manga.coverImage}
                        alt={manga.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className={`object-cover transition-transform group-hover:scale-105 duration-300 ease-out ${
                            isNsfw && !isRevealed
                                ? "blur-xl filter"
                                : ""
                        }`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Book className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                )}

                {/* Volume count badge */}
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-gray-900/80 text-white rounded-md text-sm font-medium backdrop-blur-sm">
                    {manga.volumes}{" "}
                    {manga.volumes === 1 ? "vol" : "vols"}
                </div>

                {/* Favorite indicator */}
                {manga.userData?.favorite && (
                    <div className="absolute top-2 right-2 p-1.5 bg-gray-900/80 text-white rounded-full backdrop-blur-sm">
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </div>
                )}

                {/* NSFW indicator */}
                {isNsfw && (
                    <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer"
                        onClick={toggleReveal}
                    >
                        {!isRevealed ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-purple-600/90 text-white rounded-full p-3 shadow-lg backdrop-blur-sm">
                                    <EyeOff className="w-8 h-8" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-purple-600/80 text-white rounded-full p-2 shadow-lg backdrop-blur-sm">
                                <Eye className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                )}

                {/* Add NSFW badge in bottom corner even when revealed */}
                {isNsfw && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-purple-600/80 text-white rounded-md text-xs font-medium backdrop-blur-sm z-10">
                        NSFW
                    </div>
                )}

                {/* Gradient overlay for title visibility */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent"></div>

                {/* Title overlay at bottom of image */}
                <h3 className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-white font-medium line-clamp-2 text-lg drop-shadow-sm">
                    {manga.title}
                </h3>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {manga.lastModified && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
                        <span>
                            Updated{" "}
                            {formatDate(manga.lastModified)}
                        </span>
                    </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {manga.userData?.status && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {getStatusIcon(
                                manga.userData.status
                            )}
                            <span>
                                {manga.userData.status.replace(
                                    /-/g,
                                    " "
                                )}
                            </span>
                        </span>
                    )}

                    {isNsfw ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            <EyeOff className="w-3 h-3" />
                            <span>NSFW</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            Manga
                        </span>
                    )}

                    {manga.volumes > 10 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Collection
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
