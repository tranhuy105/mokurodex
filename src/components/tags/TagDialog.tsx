"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TagType } from "@/types/content";
import { Loader2 } from "lucide-react";
import { AVAILABLE_COLORS } from "./constants";

// Tag dialog component for creating/editing tags
interface TagDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    tag: {
        id?: string;
        name: string;
        color: string;
        type: TagType;
    };
    setTag: (tag: {
        id?: string;
        name: string;
        color: string;
        type: TagType;
    }) => void;
    onSave: () => void;
    isProcessing: boolean;
    isEditing: boolean;
}

export function TagDialog({
    isOpen,
    setIsOpen,
    tag,
    setTag,
    onSave,
    isProcessing,
    isEditing,
}: TagDialogProps) {
    // Helper function to get color object from name
    const getColorByName = (colorName: string) => {
        return AVAILABLE_COLORS.find(
            (color) =>
                color.name.toLowerCase() ===
                colorName.toLowerCase()
        );
    };

    // Helper function to get current color hex for display
    const getCurrentColorHex = () => {
        const colorObj = getColorByName(tag.color);
        return colorObj?.hex || tag.color; // fallback to tag.color if it's a custom hex
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing
                            ? "Edit Tag"
                            : "Create New Tag"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update this tag's properties."
                            : "Create a new tag to organize your content."}
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
                            value={tag.name}
                            onChange={(e) =>
                                setTag({
                                    ...tag,
                                    name: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Tag Color
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {AVAILABLE_COLORS.map(
                                (color) => {
                                    const isSelected =
                                        tag.color.toLowerCase() ===
                                        color.name.toLowerCase();

                                    return (
                                        <div
                                            key={color.name}
                                            onClick={() =>
                                                setTag({
                                                    ...tag,
                                                    color: color.name, // Store the name, not hex
                                                })
                                            }
                                            className={cn(
                                                "w-full h-8 rounded-md cursor-pointer transition-all",
                                                isSelected &&
                                                    "ring-2 ring-offset-2 ring-black dark:ring-white"
                                            )}
                                            style={{
                                                backgroundColor:
                                                    color.hex,
                                            }}
                                            title={
                                                color.name
                                            }
                                        />
                                    );
                                }
                            )}
                        </div>

                        {/* Custom color input */}
                        <div className="flex items-center gap-3 mt-2">
                            <div
                                className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
                                style={{
                                    backgroundColor:
                                        getCurrentColorHex(),
                                }}
                            />
                            <Input
                                type="text"
                                value={getCurrentColorHex()}
                                disabled={true}
                                className="font-mono"
                                placeholder="#RRGGBB"
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
                            value={tag.type}
                            onValueChange={(value) =>
                                setTag({
                                    ...tag,
                                    type: value as TagType,
                                })
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
                        onClick={() => setIsOpen(false)}
                        disabled={isProcessing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={
                            isProcessing || !tag.name.trim()
                        }
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isEditing
                                    ? "Updating..."
                                    : "Creating..."}
                            </>
                        ) : isEditing ? (
                            "Update Tag"
                        ) : (
                            "Create Tag"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
