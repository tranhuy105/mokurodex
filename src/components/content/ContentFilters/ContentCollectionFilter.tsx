"use client";

import { Collection } from "@/types/content";
import {
    Bookmark,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface ContentCollectionFilterProps {
    collections: Collection[];
    selectedCollections: string[];
    onCollectionToggle: (collectionId: string) => void;
}

export function ContentCollectionFilter({
    collections,
    selectedCollections,
    onCollectionToggle,
}: ContentCollectionFilterProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-left"
            >
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                        Collections
                    </span>
                    {selectedCollections.length > 0 && (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {selectedCollections.length}
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
                <div className="p-3">
                    {collections.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                            No collections found
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {collections.map(
                                (collection) => {
                                    const isSelected =
                                        selectedCollections.includes(
                                            collection.id
                                        );

                                    return (
                                        <div
                                            key={
                                                collection.id
                                            }
                                            onClick={() =>
                                                onCollectionToggle(
                                                    collection.id
                                                )
                                            }
                                            className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                      transition-colors cursor-pointer
                      ${
                          isSelected
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }
                    `}
                                        >
                                            <span>
                                                {
                                                    collection.name
                                                }
                                            </span>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
