"use client";

import { Book, BookOpen } from "lucide-react";

interface ContentTypeSelectorProps {
    activeType: "all" | "manga" | "lightnovel";
    onTypeChange: (
        type: "all" | "manga" | "lightnovel"
    ) => void;
}

export function ContentTypeSelector({
    activeType,
    onTypeChange,
}: ContentTypeSelectorProps) {
    return (
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            <button
                onClick={() => onTypeChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === "all"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
            >
                All
            </button>

            <button
                onClick={() => onTypeChange("manga")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === "manga"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
            >
                <Book className="w-4 h-4" />
                <span>Manga</span>
            </button>

            <button
                onClick={() => onTypeChange("lightnovel")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeType === "lightnovel"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
            >
                <BookOpen className="w-4 h-4" />
                <span>Novels</span>
            </button>
        </div>
    );
}
