"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { Collection, Tag } from "@/types/content";
import { Filter, X } from "lucide-react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ContentCollectionFilter } from "./ContentCollectionFilter";
import { ContentNsfwFilter } from "./ContentNsfwFilter";
import { ContentStatusFilter } from "./ContentStatusFilter";
import { ContentTagFilter } from "./ContentTagFilter";

interface ContentLibraryFiltersProps {
    tags: Tag[];
    collections: Collection[];
    embedded?: boolean;
    onClose?: () => void;
}

export function ContentLibraryFilters({
    tags,
    collections,
    embedded = false,
    onClose,
}: ContentLibraryFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filterPanelRef = useRef<HTMLDivElement>(null);

    // Parse existing filters from URL
    const [selectedTags, setSelectedTags] = useState<
        string[]
    >(() => {
        const tagsParam = searchParams.get("tags");
        return tagsParam?.split(",").filter(Boolean) || [];
    });

    const [selectedCollections, setSelectedCollections] =
        useState<string[]>(() => {
            const collectionsParam =
                searchParams.get("collections");
            return (
                collectionsParam
                    ?.split(",")
                    .filter(Boolean) || []
            );
        });

    const [selectedStatuses, setSelectedStatuses] =
        useState<string[]>(() => {
            const statusParam = searchParams.get("status");
            return (
                statusParam?.split(",").filter(Boolean) ||
                []
            );
        });

    const [favorite, setFavorite] = useState<
        boolean | null
    >(() => {
        const favoriteParam = searchParams.get("favorite");
        if (favoriteParam === "true") return true;
        if (favoriteParam === "false") return false;
        return null;
    });

    const [isNsfw, setIsNsfw] = useState<boolean | null>(
        () => {
            const nsfwParam = searchParams.get("isNsfw");
            if (nsfwParam === "true") return true;
            if (nsfwParam === "false") return false;
            return null; // No NSFW filter selected
        }
    );

    // If embedded, we don't need to control our own visibility
    const [isFilterPanelOpen, setIsFilterPanelOpen] =
        useState(
            embedded
                ? true
                : searchParams.get("showFilters") === "true"
        );
    const [activeFiltersCount, setActiveFiltersCount] =
        useState(0);

    // Calculate active filters count
    useEffect(() => {
        let count = 0;
        if (selectedTags.length > 0) count++;
        if (selectedCollections.length > 0) count++;
        if (selectedStatuses.length > 0) count++;
        if (favorite) count++;
        if (isNsfw !== null) count++;
        setActiveFiltersCount(count);
    }, [
        selectedTags,
        selectedCollections,
        selectedStatuses,
        favorite,
        isNsfw,
    ]);

    // Don't need click-outside handler when embedded
    useEffect(() => {
        if (embedded) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                filterPanelRef.current &&
                !filterPanelRef.current.contains(
                    event.target as Node
                ) &&
                isFilterPanelOpen
            ) {
                // Close without removing the filters, just hide the panel
                const params = new URLSearchParams(
                    window.location.search
                );
                params.delete("showFilters");
                const path = `/content${
                    params.toString()
                        ? `?${params.toString()}`
                        : ""
                }`;
                router.push(path);
                setIsFilterPanelOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [isFilterPanelOpen, router, embedded]);

    // Apply filters and update URL
    const applyFilters = () => {
        const params = new URLSearchParams();

        if (selectedTags.length > 0) {
            params.set("tags", selectedTags.join(","));
        }

        if (selectedCollections.length > 0) {
            params.set(
                "collections",
                selectedCollections.join(",")
            );
        }

        if (selectedStatuses.length > 0) {
            params.set(
                "status",
                selectedStatuses.join(",")
            );
        }

        if (favorite) {
            params.set("favorite", "true");
        }

        if (isNsfw !== null) {
            params.set("isNsfw", isNsfw ? "true" : "false");
        }

        // Update the URL with the filter parameters
        const path = `/content${
            params.toString() ? `?${params.toString()}` : ""
        }`;
        router.push(path);

        // If embedded, call onClose callback instead of managing our own state
        if (embedded && onClose) {
            onClose();
        } else {
            setIsFilterPanelOpen(false);
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setSelectedTags([]);
        setSelectedCollections([]);
        setSelectedStatuses([]);
        setFavorite(false);
        setIsNsfw(null);
    };

    // Toggle handlers for each filter type
    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId]
        );
    };

    const toggleCollection = (collectionId: string) => {
        setSelectedCollections((prev) =>
            prev.includes(collectionId)
                ? prev.filter((id) => id !== collectionId)
                : [...prev, collectionId]
        );
    };

    const toggleStatus = (status: string) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
    };

    const toggleFavorite = () => {
        setFavorite((prev) => !prev);
    };

    const handleNsfwFilter = (value: boolean | null) => {
        setIsNsfw(value);
    };

    // Helper functions to get names by IDs
    const getTagName = (tagId: string) => {
        return (
            tags.find((tag) => tag.id === tagId)?.name ||
            tagId
        );
    };

    const getTagColor = (tagId: string): string | null => {
        const tag = tags.find((tag) => tag.id === tagId);
        return tag?.color || null;
    };

    const getCollectionName = (collectionId: string) => {
        return (
            collections.find(
                (collection) =>
                    collection.id === collectionId
            )?.name || collectionId
        );
    };

    const getStatusLabel = (statusValue: string) => {
        const statusOptions = [
            { value: "reading", label: "Reading" },
            { value: "completed", label: "Completed" },
            { value: "on-hold", label: "On Hold" },
            { value: "dropped", label: "Dropped" },
            {
                value: "plan-to-read",
                label: "Plan to Read",
            },
        ];
        return (
            statusOptions.find(
                (option) => option.value === statusValue
            )?.label || statusValue
        );
    };

    // Helper function to get tag color classes
    const getTagColorClasses = (
        color: string | null,
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

    // Check if any filters are active
    const hasActiveFilters = activeFiltersCount > 0;

    return (
        <div
            className={`${embedded ? "" : "mb-6"} relative`}
        >
            {!embedded && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                        onClick={() => {
                            const params =
                                new URLSearchParams(
                                    window.location.search
                                );
                            params.set(
                                "showFilters",
                                "true"
                            );
                            const path = `/content${
                                params.toString()
                                    ? `?${params.toString()}`
                                    : ""
                            }`;
                            router.push(path);
                            setIsFilterPanelOpen(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <Filter className="w-4 h-4 mr-1.5" />
                        <span>Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-1.5 w-5 h-5 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Active filters display */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tagId) => {
                                const tagColor =
                                    getTagColor(tagId);
                                const colorClasses =
                                    getTagColorClasses(
                                        tagColor,
                                        true
                                    );

                                return (
                                    <div
                                        key={`tag-${tagId}`}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}
                                    >
                                        <span>
                                            {getTagName(
                                                tagId
                                            )}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newTags =
                                                    selectedTags.filter(
                                                        (
                                                            id
                                                        ) =>
                                                            id !==
                                                            tagId
                                                    );
                                                setSelectedTags(
                                                    newTags
                                                );

                                                // Apply filters immediately
                                                const params =
                                                    new URLSearchParams(
                                                        window.location.search
                                                    );
                                                if (
                                                    newTags.length >
                                                    0
                                                ) {
                                                    params.set(
                                                        "tags",
                                                        newTags.join(
                                                            ","
                                                        )
                                                    );
                                                } else {
                                                    params.delete(
                                                        "tags"
                                                    );
                                                }
                                                const path = `/content${
                                                    params.toString()
                                                        ? `?${params.toString()}`
                                                        : ""
                                                }`;
                                                router.push(
                                                    path
                                                );
                                            }}
                                            className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </button>
                                    </div>
                                );
                            })}

                            {selectedCollections.map(
                                (collectionId) => (
                                    <div
                                        key={`collection-${collectionId}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    >
                                        <span>
                                            {getCollectionName(
                                                collectionId
                                            )}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newCollections =
                                                    selectedCollections.filter(
                                                        (
                                                            id
                                                        ) =>
                                                            id !==
                                                            collectionId
                                                    );
                                                setSelectedCollections(
                                                    newCollections
                                                );

                                                // Apply filters immediately
                                                const params =
                                                    new URLSearchParams(
                                                        window.location.search
                                                    );
                                                if (
                                                    newCollections.length >
                                                    0
                                                ) {
                                                    params.set(
                                                        "collections",
                                                        newCollections.join(
                                                            ","
                                                        )
                                                    );
                                                } else {
                                                    params.delete(
                                                        "collections"
                                                    );
                                                }
                                                const path = `/content${
                                                    params.toString()
                                                        ? `?${params.toString()}`
                                                        : ""
                                                }`;
                                                router.push(
                                                    path
                                                );
                                            }}
                                            className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </button>
                                    </div>
                                )
                            )}

                            {selectedStatuses.map(
                                (status) => (
                                    <div
                                        key={`status-${status}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    >
                                        <span>
                                            {getStatusLabel(
                                                status
                                            )}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newStatuses =
                                                    selectedStatuses.filter(
                                                        (
                                                            s
                                                        ) =>
                                                            s !==
                                                            status
                                                    );
                                                setSelectedStatuses(
                                                    newStatuses
                                                );

                                                // Apply filters immediately
                                                const params =
                                                    new URLSearchParams(
                                                        window.location.search
                                                    );
                                                if (
                                                    newStatuses.length >
                                                    0
                                                ) {
                                                    params.set(
                                                        "status",
                                                        newStatuses.join(
                                                            ","
                                                        )
                                                    );
                                                } else {
                                                    params.delete(
                                                        "status"
                                                    );
                                                }
                                                const path = `/content${
                                                    params.toString()
                                                        ? `?${params.toString()}`
                                                        : ""
                                                }`;
                                                router.push(
                                                    path
                                                );
                                            }}
                                            className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </button>
                                    </div>
                                )
                            )}

                            {favorite && (
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                    <span>Favorites</span>
                                    <button
                                        onClick={() => {
                                            setFavorite(
                                                false
                                            );

                                            // Apply filters immediately
                                            const params =
                                                new URLSearchParams(
                                                    window.location.search
                                                );
                                            params.delete(
                                                "favorite"
                                            );
                                            const path = `/content${
                                                params.toString()
                                                    ? `?${params.toString()}`
                                                    : ""
                                            }`;
                                            router.push(
                                                path
                                            );
                                        }}
                                        className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">
                                            Remove
                                        </span>
                                    </button>
                                </div>
                            )}

                            {hasActiveFilters && (
                                <button
                                    onClick={() => {
                                        resetFilters();
                                        // Clear all filters and navigate
                                        router.push(
                                            "/content"
                                        );
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    <X className="h-3 w-3" />
                                    <span>Clear all</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Filter Panel Body - always shown when embedded */}
            {(embedded || isFilterPanelOpen) && (
                <div
                    ref={filterPanelRef}
                    className={`${
                        !embedded
                            ? "absolute z-30 top-full left-0 mt-2 w-full max-w-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            : ""
                    }`}
                >
                    {!embedded && (
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Filter Content
                            </h3>
                            <button
                                onClick={() =>
                                    setIsFilterPanelOpen(
                                        false
                                    )
                                }
                                className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div
                        className={`${
                            embedded
                                ? ""
                                : "p-4 max-h-[70vh] overflow-y-auto"
                        }`}
                    >
                        <div className="space-y-4">
                            {/* Use modular filter components */}
                            <ContentTagFilter
                                tags={tags}
                                selectedTags={selectedTags}
                                onTagToggle={toggleTag}
                            />

                            <ContentCollectionFilter
                                collections={collections}
                                selectedCollections={
                                    selectedCollections
                                }
                                onCollectionToggle={
                                    toggleCollection
                                }
                            />

                            <ContentStatusFilter
                                selectedStatuses={
                                    selectedStatuses
                                }
                                favorite={favorite}
                                onStatusToggle={
                                    toggleStatus
                                }
                                onFavoriteToggle={
                                    toggleFavorite
                                }
                            />

                            <ContentNsfwFilter
                                isNsfw={isNsfw}
                                onNsfwFilterChange={
                                    handleNsfwFilter
                                }
                            />

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={() => {
                                        resetFilters();

                                        if (
                                            embedded &&
                                            onClose
                                        ) {
                                            // Just close when embedded
                                            onClose();
                                            // Also remove all filters from URL
                                            router.push(
                                                "/content"
                                            );
                                        } else {
                                            // Clear all filters and navigate
                                            router.push(
                                                "/content"
                                            );
                                        }
                                    }}
                                    disabled={
                                        !hasActiveFilters
                                    }
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 
                    ${
                        hasActiveFilters
                            ? "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                    }
                  `}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function ContentLibraryFiltersSkeleton() {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </div>
    );
}
