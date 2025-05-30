"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useCreateTag,
    useDeleteTag,
    useTags,
} from "@/hooks/use-content-management";
import { cn } from "@/lib/utils";
import { Tag, TagType } from "@/types/content";
import {
    Check,
    Loader2,
    Plus,
    Tag as TagIcon,
    X,
} from "lucide-react";
import { useState } from "react";

interface TagManagementProps {
    selectedTagIds?: string[];
    onTagSelect?: (tagId: string) => void;
    onTagsChange?: () => void;
    showInline?: boolean;
    isLoading?: boolean;
}

export function TagManagement({
    selectedTagIds = [],
    onTagSelect,
    onTagsChange,
    showInline = false,
    isLoading = false,
}: TagManagementProps) {
    const { data: tags, isLoading: isTagsLoading } =
        useTags();
    const createTag = useCreateTag();
    const deleteTag = useDeleteTag();

    const [isCreateDialogOpen, setIsCreateDialogOpen] =
        useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] =
        useState("#6366F1");
    const [newTagType, setNewTagType] =
        useState<TagType>("custom");
    const [isCreating, setIsCreating] = useState(false);

    // Group tags by type
    const genreTags =
        tags?.filter((tag) => tag.type === "genre") || [];
    const contentTags =
        tags?.filter((tag) => tag.type === "content") || [];
    const customTags =
        tags?.filter((tag) => tag.type === "custom") || [];

    // Handle create tag
    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;

        setIsCreating(true);
        try {
            await createTag.mutateAsync({
                name: newTagName.trim(),
                color: newTagColor,
                type: newTagType,
            });

            // Reset form
            setNewTagName("");
            setNewTagColor("#6366F1");
            setNewTagType("custom");
            setIsCreateDialogOpen(false);

            // Notify parent component
            if (onTagsChange) {
                onTagsChange();
            }
        } catch (error) {
            console.error("Error creating tag:", error);
        } finally {
            setIsCreating(false);
        }
    };

    // Handle delete tag
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

    // Render a single tag
    const renderTag = (
        tag: Tag,
        isSelected: boolean = false
    ) => {
        // Use the tag's color or a default
        const tagColor = tag.color || "#6366F1";

        return (
            <div
                key={tag.id}
                className={cn(
                    "group flex items-center justify-between px-3 py-1.5 rounded-full text-sm transition-all",
                    isSelected
                        ? "ring-2 ring-white"
                        : "hover:opacity-90",
                    "text-white"
                )}
                style={{
                    backgroundColor: tagColor,
                    ...(isSelected && {
                        boxShadow: `0 0 0 1px white`,
                    }),
                }}
            >
                <div className="w-2 h-2 rounded-full mr-2 bg-white"></div>
                <span className="mr-2">{tag.name}</span>

                {/* Delete button (only shown for custom tags) */}
                {tag.type === "custom" && !showInline && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(tag.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white hover:text-red-200 transition-opacity"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}

                {/* Selected checkmark */}
                {isSelected && showInline && (
                    <Check className="w-3.5 h-3.5 text-white" />
                )}
            </div>
        );
    };

    if (isLoading || isTagsLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">
                    Loading tags...
                </span>
            </div>
        );
    }

    // For inline mode (used in content detail)
    if (showInline) {
        return (
            <div className="space-y-4">
                {/* All tags in a grid */}
                <div className="flex flex-wrap gap-2">
                    {tags?.map((tag) => {
                        const isSelected =
                            selectedTagIds.includes(tag.id);
                        return (
                            <div
                                key={tag.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    onTagSelect &&
                                    onTagSelect(tag.id)
                                }
                            >
                                {renderTag(tag, isSelected)}
                            </div>
                        );
                    })}

                    {tags?.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No tags available. Create some
                            tags to categorize your content.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // For management mode (used in settings)
    return (
        <div className="space-y-6">
            {/* Create Tag Dialog */}
            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Create New Tag</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Create New Tag
                        </DialogTitle>
                        <DialogDescription>
                            Create a new tag to organize
                            your content. Tags can be
                            assigned to any content in your
                            library.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="tag-name"
                                className="text-sm font-medium"
                            >
                                Tag Name
                            </label>
                            <Input
                                id="tag-name"
                                placeholder="e.g., Fantasy, Favorites, To Read"
                                value={newTagName}
                                onChange={(e) =>
                                    setNewTagName(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tag-color"
                                className="text-sm font-medium"
                            >
                                Tag Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    id="tag-color"
                                    value={newTagColor}
                                    onChange={(e) =>
                                        setNewTagColor(
                                            e.target.value
                                        )
                                    }
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <Input
                                    value={newTagColor}
                                    onChange={(e) =>
                                        setNewTagColor(
                                            e.target.value
                                        )
                                    }
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="tag-type"
                                className="text-sm font-medium"
                            >
                                Tag Type
                            </label>
                            <Select
                                value={newTagType}
                                onValueChange={(value) =>
                                    setNewTagType(
                                        value as TagType
                                    )
                                }
                            >
                                <SelectTrigger id="tag-type">
                                    <SelectValue placeholder="Select tag type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="genre">
                                        Genre
                                    </SelectItem>
                                    <SelectItem value="content">
                                        Content Warning
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        Custom
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsCreateDialogOpen(false)
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateTag}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Tag"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Tags by category */}
            <div className="space-y-6">
                {/* Genre Tags */}
                <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-blue-500" />
                        <span>Genre Tags</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {genreTags.length > 0 ? (
                            genreTags.map((tag) =>
                                renderTag(tag)
                            )
                        ) : (
                            <p className="text-sm text-gray-500">
                                No genre tags available.
                            </p>
                        )}
                    </div>
                </div>

                {/* Content Tags */}
                <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-amber-500" />
                        <span>Content Warning Tags</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {contentTags.length > 0 ? (
                            contentTags.map((tag) =>
                                renderTag(tag)
                            )
                        ) : (
                            <p className="text-sm text-gray-500">
                                No content warning tags
                                available.
                            </p>
                        )}
                    </div>
                </div>

                {/* Custom Tags */}
                <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-purple-500" />
                        <span>Custom Tags</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {customTags.length > 0 ? (
                            customTags.map((tag) =>
                                renderTag(tag)
                            )
                        ) : (
                            <p className="text-sm text-gray-500">
                                No custom tags available.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
