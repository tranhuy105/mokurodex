"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createCollection } from "@/actions/manga-management-prisma";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function NewCollectionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      const result = await createCollection({
        name,
        description: description || undefined,
        coverImage: coverImage || undefined,
        mangaIds: [],
      });

      if (result) {
        setSuccessMessage("Your new collection has been created successfully");
        setTimeout(() => {
          router.push(`/collections/${result.id}`);
        }, 1000);
      } else {
        throw new Error("Failed to create collection");
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Create New Collection"
        subtitle="Create a new collection to organize your manga"
        className="mb-8"
      />

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

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
