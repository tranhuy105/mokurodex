"use client";

import { cn } from "@/lib/utils";
import { Tag } from "@/types/content";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AVAILABLE_COLORS } from "./constants";

interface TagItemProps {
    tag: Tag;
    isSelected?: boolean;
    onClick?: () => void;
    onEdit?: (tag: Tag) => void;
    onDelete?: (id: string) => void;
    isPending?: boolean;
}

export function TagItem({
    tag,
    isSelected = false,
    onClick,
    onEdit,
    onDelete,
    isPending = false,
}: TagItemProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { theme } = useTheme();

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                ) &&
                buttonRef.current &&
                !buttonRef.current.contains(
                    event.target as Node
                )
            ) {
                setShowMenu(false);
            }
        }

        if (showMenu) {
            document.addEventListener(
                "mousedown",
                handleClickOutside
            );
            return () =>
                document.removeEventListener(
                    "mousedown",
                    handleClickOutside
                );
        }
    }, [showMenu]);

    // Get the color styling based on the tag's color and current theme
    const getTagStyling = () => {
        const tagColor = (tag.color || "#3B82F6")
            .toLowerCase()
            .trim();

        const colorData = AVAILABLE_COLORS.find(
            (c) => c.name === tagColor
        );

        if (colorData && colorData.name) {
            const isDark = theme === "dark";
            const styles = isDark
                ? colorData.dark
                : colorData.light;

            return {
                bg: styles.bg,
                text: styles.text,
                border: styles.border,
                hover: styles.hover,
                selected: `ring-${colorData.name}-400`,
                name: colorData.name,
                hex: colorData.hex,
            };
        }

        // Fallback for custom colors - use neutral styling
        return theme === "dark"
            ? {
                  bg: "bg-gray-800/30",
                  text: "text-gray-300",
                  border: "border-gray-700",
                  hover: "hover:bg-gray-700/40",
                  selected: "ring-gray-600",
                  name: "gray",
                  hex: "#6B7280",
              }
            : {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                  border: "border-gray-200",
                  hover: "hover:bg-gray-200",
                  selected: "ring-gray-400",
                  name: "gray",
                  hex: "#9CA3AF",
              };
    };

    const styling = getTagStyling();
    const hasActions = (onEdit || onDelete) && !isPending;

    const handleTagClick = (e: React.MouseEvent) => {
        // Don't trigger onClick if clicking on the menu button
        if (buttonRef.current?.contains(e.target as Node)) {
            return;
        }
        if (!isPending && onClick) {
            onClick();
        }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onEdit) onEdit(tag);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onDelete) onDelete(tag.id);
    };

    return (
        <div className="relative">
            <div
                className={cn(
                    "group inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border shadow-sm min-h-[36px] transition-all duration-300 ease-out cursor-default",
                    styling.bg,
                    styling.text,
                    styling.border,
                    // Interactive states
                    onClick &&
                        !isPending &&
                        "cursor-pointer hover:shadow-md hover:scale-[1.02]",
                    onClick && !isPending && styling.hover,
                    // Selected state with smooth transition
                    isSelected &&
                        !isPending &&
                        "ring-2 shadow-md scale-[1.02]",
                    isSelected &&
                        !isPending &&
                        styling.selected,
                    // Pending state - keep some visual feedback but more subtle
                    isPending && "opacity-80 cursor-wait ",
                    hasActions && "pr-1" // Less padding on right when actions are present
                )}
                onClick={handleTagClick}
            >
                <span className="font-medium select-none">
                    {tag.name}
                </span>

                {/* Menu trigger button */}
                {hasActions && (
                    <button
                        ref={buttonRef}
                        onClick={handleMenuClick}
                        className={cn(
                            "ml-1 p-1.5 rounded-full transition-colors flex-shrink-0 opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1",
                            "hover:bg-black/10 dark:hover:bg-white/15",
                            "focus:ring-black/20 dark:focus:ring-white/20",
                            showMenu &&
                                "opacity-100 bg-black/10 dark:bg-white/15"
                        )}
                        aria-label="Tag actions"
                        type="button"
                    >
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown menu */}
            {showMenu && hasActions && (
                <div
                    ref={menuRef}
                    className={cn(
                        "absolute right-0 top-full mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px]",
                        "animate-in fade-in-0 zoom-in-95 duration-100"
                    )}
                >
                    {onEdit && (
                        <button
                            onClick={handleEdit}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
