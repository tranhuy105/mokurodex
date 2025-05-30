"use client";

import {
    BookmarkX,
    Check,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    Clock,
    Heart,
    PauseCircle,
} from "lucide-react";
import { useState } from "react";

interface ContentStatusFilterProps {
    selectedStatuses: string[];
    favorite: boolean;
    onStatusToggle: (status: string) => void;
    onFavoriteToggle: () => void;
}

export function ContentStatusFilter({
    selectedStatuses,
    favorite,
    onStatusToggle,
    onFavoriteToggle,
}: ContentStatusFilterProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Reading status options
    const statusOptions = [
        {
            value: "reading",
            label: "Reading",
            icon: CircleCheck,
            color: "text-green-500",
        },
        {
            value: "completed",
            label: "Completed",
            icon: Check,
            color: "text-blue-500",
        },
        {
            value: "on-hold",
            label: "On Hold",
            icon: PauseCircle,
            color: "text-orange-500",
        },
        {
            value: "dropped",
            label: "Dropped",
            icon: BookmarkX,
            color: "text-red-500",
        },
        {
            value: "plan-to-read",
            label: "Plan to Read",
            icon: Clock,
            color: "text-purple-500",
        },
    ];

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-left"
            >
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                        Status
                    </span>
                    {(selectedStatuses.length > 0 ||
                        favorite) && (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            {selectedStatuses.length +
                                (favorite ? 1 : 0)}
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
                <div className="p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((option) => {
                            const isSelected =
                                selectedStatuses.includes(
                                    option.value
                                );
                            const IconComponent =
                                option.icon;

                            return (
                                <div
                                    key={option.value}
                                    onClick={() =>
                                        onStatusToggle(
                                            option.value
                                        )
                                    }
                                    className={`
                    flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors
                    ${
                        isSelected
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }
                  `}
                                >
                                    <IconComponent
                                        className={`w-4 h-4 ${option.color}`}
                                    />
                                    <span>
                                        {option.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Favorites toggle */}
                    <div
                        onClick={onFavoriteToggle}
                        className={`
              flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors
              ${
                  favorite
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }
            `}
                    >
                        <Heart
                            className={`w-4 h-4 ${
                                favorite
                                    ? "fill-red-500 text-red-500"
                                    : ""
                            }`}
                        />
                        <span>Favorites Only</span>
                    </div>
                </div>
            )}
        </div>
    );
}
