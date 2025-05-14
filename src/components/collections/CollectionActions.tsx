"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Collection } from "@/lib/database/DatabaseInterface";
import { Edit, MoreVertical, Trash, X } from "lucide-react";
import { deleteCollection } from "@/actions/manga-management-actions";
import Link from "next/link";

interface CollectionActionsProps {
  collection: Collection;
}

export function CollectionActions({ collection }: CollectionActionsProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const handleDelete = async () => {
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
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      {/* Custom dropdown menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-9 w-9 flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-md text-white"
        >
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Actions</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 py-1 z-20">
            <Link
              href={`/collections/${collection.id}/edit`}
              className="w-full"
            >
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit collection</span>
              </button>
            </Link>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={() => {
                setMenuOpen(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete collection</span>
            </button>
          </div>
        )}
      </div>

      {/* Custom delete confirmation dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            ref={dialogRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete collection
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete the collection &ldquo;
              {collection.name}&rdquo;? This action cannot be undone and will
              remove the collection, but not the manga inside it.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
