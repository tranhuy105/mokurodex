"use client";

import {
    addContentToCollection,
    removeContentFromCollection,
    updateCollection,
} from "@/server/actions/content-management";
import {
    ContentWithUserData,
    ExtendedCollection,
} from "@/types/content";
import {
    Book,
    Image as ImageIcon,
    Plus,
    Search,
    Upload,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface EditCollectionFormProps {
    collection: ExtendedCollection;
    initialContent: ContentWithUserData[];
}

export function EditCollectionForm({
    collection,
    initialContent,
}: EditCollectionFormProps) {
    const router = useRouter();

    const [name, setName] = useState(collection.name);
    const [description, setDescription] = useState(
        collection.description || ""
    );
    const [coverImage, setCoverImage] = useState<
        string | null
    >(collection.coverImage || null);
    const [contentIds, setContentIds] = useState<string[]>(
        initialContent.map((content) => content.id) || []
    );
    const [errorMessage, setErrorMessage] = useState<
        string | null
    >(null);
    const [successMessage, setSuccessMessage] = useState<
        string | null
    >(null);

    // For adding content
    const [isAddingContent, setIsAddingContent] =
        useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<
        ContentWithUserData[]
    >([]);
    const [currentContent, setCurrentContent] =
        useState<ContentWithUserData[]>(initialContent);

    // Loading states
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAddingToCollection, setIsAddingToCollection] =
        useState(false);
    const [
        isRemovingFromCollection,
        setIsRemovingFromCollection,
    ] = useState(false);

    // Handle cover image upload
    const handleImageUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage(
                "The image must be less than 5MB"
            );
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setCoverImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Remove the selected image
    const removeImage = () => {
        setCoverImage(null);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setErrorMessage(
                "Please provide a name for the collection"
            );
            setTimeout(() => setErrorMessage(null), 3000);
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updateCollection(
                collection.id,
                {
                    name,
                    description: description || undefined,
                    coverImage: coverImage || undefined,
                    contentIds,
                }
            );

            if (result) {
                setSuccessMessage(
                    "Collection has been updated successfully"
                );
                setTimeout(() => {
                    router.push(
                        `/collections/${collection.id}`
                    );
                }, 1000);
            } else {
                setErrorMessage(
                    "Failed to update collection"
                );
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to update collection"
            );
        } finally {
            setIsUpdating(false);
        }
    };

    // Search for content to add
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            // Use the search content hook
            const results = await fetch(
                `/api/content/search?query=${encodeURIComponent(
                    searchQuery
                )}`
            ).then((res) => res.json());

            // Filter out content that is already in the collection
            const filteredResults = results.filter(
                (content: ContentWithUserData) =>
                    !contentIds.includes(content.id)
            );

            setSearchResults(filteredResults);
        } catch (error) {
            console.error(
                "Error searching content:",
                error
            );
            setErrorMessage("Failed to search content");
        }
    };

    // Handle key down in search field
    const handleSearchKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission
            handleSearch();
        }
    };

    // Add content to collection
    const handleAddContent = async (contentId: string) => {
        setIsAddingToCollection(true);
        try {
            const success = await addContentToCollection({
                contentId,
                collectionId: collection.id,
            });

            if (success) {
                // Update local state
                setContentIds((prev) => [
                    ...prev,
                    contentId,
                ]);

                // Update displayed content
                const content = searchResults.find(
                    (c) => c.id === contentId
                );
                if (content) {
                    setCurrentContent((prev) => [
                        ...prev,
                        content,
                    ]);
                }

                // Remove from search results
                setSearchResults((prev) =>
                    prev.filter((c) => c.id !== contentId)
                );

                setSuccessMessage(
                    "Content added to collection"
                );
                setTimeout(
                    () => setSuccessMessage(null),
                    2000
                );
            } else {
                setErrorMessage(
                    "Failed to add content to collection"
                );
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to add content to collection"
            );
        } finally {
            setIsAddingToCollection(false);
        }
    };

    // Remove content from collection
    const handleRemoveContent = async (
        contentId: string
    ) => {
        setIsRemovingFromCollection(true);
        try {
            const success =
                await removeContentFromCollection({
                    contentId,
                    collectionId: collection.id,
                });

            if (success) {
                // Update local state
                setContentIds((prev) =>
                    prev.filter((id) => id !== contentId)
                );

                // Update displayed content
                setCurrentContent((prev) =>
                    prev.filter((c) => c.id !== contentId)
                );

                setSuccessMessage(
                    "Content removed from collection"
                );
                setTimeout(
                    () => setSuccessMessage(null),
                    2000
                );
            } else {
                setErrorMessage(
                    "Failed to remove content from collection"
                );
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to remove content from collection"
            );
        } finally {
            setIsRemovingFromCollection(false);
        }
    };

    return (
        <>
            {/* Notification banners */}
            {errorMessage && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-6">
                    {successMessage}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* Name field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Collection Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="e.g., Favorites, Reading Now, Completed"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-600 dark:focus:border-orange-600"
                        />
                    </div>

                    {/* Description field */}
                    <div className="space-y-2">
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Description (optional)
                        </label>
                        <textarea
                            id="description"
                            placeholder="Add a description for your collection"
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-600 dark:focus:border-orange-600"
                        />
                    </div>

                    {/* Cover Image field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cover Image (optional)
                        </label>
                        <div className="flex items-start space-x-6">
                            {/* Image preview */}
                            <div className="relative flex-shrink-0">
                                {coverImage ? (
                                    <div className="relative h-40 w-40 rounded-md overflow-hidden">
                                        <Image
                                            src={coverImage}
                                            alt="Collection cover"
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={
                                                removeImage
                                            }
                                            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">
                                                Remove image
                                            </span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-40 w-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                        <ImageIcon className="h-10 w-10 mb-2" />
                                        <span className="text-sm">
                                            No image
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Upload button */}
                            <div className="flex-1 pt-2">
                                <label
                                    htmlFor="cover-upload"
                                    className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none cursor-pointer"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {coverImage
                                        ? "Change image"
                                        : "Upload image"}
                                </label>
                                <input
                                    id="cover-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleImageUpload
                                    }
                                    className="sr-only"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    PNG, JPG, GIF up to 5MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content in Collection section */}
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Content in Collection
                            </h3>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsAddingContent(
                                        !isAddingContent
                                    )
                                }
                                className="flex items-center px-3 py-1.5 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Content
                            </button>
                        </div>

                        {/* Current content list */}
                        {currentContent.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {currentContent.map(
                                    (content) => (
                                        <div
                                            key={content.id}
                                            className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3 relative group"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-12 h-16 bg-gray-100 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                                                {content.coverImage ? (
                                                    <Image
                                                        src={
                                                            content.coverImage
                                                        }
                                                        alt={
                                                            content.title
                                                        }
                                                        width={
                                                            48
                                                        }
                                                        height={
                                                            64
                                                        }
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Book className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content info */}
                                            <div className="ml-3 flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {
                                                        content.title
                                                    }
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {
                                                        content.volumes
                                                    }{" "}
                                                    {content.volumes ===
                                                    1
                                                        ? "volume"
                                                        : "volumes"}
                                                </p>
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveContent(
                                                        content.id
                                                    )
                                                }
                                                disabled={
                                                    isRemovingFromCollection
                                                }
                                                className="absolute top-1 right-1 bg-white/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Remove
                                                </span>
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 px-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                                <Book className="mx-auto h-10 w-10 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    No content in collection
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Add some content to your
                                    collection.
                                </p>
                            </div>
                        )}

                        {/* Search and add content panel */}
                        {isAddingContent && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    Add Content to
                                    Collection
                                </h4>

                                {/* Search box */}
                                <div className="flex items-center">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by title..."
                                            value={
                                                searchQuery
                                            }
                                            onChange={(e) =>
                                                setSearchQuery(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            onKeyDown={
                                                handleSearchKeyDown
                                            }
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={
                                            handleSearch
                                        }
                                        className="ml-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    >
                                        Search
                                    </button>
                                </div>

                                {/* Search results */}
                                {searchResults.length >
                                0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                                        {searchResults.map(
                                            (content) => (
                                                <div
                                                    key={
                                                        content.id
                                                    }
                                                    className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="w-12 h-16 bg-gray-100 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0">
                                                        {content.coverImage ? (
                                                            <Image
                                                                src={
                                                                    content.coverImage
                                                                }
                                                                alt={
                                                                    content.title
                                                                }
                                                                width={
                                                                    48
                                                                }
                                                                height={
                                                                    64
                                                                }
                                                                className="object-cover w-full h-full"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Book className="h-6 w-6 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Content info */}
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {
                                                                content.title
                                                            }
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {
                                                                content.volumes
                                                            }{" "}
                                                            {content.volumes ===
                                                            1
                                                                ? "volume"
                                                                : "volumes"}
                                                        </p>
                                                    </div>

                                                    {/* Add button */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleAddContent(
                                                                content.id
                                                            )
                                                        }
                                                        disabled={
                                                            isAddingToCollection
                                                        }
                                                        className="ml-2 p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800/40 focus:outline-none"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Add
                                                        </span>
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : searchQuery ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No results
                                            found. Try a
                                            different search
                                            term.
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    {/* Form buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            href={`/collections/${collection.id}`}
                        >
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                Cancel
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
