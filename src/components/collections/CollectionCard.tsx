"use client";

import { formatDate } from "@/lib/utils";
import { deleteCollection } from "@/server/actions/content-management";
import { ExtendedCollection } from "@/types/content";
import {
    Book,
    Calendar,
    Edit,
    Eye,
    MoreVertical,
    Trash,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

interface CollectionCardProps {
    collection: ExtendedCollection;
}

export function CollectionCard({
    collection,
}: CollectionCardProps) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setMenuOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // Format the date for display
    const formattedDate = formatDate(collection.updatedAt, {
        relative: true,
    });

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (
            !confirm(
                "Are you sure you want to delete this collection?"
            )
        ) {
            return;
        }

        setIsDeleting(true);
        try {
            const success = await deleteCollection({
                id: collection.id,
            });
            if (success) {
                router.refresh();
                router.push("/collections");
            }
        } catch (error) {
            console.error(
                "Failed to delete collection:",
                error
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(`/collections/${collection.id}/edit`);
    };

    return (
        <div
            className="h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/collections/${collection.id}`}>
                <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 h-full flex flex-col transform hover:-translate-y-1">
                    {/* Cover Image */}
                    <div className="relative pt-[56.25%] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {collection.coverImage ? (
                            <Image
                                src={collection.coverImage}
                                alt={collection.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                                <Book className="w-16 h-16" />
                            </div>
                        )}

                        {/* Collection count badge */}
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm flex items-center">
                            <Book className="w-3 h-3 mr-1" />
                            <span>
                                {collection
                                    .collectionContent
                                    ?.length || 0}{" "}
                                content
                            </span>
                        </div>

                        {/* View button overlay on hover */}
                        <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                                isHovered
                                    ? "opacity-100"
                                    : "opacity-0"
                            }`}
                        >
                            <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center space-x-2">
                                <Eye className="h-4 w-4" />
                                <span>View Collection</span>
                            </div>
                        </div>

                        {/* Custom dropdown menu */}
                        <div
                            className="absolute top-2 right-2 z-10"
                            ref={menuRef}
                        >
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMenuOpen(!menuOpen);
                                }}
                                className="h-8 w-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">
                                    Actions
                                </span>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 py-1 z-20 animate-fade-in">
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit collection
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                    <button
                                        onClick={
                                            handleDelete
                                        }
                                        disabled={
                                            isDeleting
                                        }
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                    >
                                        <Trash className="h-4 w-4 mr-2" />
                                        <span>
                                            {isDeleting
                                                ? "Deleting..."
                                                : "Delete collection"}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collection info */}
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {collection.name}
                        </h3>

                        {collection.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                {collection.description}
                            </p>
                        )}

                        <div className="mt-auto space-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                <span>
                                    Updated {formattedDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
