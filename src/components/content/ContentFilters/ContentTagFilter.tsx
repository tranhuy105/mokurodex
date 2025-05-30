"use client";

import { Tag } from "@/types/content";
import {
    Bookmark,
    ChevronDown,
    ChevronUp,
    Hash,
    Palette,
    TagIcon,
} from "lucide-react";
import { useState } from "react";

interface ContentTagFilterProps {
    tags: Tag[];
    selectedTags: string[];
    onTagToggle: (tagId: string) => void;
}

export function ContentTagFilter({
    tags,
    selectedTags,
    onTagToggle,
}: ContentTagFilterProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Group tags by type for better organization
    const groupedTags = {
        genre: tags.filter((tag) => tag.type === "genre"),
        content: tags.filter(
            (tag) => tag.type === "content"
        ),
        custom: tags.filter((tag) => tag.type === "custom"),
    };

    // Helper function to get tag color classes
    const getTagColorClasses = (
        color: string | null | undefined,
        isSelected: boolean
    ) => {
        if (isSelected) {
            switch (color) {
                case "gray":
                    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
                case "red":
                    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
                case "orange":
                    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
                case "amber":
                    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
                case "yellow":
                    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
                case "lime":
                    return "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300";
                case "green":
                    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
                case "emerald":
                    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
                case "teal":
                    return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
                case "cyan":
                    return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
                case "sky":
                    return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
                case "blue":
                    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
                case "indigo":
                    return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
                case "violet":
                    return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
                case "purple":
                    return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
                case "fuchsia":
                    return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
                case "pink":
                    return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
                case "rose":
                    return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
                default:
                    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
            }
        } else {
            return "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";
        }
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-left"
            >
                <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                        Tags
                    </span>
                    {selectedTags.length > 0 && (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                            {selectedTags.length}
                        </span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-3 space-y-4">
                    {/* Genres */}
                    {groupedTags.genre.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Bookmark className="w-4 h-4 mr-1.5 text-orange-500" />
                                Genres
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {groupedTags.genre.map(
                                    (tag) => {
                                        const isSelected =
                                            selectedTags.includes(
                                                tag.id
                                            );
                                        const colorClasses =
                                            getTagColorClasses(
                                                tag.color,
                                                isSelected
                                            );

                                        return (
                                            <div
                                                key={tag.id}
                                                onClick={() =>
                                                    onTagToggle(
                                                        tag.id
                                                    )
                                                }
                                                className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                        transition-colors cursor-pointer ${colorClasses}
                      `}
                                            >
                                                <span>
                                                    {
                                                        tag.name
                                                    }
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content Tags */}
                    {groupedTags.content.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Hash className="w-4 h-4 mr-1.5 text-blue-500" />
                                Content Tags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {groupedTags.content.map(
                                    (tag) => {
                                        const isSelected =
                                            selectedTags.includes(
                                                tag.id
                                            );
                                        const colorClasses =
                                            getTagColorClasses(
                                                tag.color,
                                                isSelected
                                            );

                                        return (
                                            <div
                                                key={tag.id}
                                                onClick={() =>
                                                    onTagToggle(
                                                        tag.id
                                                    )
                                                }
                                                className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                        transition-colors cursor-pointer ${colorClasses}
                      `}
                                            >
                                                <span>
                                                    {
                                                        tag.name
                                                    }
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}

                    {/* Custom Tags */}
                    {groupedTags.custom.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Palette className="w-4 h-4 mr-1.5 text-purple-500" />
                                Custom Tags
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {groupedTags.custom.map(
                                    (tag) => {
                                        const isSelected =
                                            selectedTags.includes(
                                                tag.id
                                            );
                                        const colorClasses =
                                            getTagColorClasses(
                                                tag.color,
                                                isSelected
                                            );

                                        return (
                                            <div
                                                key={tag.id}
                                                onClick={() =>
                                                    onTagToggle(
                                                        tag.id
                                                    )
                                                }
                                                className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                        transition-colors cursor-pointer ${colorClasses}
                      `}
                                            >
                                                <span>
                                                    {
                                                        tag.name
                                                    }
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
