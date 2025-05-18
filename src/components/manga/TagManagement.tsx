"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Tag as TagIcon,
  Bookmark,
  Edit,
  Trash2,
  Plus,
  Hash,
  Palette,
} from "lucide-react";
import {
  fetchTags,
  addTag,
  modifyTag,
  removeTag,
} from "@/actions/manga-management-api-prisma";
import { Tag } from "@prisma/client";
import { Skeleton } from "@/components/ui/Skeleton";

// Global cache for tags to prevent repeated fetching
let tagsCache: Tag[] | null = null;
let lastFetchTime = 0;
const CACHE_TIMEOUT = 60000; // 1 minute cache timeout

interface TagManagementProps {
  onTagsChange?: () => void;
  showInline?: boolean;
  selectedTagIds?: string[];
  onTagSelect?: (tagId: string) => void;
  isLoading?: boolean;
}

export function TagManagement({
  onTagsChange,
  showInline = false,
  selectedTagIds = [],
  onTagSelect,
  isLoading: externalLoading,
}: TagManagementProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState<"all" | "genre" | "content" | "custom">(
    "all"
  );
  const [internalLoading, setInternalLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState<{
    name: string;
    color: string;
    type: "genre" | "content" | "custom";
  }>({
    name: "",
    color: "blue",
    type: "custom",
  });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Available colors for tags
  const availableColors = [
    "gray",
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];

  // Filter tags based on type and search query
  const filterTags = useCallback(
    (
      tagList: Tag[],
      tagFilter: "all" | "genre" | "content" | "custom",
      query: string
    ) => {
      let filtered = tagList;

      // Filter by type
      if (tagFilter !== "all") {
        filtered = filtered.filter((tag) => tag.type === tagFilter);
      }

      // Filter by search query
      if (query.trim() !== "") {
        const lowercaseQuery = query.toLowerCase();
        filtered = filtered.filter((tag) =>
          tag.name.toLowerCase().includes(lowercaseQuery)
        );
      }

      setFilteredTags(filtered);
    },
    []
  );

  // Load tags with caching
  const loadTags = useCallback(async () => {
    console.log("[TagManagement] Loading tags");
    setInternalLoading(true);

    try {
      // Check cache first
      const now = Date.now();
      if (tagsCache && now - lastFetchTime < CACHE_TIMEOUT) {
        console.log("[TagManagement] Using cached tags:", tagsCache.length);
        setTags(tagsCache);
        filterTags(tagsCache, filter, searchQuery);
        setInternalLoading(false);
        return;
      }

      // Fetch from server if cache is expired or empty
      console.log("[TagManagement] Fetching tags from server");
      const tagsData = await fetchTags();
      console.log("[TagManagement] Fetched tags:", tagsData.length);

      // Update cache
      tagsCache = tagsData;
      lastFetchTime = now;

      setTags(tagsData);
      filterTags(tagsData, filter, searchQuery);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setInternalLoading(false);
    }
  }, [filter, searchQuery, filterTags]);

  // Load tags on mount and when filter changes
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // Also update filtered tags when the filter or search query changes
  useEffect(() => {
    if (tags.length > 0) {
      filterTags(tags, filter, searchQuery);
    }
  }, [filter, searchQuery, tags, filterTags]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle tag creation
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;

    try {
      console.log("[TagManagement] Creating new tag:", newTag);
      const createdTag = await addTag(newTag);

      if (createdTag) {
        console.log("[TagManagement] Tag created:", createdTag);

        // Update cache
        if (tagsCache) {
          tagsCache = [...tagsCache, createdTag];
        }

        // Update state
        const updatedTags = [...tags, createdTag];
        setTags(updatedTags);
        filterTags(updatedTags, filter, searchQuery);

        // Reset form
        setNewTag({
          name: "",
          color: "blue",
          type: "custom",
        });
        setIsAddingTag(false);

        // Notify parent
        if (onTagsChange) {
          onTagsChange();
        }
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  // Update a tag
  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const updatedTag = await modifyTag(editingTag.id, {
        name: editingTag.name,
        color: editingTag.color || undefined,
        type: editingTag.type as "genre" | "content" | "custom",
      });
      if (updatedTag) {
        setTags((prev) =>
          prev.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag))
        );
        filterTags(
          tags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)),
          filter,
          searchQuery
        );
        setEditingTag(null);
        onTagsChange?.();
      }
    } catch (error) {
      console.error("Error updating tag:", error);
    }
  };

  // Delete a tag
  const handleDeleteTag = async (id: string) => {
    try {
      const success = await removeTag(id);
      if (success) {
        setTags((prev) => prev.filter((tag) => tag.id !== id));
        filterTags(
          tags.filter((tag) => tag.id !== id),
          filter,
          searchQuery
        );
        onTagsChange?.();
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
    }
  };

  // Group tags by type for better organization
  const groupedTags = {
    genre: filteredTags.filter((tag) => tag.type === "genre"),
    content: filteredTags.filter((tag) => tag.type === "content"),
    custom: filteredTags.filter((tag) => tag.type === "custom"),
  };

  // For inline display (used in manga detail page)
  if (showInline) {
    // Use external loading state if provided, otherwise use internal
    const isLoadingState =
      externalLoading !== undefined ? externalLoading : internalLoading;

    // Helper function to get color classes for a tag
    const getTagColorClasses = (tag: Tag, isSelected: boolean) => {
      const color = tag.color || "blue";

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

    return (
      <div className="space-y-4">
        {isLoadingState ? (
          <div className="flex flex-wrap gap-2">
            {/* Use predefined widths for better reliability */}
            <Skeleton key="tag1" className="h-7 w-24 rounded-full" />
            <Skeleton key="tag2" className="h-7 w-16 rounded-full" />
            <Skeleton key="tag3" className="h-7 w-20 rounded-full" />
            <Skeleton key="tag4" className="h-7 w-32 rounded-full" />
            <Skeleton key="tag5" className="h-7 w-28 rounded-full" />
            <Skeleton key="tag6" className="h-7 w-14 rounded-full" />
            <Skeleton key="tag7" className="h-7 w-24 rounded-full" />
            <Skeleton key="tag8" className="h-7 w-18 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                onClick={() => onTagSelect?.(tag.id)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
                  transition-colors cursor-pointer
                  ${getTagColorClasses(tag, selectedTagIds.includes(tag.id))}
                `}
              >
                {tag.name}
              </div>
            ))}
            <button
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40"
            >
              <Plus className="w-3 h-3" />
              Add Tag
            </button>
          </div>
        )}

        {/* Add tag modal */}
        {isAddingTag && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add New Tag
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) =>
                      setNewTag({ ...newTag, name: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                    placeholder="Tag name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newTag.type}
                    onChange={(e) =>
                      setNewTag({
                        ...newTag,
                        type: e.target.value as "genre" | "content" | "custom",
                      })
                    }
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                  >
                    <option value="genre">Genre</option>
                    <option value="content">Content</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableColors.map((color) => {
                      // Create classNames based on the color
                      const isSelected = newTag.color === color;
                      const textClass = isSelected
                        ? color === "gray"
                          ? "text-gray-700 dark:text-gray-400"
                          : color === "red"
                          ? "text-red-700 dark:text-red-400"
                          : color === "orange"
                          ? "text-orange-700 dark:text-orange-400"
                          : color === "amber"
                          ? "text-amber-700 dark:text-amber-400"
                          : color === "yellow"
                          ? "text-yellow-700 dark:text-yellow-400"
                          : color === "lime"
                          ? "text-lime-700 dark:text-lime-400"
                          : color === "green"
                          ? "text-green-700 dark:text-green-400"
                          : color === "emerald"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : color === "teal"
                          ? "text-teal-700 dark:text-teal-400"
                          : color === "cyan"
                          ? "text-cyan-700 dark:text-cyan-400"
                          : color === "sky"
                          ? "text-sky-700 dark:text-sky-400"
                          : color === "blue"
                          ? "text-blue-700 dark:text-blue-400"
                          : color === "indigo"
                          ? "text-indigo-700 dark:text-indigo-400"
                          : color === "violet"
                          ? "text-violet-700 dark:text-violet-400"
                          : color === "purple"
                          ? "text-purple-700 dark:text-purple-400"
                          : color === "fuchsia"
                          ? "text-fuchsia-700 dark:text-fuchsia-400"
                          : color === "pink"
                          ? "text-pink-700 dark:text-pink-400"
                          : color === "rose"
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400";

                      const bgClass =
                        color === "gray"
                          ? "bg-gray-500"
                          : color === "red"
                          ? "bg-red-500"
                          : color === "orange"
                          ? "bg-orange-500"
                          : color === "amber"
                          ? "bg-amber-500"
                          : color === "yellow"
                          ? "bg-yellow-500"
                          : color === "lime"
                          ? "bg-lime-500"
                          : color === "green"
                          ? "bg-green-500"
                          : color === "emerald"
                          ? "bg-emerald-500"
                          : color === "teal"
                          ? "bg-teal-500"
                          : color === "cyan"
                          ? "bg-cyan-500"
                          : color === "sky"
                          ? "bg-sky-500"
                          : color === "blue"
                          ? "bg-blue-500"
                          : color === "indigo"
                          ? "bg-indigo-500"
                          : color === "violet"
                          ? "bg-violet-500"
                          : color === "purple"
                          ? "bg-purple-500"
                          : color === "fuchsia"
                          ? "bg-fuchsia-500"
                          : color === "pink"
                          ? "bg-pink-500"
                          : color === "rose"
                          ? "bg-rose-500"
                          : "bg-blue-500";

                      const borderClass = isSelected
                        ? color === "gray"
                          ? "border-gray-500 ring-2 ring-gray-500"
                          : color === "red"
                          ? "border-red-500 ring-2 ring-red-500"
                          : color === "orange"
                          ? "border-orange-500 ring-2 ring-orange-500"
                          : color === "amber"
                          ? "border-amber-500 ring-2 ring-amber-500"
                          : color === "yellow"
                          ? "border-yellow-500 ring-2 ring-yellow-500"
                          : color === "lime"
                          ? "border-lime-500 ring-2 ring-lime-500"
                          : color === "green"
                          ? "border-green-500 ring-2 ring-green-500"
                          : color === "emerald"
                          ? "border-emerald-500 ring-2 ring-emerald-500"
                          : color === "teal"
                          ? "border-teal-500 ring-2 ring-teal-500"
                          : color === "cyan"
                          ? "border-cyan-500 ring-2 ring-cyan-500"
                          : color === "sky"
                          ? "border-sky-500 ring-2 ring-sky-500"
                          : color === "blue"
                          ? "border-blue-500 ring-2 ring-blue-500"
                          : color === "indigo"
                          ? "border-indigo-500 ring-2 ring-indigo-500"
                          : color === "violet"
                          ? "border-violet-500 ring-2 ring-violet-500"
                          : color === "purple"
                          ? "border-purple-500 ring-2 ring-purple-500"
                          : color === "fuchsia"
                          ? "border-fuchsia-500 ring-2 ring-fuchsia-500"
                          : color === "pink"
                          ? "border-pink-500 ring-2 ring-pink-500"
                          : color === "rose"
                          ? "border-rose-500 ring-2 ring-rose-500"
                          : "border-blue-500 ring-2 ring-blue-500"
                        : "border-transparent";

                      return (
                        <div
                          key={color}
                          onClick={() => setNewTag({ ...newTag, color })}
                          className={`flex flex-col items-center cursor-pointer ${textClass} ${
                            isSelected ? "font-medium" : ""
                          }`}
                        >
                          <div
                            className={`w-full h-8 mb-1 rounded-md ${bgClass} border-2 ${borderClass} ${
                              isSelected ? "ring-opacity-50" : ""
                            }`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setIsAddingTag(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full management view (used in dedicated tag management section)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
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
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full py-1.5 pl-8 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
            />
            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as "all" | "genre" | "content" | "custom"
              )
            }
            className="py-1.5 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
          >
            <option value="all">All Types</option>
            <option value="genre">Genres</option>
            <option value="content">Content Tags</option>
            <option value="custom">Custom Tags</option>
          </select>

          {/* Add tag button */}
          <button
            onClick={() => setIsAddingTag(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {internalLoading ? (
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
            {(filter === "all" || filter === "genre") &&
              groupedTags.genre.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Bookmark className="w-4 h-4 mr-1.5 text-orange-500" />
                    Genres
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {groupedTags.genre.map((tag) => (
                      <TagItem
                        key={tag.id}
                        tag={tag}
                        onEdit={(tag) => setEditingTag(tag)}
                        onDelete={handleDeleteTag}
                        isSelected={selectedTagIds.includes(tag.id)}
                        onSelect={onTagSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Content tags */}
            {(filter === "all" || filter === "content") &&
              groupedTags.content.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Hash className="w-4 h-4 mr-1.5 text-blue-500" />
                    Content Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {groupedTags.content.map((tag) => (
                      <TagItem
                        key={tag.id}
                        tag={tag}
                        onEdit={(tag) => setEditingTag(tag)}
                        onDelete={handleDeleteTag}
                        isSelected={selectedTagIds.includes(tag.id)}
                        onSelect={onTagSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Custom tags */}
            {(filter === "all" || filter === "custom") &&
              groupedTags.custom.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <Palette className="w-4 h-4 mr-1.5 text-purple-500" />
                    Custom Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {groupedTags.custom.map((tag) => (
                      <TagItem
                        key={tag.id}
                        tag={tag}
                        onEdit={(tag) => setEditingTag(tag)}
                        onDelete={handleDeleteTag}
                        isSelected={selectedTagIds.includes(tag.id)}
                        onSelect={onTagSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

            {filteredTags.length === 0 && (
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? "No tags match your search" : "No tags found"}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add tag modal */}
      {isAddingTag && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Tag
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) =>
                    setNewTag({ ...newTag, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                  placeholder="Tag name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newTag.type}
                  onChange={(e) =>
                    setNewTag({
                      ...newTag,
                      type: e.target.value as "genre" | "content" | "custom",
                    })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                >
                  <option value="genre">Genre</option>
                  <option value="content">Content</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableColors.map((color) => {
                    // Create classNames based on the color
                    const isSelected = newTag.color === color;
                    const textClass = isSelected
                      ? color === "gray"
                        ? "text-gray-700 dark:text-gray-400"
                        : color === "red"
                        ? "text-red-700 dark:text-red-400"
                        : color === "orange"
                        ? "text-orange-700 dark:text-orange-400"
                        : color === "amber"
                        ? "text-amber-700 dark:text-amber-400"
                        : color === "yellow"
                        ? "text-yellow-700 dark:text-yellow-400"
                        : color === "lime"
                        ? "text-lime-700 dark:text-lime-400"
                        : color === "green"
                        ? "text-green-700 dark:text-green-400"
                        : color === "emerald"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : color === "teal"
                        ? "text-teal-700 dark:text-teal-400"
                        : color === "cyan"
                        ? "text-cyan-700 dark:text-cyan-400"
                        : color === "sky"
                        ? "text-sky-700 dark:text-sky-400"
                        : color === "blue"
                        ? "text-blue-700 dark:text-blue-400"
                        : color === "indigo"
                        ? "text-indigo-700 dark:text-indigo-400"
                        : color === "violet"
                        ? "text-violet-700 dark:text-violet-400"
                        : color === "purple"
                        ? "text-purple-700 dark:text-purple-400"
                        : color === "fuchsia"
                        ? "text-fuchsia-700 dark:text-fuchsia-400"
                        : color === "pink"
                        ? "text-pink-700 dark:text-pink-400"
                        : color === "rose"
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400";

                    const bgClass =
                      color === "gray"
                        ? "bg-gray-500"
                        : color === "red"
                        ? "bg-red-500"
                        : color === "orange"
                        ? "bg-orange-500"
                        : color === "amber"
                        ? "bg-amber-500"
                        : color === "yellow"
                        ? "bg-yellow-500"
                        : color === "lime"
                        ? "bg-lime-500"
                        : color === "green"
                        ? "bg-green-500"
                        : color === "emerald"
                        ? "bg-emerald-500"
                        : color === "teal"
                        ? "bg-teal-500"
                        : color === "cyan"
                        ? "bg-cyan-500"
                        : color === "sky"
                        ? "bg-sky-500"
                        : color === "blue"
                        ? "bg-blue-500"
                        : color === "indigo"
                        ? "bg-indigo-500"
                        : color === "violet"
                        ? "bg-violet-500"
                        : color === "purple"
                        ? "bg-purple-500"
                        : color === "fuchsia"
                        ? "bg-fuchsia-500"
                        : color === "pink"
                        ? "bg-pink-500"
                        : color === "rose"
                        ? "bg-rose-500"
                        : "bg-blue-500";

                    const borderClass = isSelected
                      ? color === "gray"
                        ? "border-gray-500 ring-2 ring-gray-500"
                        : color === "red"
                        ? "border-red-500 ring-2 ring-red-500"
                        : color === "orange"
                        ? "border-orange-500 ring-2 ring-orange-500"
                        : color === "amber"
                        ? "border-amber-500 ring-2 ring-amber-500"
                        : color === "yellow"
                        ? "border-yellow-500 ring-2 ring-yellow-500"
                        : color === "lime"
                        ? "border-lime-500 ring-2 ring-lime-500"
                        : color === "green"
                        ? "border-green-500 ring-2 ring-green-500"
                        : color === "emerald"
                        ? "border-emerald-500 ring-2 ring-emerald-500"
                        : color === "teal"
                        ? "border-teal-500 ring-2 ring-teal-500"
                        : color === "cyan"
                        ? "border-cyan-500 ring-2 ring-cyan-500"
                        : color === "sky"
                        ? "border-sky-500 ring-2 ring-sky-500"
                        : color === "blue"
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : color === "indigo"
                        ? "border-indigo-500 ring-2 ring-indigo-500"
                        : color === "violet"
                        ? "border-violet-500 ring-2 ring-violet-500"
                        : color === "purple"
                        ? "border-purple-500 ring-2 ring-purple-500"
                        : color === "fuchsia"
                        ? "border-fuchsia-500 ring-2 ring-fuchsia-500"
                        : color === "pink"
                        ? "border-pink-500 ring-2 ring-pink-500"
                        : color === "rose"
                        ? "border-rose-500 ring-2 ring-rose-500"
                        : "border-blue-500 ring-2 ring-blue-500"
                      : "border-transparent";

                    return (
                      <div
                        key={color}
                        onClick={() => setNewTag({ ...newTag, color })}
                        className={`flex flex-col items-center cursor-pointer ${textClass} ${
                          isSelected ? "font-medium" : ""
                        }`}
                      >
                        <div
                          className={`w-full h-8 mb-1 rounded-md ${bgClass} border-2 ${borderClass} ${
                            isSelected ? "ring-opacity-50" : ""
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setIsAddingTag(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTag}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit tag modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Tag
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={editingTag.type}
                  onChange={(e) =>
                    setEditingTag({
                      ...editingTag,
                      type: e.target.value as "genre" | "content" | "custom",
                    })
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700"
                >
                  <option value="genre">Genre</option>
                  <option value="content">Content</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableColors.map((color) => {
                    // Create classNames based on the color
                    const isSelected = editingTag.color === color;
                    const textClass = isSelected
                      ? color === "gray"
                        ? "text-gray-700 dark:text-gray-400"
                        : color === "red"
                        ? "text-red-700 dark:text-red-400"
                        : color === "orange"
                        ? "text-orange-700 dark:text-orange-400"
                        : color === "amber"
                        ? "text-amber-700 dark:text-amber-400"
                        : color === "yellow"
                        ? "text-yellow-700 dark:text-yellow-400"
                        : color === "lime"
                        ? "text-lime-700 dark:text-lime-400"
                        : color === "green"
                        ? "text-green-700 dark:text-green-400"
                        : color === "emerald"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : color === "teal"
                        ? "text-teal-700 dark:text-teal-400"
                        : color === "cyan"
                        ? "text-cyan-700 dark:text-cyan-400"
                        : color === "sky"
                        ? "text-sky-700 dark:text-sky-400"
                        : color === "blue"
                        ? "text-blue-700 dark:text-blue-400"
                        : color === "indigo"
                        ? "text-indigo-700 dark:text-indigo-400"
                        : color === "violet"
                        ? "text-violet-700 dark:text-violet-400"
                        : color === "purple"
                        ? "text-purple-700 dark:text-purple-400"
                        : color === "fuchsia"
                        ? "text-fuchsia-700 dark:text-fuchsia-400"
                        : color === "pink"
                        ? "text-pink-700 dark:text-pink-400"
                        : color === "rose"
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-blue-700 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400";

                    const bgClass =
                      color === "gray"
                        ? "bg-gray-500"
                        : color === "red"
                        ? "bg-red-500"
                        : color === "orange"
                        ? "bg-orange-500"
                        : color === "amber"
                        ? "bg-amber-500"
                        : color === "yellow"
                        ? "bg-yellow-500"
                        : color === "lime"
                        ? "bg-lime-500"
                        : color === "green"
                        ? "bg-green-500"
                        : color === "emerald"
                        ? "bg-emerald-500"
                        : color === "teal"
                        ? "bg-teal-500"
                        : color === "cyan"
                        ? "bg-cyan-500"
                        : color === "sky"
                        ? "bg-sky-500"
                        : color === "blue"
                        ? "bg-blue-500"
                        : color === "indigo"
                        ? "bg-indigo-500"
                        : color === "violet"
                        ? "bg-violet-500"
                        : color === "purple"
                        ? "bg-purple-500"
                        : color === "fuchsia"
                        ? "bg-fuchsia-500"
                        : color === "pink"
                        ? "bg-pink-500"
                        : color === "rose"
                        ? "bg-rose-500"
                        : "bg-blue-500";

                    const borderClass = isSelected
                      ? color === "gray"
                        ? "border-gray-500 ring-2 ring-gray-500"
                        : color === "red"
                        ? "border-red-500 ring-2 ring-red-500"
                        : color === "orange"
                        ? "border-orange-500 ring-2 ring-orange-500"
                        : color === "amber"
                        ? "border-amber-500 ring-2 ring-amber-500"
                        : color === "yellow"
                        ? "border-yellow-500 ring-2 ring-yellow-500"
                        : color === "lime"
                        ? "border-lime-500 ring-2 ring-lime-500"
                        : color === "green"
                        ? "border-green-500 ring-2 ring-green-500"
                        : color === "emerald"
                        ? "border-emerald-500 ring-2 ring-emerald-500"
                        : color === "teal"
                        ? "border-teal-500 ring-2 ring-teal-500"
                        : color === "cyan"
                        ? "border-cyan-500 ring-2 ring-cyan-500"
                        : color === "sky"
                        ? "border-sky-500 ring-2 ring-sky-500"
                        : color === "blue"
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : color === "indigo"
                        ? "border-indigo-500 ring-2 ring-indigo-500"
                        : color === "violet"
                        ? "border-violet-500 ring-2 ring-violet-500"
                        : color === "purple"
                        ? "border-purple-500 ring-2 ring-purple-500"
                        : color === "fuchsia"
                        ? "border-fuchsia-500 ring-2 ring-fuchsia-500"
                        : color === "pink"
                        ? "border-pink-500 ring-2 ring-pink-500"
                        : color === "rose"
                        ? "border-rose-500 ring-2 ring-rose-500"
                        : "border-blue-500 ring-2 ring-blue-500"
                      : "border-transparent";

                    return (
                      <div
                        key={color}
                        onClick={() => setEditingTag({ ...editingTag, color })}
                        className={`flex flex-col items-center cursor-pointer ${textClass} ${
                          isSelected ? "font-medium" : ""
                        }`}
                      >
                        <div
                          className={`w-full h-8 mb-1 rounded-md ${bgClass} border-2 ${borderClass} ${
                            isSelected ? "ring-opacity-50" : ""
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTag}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual tag item component
interface TagItemProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function TagItem({
  tag,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}: TagItemProps) {
  const [showActions, setShowActions] = useState(false);

  // Get color classes based on the tag's color
  const getColorClasses = (color: string | undefined | null) => {
    // Convert null to undefined for consistency
    const safeColor = color || undefined;

    if (isSelected) {
      switch (safeColor) {
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
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const colorClasses = getColorClasses(tag.color);

  return (
    <div
      className={`
        group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium 
        transition-colors ${colorClasses}
        ${
          onSelect
            ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            : ""
        }
      `}
      onClick={() => onSelect?.(tag.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <span>{tag.name}</span>

      {showActions && !onSelect && (
        <div className="absolute right-0 top-0 h-full flex items-center gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tag);
            }}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tag.id);
            }}
            className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
