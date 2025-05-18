"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateCollection,
  addMangaToCollection,
  removeMangaFromCollection,
  searchMangaByTitle,
} from "@/actions/manga-management-prisma";
import {
  Upload,
  X,
  Image as ImageIcon,
  Search,
  Plus,
  Book,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MangaMetadata } from "@/types/manga";
import { Collection, UserMangaMetadata } from "@prisma/client";

// Define the extended Collection type that includes mangaIds
interface ExtendedCollection extends Collection {
  mangaIds: string[];
}

interface EditCollectionFormProps {
  collection: ExtendedCollection;
  initialManga: Array<MangaMetadata & { userData: UserMangaMetadata | null }>;
}

export function EditCollectionForm({
  collection,
  initialManga,
}: EditCollectionFormProps) {
  const router = useRouter();

  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || "");
  const [coverImage, setCoverImage] = useState<string | null>(
    collection.coverImage || null
  );
  const [mangaIds, setMangaIds] = useState<string[]>(collection.mangaIds || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // For adding manga
  const [isAddingManga, setIsAddingManga] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<MangaMetadata & { userData: UserMangaMetadata | null }>
  >([]);
  const [currentManga, setCurrentManga] =
    useState<Array<MangaMetadata & { userData: UserMangaMetadata | null }>>(
      initialManga
    );

  // Handle cover image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("The image must be less than 5MB");
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
      setErrorMessage("Please provide a name for the collection");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await updateCollection(collection.id, {
        name,
        description: description || undefined,
        coverImage: coverImage === null ? undefined : coverImage,
        mangaIds,
      });

      if (result) {
        setSuccessMessage("Collection has been updated successfully");
        setTimeout(() => {
          router.push(`/collections/${collection.id}`);
        }, 1000);
      } else {
        throw new Error("Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search for manga to add
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Use the new advanced search function
      const results = await searchMangaByTitle(searchQuery);

      // Filter out manga that are already in the collection
      const filteredResults = results.filter(
        (manga) => !mangaIds.includes(manga.id)
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching manga:", error);
      setErrorMessage("Failed to search manga");
    }
  };

  // Handle key down in search field
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };

  // Add manga to collection
  const handleAddManga = async (mangaId: string) => {
    try {
      const result = await addMangaToCollection(collection.id, mangaId);
      if (result) {
        // Update local state
        setMangaIds((prev) => [...prev, mangaId]);

        // Update displayed manga
        const manga = searchResults.find((m) => m.id === mangaId);
        if (manga) {
          setCurrentManga((prev) => [...prev, manga]);
        }

        // Remove from search results
        setSearchResults((prev) => prev.filter((m) => m.id !== mangaId));

        setSuccessMessage("Manga added to collection");
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        throw new Error("Failed to add manga to collection");
      }
    } catch (error) {
      console.error("Error adding manga:", error);
      setErrorMessage("Failed to add manga to collection");
    }
  };

  // Remove manga from collection
  const handleRemoveManga = async (mangaId: string) => {
    try {
      const result = await removeMangaFromCollection(collection.id, mangaId);
      if (result) {
        // Update local state
        setMangaIds((prev) => prev.filter((id) => id !== mangaId));

        // Update displayed manga
        setCurrentManga((prev) => prev.filter((m) => m.id !== mangaId));

        setSuccessMessage("Manga removed from collection");
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        throw new Error("Failed to remove manga from collection");
      }
    } catch (error) {
      console.error("Error removing manga:", error);
      setErrorMessage("Failed to remove manga from collection");
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Describe this collection..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-600 dark:focus:border-orange-600"
            />
          </div>

          {/* Cover image upload */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cover Image (optional)
            </span>
            <div className="mt-1 flex items-center gap-6">
              {coverImage ? (
                <div className="relative w-40 h-40 rounded-md overflow-hidden">
                  <Image
                    src={coverImage}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div>
                <label
                  htmlFor="cover-upload"
                  className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${
                    coverImage
                      ? "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      : "bg-orange-600 hover:bg-orange-700 text-white border border-transparent"
                  }`}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{coverImage ? "Change image" : "Upload image"}</span>
                  <input
                    id="cover-upload"
                    name="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Manga in collection */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Manga in this collection
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingManga(!isAddingManga)}
                className="flex items-center px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
              >
                {isAddingManga ? (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    <span>Add Manga</span>
                  </>
                )}
              </button>
            </div>

            {/* Manga search panel */}
            {isAddingManga && (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search manga by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full pl-10 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center shadow-sm"
                  >
                    <Search className="h-5 w-5" />
                    <span className="ml-2 hidden sm:inline">Search</span>
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.map((manga) => (
                      <div
                        key={manga.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                      >
                        {manga.coverImage ? (
                          <div className="relative h-16 w-12 flex-shrink-0 rounded-md overflow-hidden shadow-sm">
                            <Image
                              src={manga.coverImage}
                              alt={manga.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-12 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                            <Book className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {manga.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {manga.volumes} volume
                            {manga.volumes !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddManga(manga.id)}
                          className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                          aria-label="Add to collection"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Book className="h-10 w-10 text-yellow-500 dark:text-yellow-400 mb-3" />
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                        No matching manga found
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                        Try a different search term
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        Type something to search
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Search supports Japanese characters and partial matching
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current manga list */}
            {currentManga.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentManga.map((manga) => (
                  <div
                    key={manga.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200"
                  >
                    {manga.coverImage ? (
                      <div className="relative h-20 w-14 flex-shrink-0 rounded-md overflow-hidden shadow-sm">
                        <Image
                          src={manga.coverImage}
                          alt={manga.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-14 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        <Book className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {manga.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {manga.volumes} volume{manga.volumes !== 1 ? "s" : ""}
                      </p>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          In collection
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveManga(manga.id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
                      aria-label="Remove from collection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Book className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                    No manga in this collection yet
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    {" "}
                    Click &quot;Add Manga&quot; to start adding manga to this
                    collection{" "}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href={`/collections/${collection.id}`}>
              <button
                type="button"
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
