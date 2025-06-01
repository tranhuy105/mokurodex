"use client";

import {
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
} from "lucide-react";
import { useState } from "react";

interface ContentNsfwFilterProps {
    isNsfw: boolean | undefined;
    onNsfwFilterChange: (
        value: boolean | undefined
    ) => void;
}

export function ContentNsfwFilter({
    isNsfw,
    onNsfwFilterChange,
}: ContentNsfwFilterProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full mb-2 text-left focus:outline-none"
            >
                <div className="flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Content Filter
                    </h3>
                    {isNsfw !== null && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300">
                            1
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
                <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() =>
                                onNsfwFilterChange(
                                    undefined
                                )
                            }
                            className={`px-2.5 py-1.5 rounded-md text-sm ${
                                isNsfw === null
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            <span>All Content</span>
                        </button>
                        <button
                            onClick={() =>
                                onNsfwFilterChange(false)
                            }
                            className={`px-2.5 py-1.5 rounded-md text-sm flex items-center ${
                                isNsfw === false
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            <span>SFW Only</span>
                        </button>
                        <button
                            onClick={() =>
                                onNsfwFilterChange(true)
                            }
                            className={`px-2.5 py-1.5 rounded-md text-sm flex items-center ${
                                isNsfw === true
                                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                            <span>NSFW Only</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
