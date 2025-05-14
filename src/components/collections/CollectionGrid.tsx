"use client";

import React from "react";
import { Collection } from "@/lib/database/DatabaseInterface";
import { CollectionCard } from "./CollectionCard";
import { Plus } from "lucide-react";
import Link from "next/link";

interface CollectionGridProps {
  collections: Collection[];
}

export function CollectionGrid({ collections }: CollectionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}

      {/* New Collection Card */}
      <Link href="/collections/new" className="h-full">
        <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-6 h-full transition-colors hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-orange-500 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Create Collection
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Organize your manga into custom collections
          </p>
        </div>
      </Link>
    </div>
  );
}
