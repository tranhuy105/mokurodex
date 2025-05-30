"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateUserContentMetadata } from "@/hooks/use-content-management";
import {
    ContentStatus,
    ContentWithUserData,
    UserContentMetadata,
} from "@/types/content";
import {
    BookOpen,
    Check,
    Pencil,
    Star,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ContentManagementPanelProps {
    content: ContentWithUserData;
    userData: UserContentMetadata | null;
    onUpdate: () => void;
}

export function ContentManagementPanel({
    content,
    userData,
    onUpdate,
}: ContentManagementPanelProps) {
    const updateMetadata = useUpdateUserContentMetadata();

    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<{
        rating?: number | null;
        status?: ContentStatus | null;
        notes?: string | null;
        author?: string | null;
        artist?: string | null;
        releaseYear?: number | null;
        publisher?: string | null;
        customCover?: string | null;
        isNsfw?: boolean;
    }>({
        rating: userData?.rating || null,
        status: userData?.status || null,
        notes: userData?.notes || null,
        author: userData?.author || null,
        artist: userData?.artist || null,
        releaseYear: userData?.releaseYear || null,
        publisher: userData?.publisher || null,
        customCover: userData?.customCover || null,
        isNsfw: userData?.isNsfw || false,
    });

    // Update local state when userData changes
    useEffect(() => {
        if (userData) {
            setEditedData({
                rating: userData.rating || null,
                status: userData.status || null,
                notes: userData.notes || null,
                author: userData.author || null,
                artist: userData.artist || null,
                releaseYear: userData.releaseYear || null,
                publisher: userData.publisher || null,
                customCover: userData.customCover || null,
                isNsfw: userData.isNsfw || false,
            });
        }
    }, [userData]);

    // Handle rating click
    const handleRatingClick = async (rating: number) => {
        // Toggle rating off if clicking the same value
        const newRating =
            userData?.rating === rating ? null : rating;

        await updateMetadata.mutateAsync({
            contentId: content.id,
            data: { rating: newRating },
        });

        onUpdate();
    };

    // Handle status change
    const handleStatusChange = async (
        status: ContentStatus | null
    ) => {
        if (!isEditing) {
            await updateMetadata.mutateAsync({
                contentId: content.id,
                data: { status },
            });

            onUpdate();
        } else {
            setEditedData((prev) => ({ ...prev, status }));
        }
    };

    // Handle save changes
    const handleSaveChanges = async () => {
        await updateMetadata.mutateAsync({
            contentId: content.id,
            data: editedData,
        });

        setIsEditing(false);
        onUpdate();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Content Management
                </h3>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setIsEditing(false)
                                }
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20"
                            >
                                <X className="w-4 h-4 mr-1" />
                                <span>Cancel</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveChanges}
                                className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-900/20"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                <span>Save</span>
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                setIsEditing(true)
                            }
                            className="h-8 px-2"
                        >
                            <Pencil className="w-4 h-4 mr-1" />
                            <span>Edit</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rating
                    </label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() =>
                                    handleRatingClick(
                                        rating
                                    )
                                }
                                className={`p-1.5 rounded-md transition-colors ${
                                    (userData?.rating ||
                                        0) >= rating
                                        ? "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                                        : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <Star className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reading Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reading Status
                    </label>
                    <Select
                        value={
                            isEditing
                                ? editedData.status ||
                                  "none"
                                : userData?.status || "none"
                        }
                        onValueChange={(value) =>
                            handleStatusChange(
                                value === "none"
                                    ? null
                                    : (value as ContentStatus)
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                Not Set
                            </SelectItem>
                            <SelectItem value="reading">
                                Reading
                            </SelectItem>
                            <SelectItem value="completed">
                                Completed
                            </SelectItem>
                            <SelectItem value="on-hold">
                                On Hold
                            </SelectItem>
                            <SelectItem value="dropped">
                                Dropped
                            </SelectItem>
                            <SelectItem value="plan-to-read">
                                Plan to Read
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Edit Mode Fields */}
                {isEditing && (
                    <>
                        {/* Author */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Author
                            </label>
                            <Input
                                value={
                                    editedData.author || ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            author:
                                                e.target
                                                    .value ||
                                                null,
                                        })
                                    )
                                }
                                placeholder="Author name"
                            />
                        </div>

                        {/* Artist (if different from author) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Artist (if different from
                                author)
                            </label>
                            <Input
                                value={
                                    editedData.artist || ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            artist:
                                                e.target
                                                    .value ||
                                                null,
                                        })
                                    )
                                }
                                placeholder="Artist name"
                            />
                        </div>

                        {/* Release Year */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Release Year
                            </label>
                            <Input
                                type="number"
                                value={
                                    editedData.releaseYear ||
                                    ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            releaseYear: e
                                                .target
                                                .value
                                                ? parseInt(
                                                      e
                                                          .target
                                                          .value
                                                  )
                                                : null,
                                        })
                                    )
                                }
                                placeholder="YYYY"
                            />
                        </div>

                        {/* Publisher */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Publisher
                            </label>
                            <Input
                                value={
                                    editedData.publisher ||
                                    ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            publisher:
                                                e.target
                                                    .value ||
                                                null,
                                        })
                                    )
                                }
                                placeholder="Publisher name"
                            />
                        </div>

                        {/* Custom Cover URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Custom Cover URL
                            </label>
                            <Input
                                value={
                                    editedData.customCover ||
                                    ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            customCover:
                                                e.target
                                                    .value ||
                                                null,
                                        })
                                    )
                                }
                                placeholder="https://example.com/cover.jpg"
                            />
                        </div>

                        {/* NSFW Toggle */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch
                                id="nsfw-mode"
                                checked={editedData.isNsfw}
                                onCheckedChange={(
                                    checked
                                ) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            isNsfw: checked,
                                        })
                                    )
                                }
                            />
                            <Label htmlFor="nsfw-mode">
                                Mark as NSFW content
                            </Label>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Notes
                            </label>
                            <Textarea
                                value={
                                    editedData.notes || ""
                                }
                                onChange={(e) =>
                                    setEditedData(
                                        (prev) => ({
                                            ...prev,
                                            notes:
                                                e.target
                                                    .value ||
                                                null,
                                        })
                                    )
                                }
                                placeholder="Add your personal notes about this content..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                            window.open(
                                `/content/${content.id}`,
                                "_blank"
                            )
                        }
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Open in New Tab
                    </Button>
                </div>
            </div>
        </div>
    );
}
