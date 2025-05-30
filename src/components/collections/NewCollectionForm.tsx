"use client";

import { createCollection } from "@/server/actions/content-management";
import {
    Image as ImageIcon,
    Upload,
    X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export function NewCollectionForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState<
        string | null
    >(null);
    const [errorMessage, setErrorMessage] = useState<
        string | null
    >(null);
    const [successMessage, setSuccessMessage] = useState<
        string | null
    >(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setIsSubmitting(true);
        try {
            const result = await createCollection({
                name,
                description: description || undefined,
                coverImage: coverImage || undefined,
                contentIds: [],
            });

            if (result) {
                setSuccessMessage(
                    "Your new collection has been created successfully"
                );
                setTimeout(() => {
                    router.push(
                        `/collections/${result.id}`
                    );
                }, 500);
            } else {
                setErrorMessage(
                    "Failed to create collection"
                );
                setIsSubmitting(false);
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred"
            );
            setIsSubmitting(false);
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
                        rows={4}
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-600 dark:focus:border-orange-600"
                    />
                </div>

                {/* Cover image upload */}
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
                                onChange={handleImageUpload}
                                className="sr-only"
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG, GIF up to 5MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? "Creating..."
                            : "Create Collection"}
                    </button>
                </div>
            </form>
        </>
    );
}
