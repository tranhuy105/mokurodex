"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import {
    useCreateTag,
    useDeleteTag,
    useTags,
    useUpdateTag,
} from "@/hooks/use-content-management";
import { cn } from "@/lib/utils";
import { Tag, TagType } from "@/types/content";
import {
    Bookmark,
    Hash,
    Palette,
    Plus,
    Search,
    Tag as TagIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TagDialog } from "./TagDialog";
import { TagItem } from "./TagItem";
import { AVAILABLE_COLORS } from "./constants";

interface TagManagementProps {
    selectedTagIds?: string[];
    onTagSelect?: (tagId: string) => void;
    onTagsChange?: () => void;
    showInline?: boolean;
    isLoading?: boolean;
    isUpdating?: boolean;
}

export function TagManagement({
    selectedTagIds = [],
    onTagSelect,
    onTagsChange,
    showInline = false,
    isLoading: externalLoading,
    isUpdating,
}: TagManagementProps) {
    const { data: tags, isLoading: isTagsLoading } =
        useTags();
    const createTag = useCreateTag();
    const updateTag = useUpdateTag();
    const deleteTag = useDeleteTag();

    // States for tag management
    const [filter, setFilter] = useState<
        "all" | "genre" | "content" | "custom"
    >("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTags, setFilteredTags] = useState<Tag[]>(
        []
    );

    // States for tag creation/editing
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTag, setCurrentTag] = useState<{
        id?: string;
        name: string;
        color: string;
        type: TagType;
    }>({
        name: "",
        color:
            AVAILABLE_COLORS.find((c) => c.name === "blue")
                ?.hex || "#3B82F6",
        type: "custom",
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter tags based on search query and type filter
    const filterTags = useCallback(
        (
            allTags: Tag[] = [],
            tagFilter:
                | "all"
                | "genre"
                | "content"
                | "custom",
            query: string
        ) => {
            if (!allTags) return [];

            let filtered = [...allTags];

            // Filter by type
            if (tagFilter !== "all") {
                filtered = filtered.filter(
                    (tag) => tag.type === tagFilter
                );
            }

            // Filter by search query
            if (query.trim() !== "") {
                const lowercaseQuery = query.toLowerCase();
                filtered = filtered.filter((tag) =>
                    tag.name
                        .toLowerCase()
                        .includes(lowercaseQuery)
                );
            }

            return filtered;
        },
        []
    );

    // Update filtered tags when tags, filter, or search query changes
    useEffect(() => {
        if (tags) {
            const filtered = filterTags(
                tags,
                filter,
                searchQuery
            );
            setFilteredTags(filtered);
        }
    }, [tags, filter, searchQuery, filterTags]);

    // Group tags by type for better organization
    const groupedTags = {
        genre: filteredTags.filter(
            (tag) => tag.type === "genre"
        ),
        content: filteredTags.filter(
            (tag) => tag.type === "content"
        ),
        custom: filteredTags.filter(
            (tag) => tag.type === "custom"
        ),
    };

    // Handle tag creation
    const handleCreateTag = async () => {
        if (!currentTag.name.trim()) return;

        setIsProcessing(true);
        try {
            if (isEditing && currentTag.id) {
                await updateTag.mutateAsync({
                    id: currentTag.id,
                    data: {
                        name: currentTag.name.trim(),
                        color: currentTag.color,
                        type: currentTag.type,
                    },
                });
            } else {
                await createTag.mutateAsync({
                    name: currentTag.name.trim(),
                    color: currentTag.color,
                    type: currentTag.type,
                });
            }

            // Reset form
            resetTagForm();
            setIsDialogOpen(false);

            // Notify parent component
            if (onTagsChange) {
                onTagsChange();
            }
        } catch (error) {
            console.error("Error saving tag:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle tag deletion
    const handleDeleteTag = async (tagId: string) => {
        if (
            window.confirm(
                "Are you sure you want to delete this tag? It will be removed from all content."
            )
        ) {
            try {
                await deleteTag.mutateAsync(tagId);

                // Notify parent component
                if (onTagsChange) {
                    onTagsChange();
                }
            } catch (error) {
                console.error("Error deleting tag:", error);
            }
        }
    };

    // Reset tag form
    const resetTagForm = () => {
        setCurrentTag({
            name: "",
            color:
                AVAILABLE_COLORS.find(
                    (c) => c.name === "blue"
                )?.hex || "#3B82F6",
            type: "custom",
        });
        setIsEditing(false);
    };

    // Open edit dialog for a tag
    const openEditDialog = (tag: Tag) => {
        setCurrentTag({
            id: tag.id,
            name: tag.name,
            color:
                tag.color ||
                AVAILABLE_COLORS.find(
                    (c) => c.name === "blue"
                )?.hex ||
                "#3B82F6",
            type: tag.type,
        });
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    // Handle tag selection with proper toggling
    const handleTagSelect = (tagId: string) => {
        if (onTagSelect) {
            onTagSelect(tagId);
        }
    };

    // Determine if we should show loading state
    const isLoadingState =
        externalLoading !== undefined
            ? externalLoading
            : isTagsLoading;

    // For inline display (used in content detail page)
    if (showInline) {
        return (
            <div className="space-y-4">
                {isLoadingState ? (
                    <div className="flex flex-wrap gap-2">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton
                                key={`tag-skeleton-${i}`}
                                className="h-7 w-24 rounded-full"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-2">
                            {filteredTags.length > 0 ? (
                                filteredTags.map((tag) => (
                                    <TagItem
                                        key={tag.id}
                                        tag={tag}
                                        isSelected={selectedTagIds.includes(
                                            tag.id
                                        )}
                                        onClick={() =>
                                            handleTagSelect(
                                                tag.id
                                            )
                                        }
                                        isPending={
                                            isUpdating
                                        }
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No tags available
                                </p>
                            )}
                            <button
                                onClick={() => {
                                    resetTagForm();
                                    setIsDialogOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40 border border-orange-200 dark:border-orange-700 transition-all duration-200"
                            >
                                <Plus className="w-3 h-3" />
                                Add Tag
                            </button>
                        </div>

                        <TagDialog
                            isOpen={isDialogOpen}
                            setIsOpen={setIsDialogOpen}
                            tag={currentTag}
                            setTag={setCurrentTag}
                            onSave={handleCreateTag}
                            isProcessing={isProcessing}
                            isEditing={isEditing}
                        />
                    </>
                )}
            </div>
        );
    }

    // Full management view
    return (
        <div
            className={cn(
                "bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700",
                !showInline && "pb-20"
            )}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-orange-500" />
                    Tag Management
                </h3>

                <div className="flex items-center gap-2">
                    {/* Search input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tags..."
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(
                                    e.target.value
                                )
                            }
                            className="w-full py-1.5 pl-8 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        />
                        <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Filter dropdown */}
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value as
                                    | "all"
                                    | "genre"
                                    | "content"
                                    | "custom"
                            )
                        }
                        className="py-1.5 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    >
                        <option value="all">
                            All Types
                        </option>
                        <option value="genre">
                            Genres
                        </option>
                        <option value="content">
                            Content Tags
                        </option>
                        <option value="custom">
                            Custom Tags
                        </option>
                    </select>

                    {/* Add tag button */}
                    <button
                        onClick={() => {
                            resetTagForm();
                            setIsDialogOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40 border border-orange-200 dark:border-orange-700 transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" />
                        Add Tag
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {isLoadingState ? (
                    <div className="space-y-4">
                        {/* Section titles */}
                        <div>
                            <Skeleton className="h-5 w-24 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-7 w-16 rounded-full" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                                <Skeleton className="h-7 w-24 rounded-full" />
                                <Skeleton className="h-7 w-18 rounded-full" />
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-5 w-28 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-7 w-32 rounded-full" />
                                <Skeleton className="h-7 w-24 rounded-full" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-5 w-24 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-7 w-22 rounded-full" />
                                <Skeleton className="h-7 w-28 rounded-full" />
                                <Skeleton className="h-7 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Genre tags */}
                        {(filter === "all" ||
                            filter === "genre") &&
                            groupedTags.genre.length >
                                0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                        <Bookmark className="w-4 h-4 mr-1.5 text-orange-500" />
                                        Genres
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedTags.genre.map(
                                            (tag) => (
                                                <TagItem
                                                    key={
                                                        tag.id
                                                    }
                                                    tag={
                                                        tag
                                                    }
                                                    isSelected={selectedTagIds.includes(
                                                        tag.id
                                                    )}
                                                    onClick={
                                                        onTagSelect
                                                            ? () =>
                                                                  handleTagSelect(
                                                                      tag.id
                                                                  )
                                                            : undefined
                                                    }
                                                    onEdit={
                                                        openEditDialog
                                                    }
                                                    onDelete={
                                                        handleDeleteTag
                                                    }
                                                    isPending={
                                                        isUpdating
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Content tags */}
                        {(filter === "all" ||
                            filter === "content") &&
                            groupedTags.content.length >
                                0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                        <Hash className="w-4 h-4 mr-1.5 text-blue-500" />
                                        Content Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedTags.content.map(
                                            (tag) => (
                                                <TagItem
                                                    key={
                                                        tag.id
                                                    }
                                                    tag={
                                                        tag
                                                    }
                                                    isSelected={selectedTagIds.includes(
                                                        tag.id
                                                    )}
                                                    onClick={
                                                        onTagSelect
                                                            ? () =>
                                                                  handleTagSelect(
                                                                      tag.id
                                                                  )
                                                            : undefined
                                                    }
                                                    onEdit={
                                                        openEditDialog
                                                    }
                                                    onDelete={
                                                        handleDeleteTag
                                                    }
                                                    isPending={
                                                        isUpdating
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Custom tags */}
                        {(filter === "all" ||
                            filter === "custom") &&
                            groupedTags.custom.length >
                                0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                        <Palette className="w-4 h-4 mr-1.5 text-purple-500" />
                                        Custom Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedTags.custom.map(
                                            (tag) => (
                                                <TagItem
                                                    key={
                                                        tag.id
                                                    }
                                                    tag={
                                                        tag
                                                    }
                                                    isSelected={selectedTagIds.includes(
                                                        tag.id
                                                    )}
                                                    onClick={
                                                        onTagSelect
                                                            ? () =>
                                                                  handleTagSelect(
                                                                      tag.id
                                                                  )
                                                            : undefined
                                                    }
                                                    onEdit={
                                                        openEditDialog
                                                    }
                                                    onDelete={
                                                        handleDeleteTag
                                                    }
                                                    isPending={
                                                        isUpdating
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {filteredTags.length === 0 && (
                            <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery
                                        ? "No tags match your search"
                                        : "No tags found"}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <TagDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                tag={currentTag}
                setTag={setCurrentTag}
                onSave={handleCreateTag}
                isProcessing={isProcessing}
                isEditing={isEditing}
            />
        </div>
    );
}
