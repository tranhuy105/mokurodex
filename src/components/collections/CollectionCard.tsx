"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Collection } from "@/lib/database/DatabaseInterface";
import { Book, Calendar, Edit, MoreVertical, Trash } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { deleteCollection } from "@/actions/manga-management-actions";
import { useRouter } from "next/navigation";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format the date for display
  const formattedDate = formatDate(collection.updatedAt, { relative: true });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!confirm("Are you sure you want to delete this collection?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteCollection(collection.id);
      if (result) {
        // Show success notification
        const notification = document.createElement("div");
        notification.className =
          "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg";
        notification.textContent = "Collection deleted successfully";
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);

        router.refresh();
        router.push("/collections");
      } else {
        throw new Error("Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);

      // Show error notification
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg";
      notification.textContent =
        error instanceof Error ? error.message : "An unknown error occurred";
      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/collections/${collection.id}/edit`);
  };

  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        {/* Cover Image */}
        <div className="relative pt-[56.25%] bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {collection.coverImage ? (
            <Image
              src={collection.coverImage}
              alt={collection.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <Book className="w-16 h-16" />
            </div>
          )}

          {/* Custom dropdown menu */}
          <div className="absolute top-2 right-2 z-10" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }}
              className="h-8 w-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit collection
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  <span>
                    {isDeleting ? "Deleting..." : "Delete collection"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collection info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-medium text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
            {collection.name}
          </h3>

          {collection.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}

          <div className="mt-auto space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Book className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>{collection.mangaIds?.length || 0} manga</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>Updated {formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
