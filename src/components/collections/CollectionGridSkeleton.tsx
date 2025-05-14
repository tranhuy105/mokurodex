import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

interface CollectionGridSkeletonProps {
  count?: number;
}

export function CollectionGridSkeleton({
  count = 8,
}: CollectionGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <CollectionCardSkeleton key={index} />
        ))}
    </div>
  );
}

function CollectionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Cover Image Skeleton */}
      <div className="relative pt-[56.25%] bg-gray-200 dark:bg-gray-700">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />

        <div className="mt-auto space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
