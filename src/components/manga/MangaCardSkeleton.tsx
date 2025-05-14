import { Skeleton } from "@/components/ui/Skeleton";
import { Book } from "lucide-react";

export function MangaCardSkeleton() {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm h-full overflow-hidden">
      {/* Cover image skeleton */}
      <div className="relative pt-[130%] bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <Skeleton className="absolute inset-0" />

        {/* Title and date overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
          <Skeleton className="h-4 w-2/3 bg-gray-300/70 dark:bg-gray-600/70" />

          {/* Date badge skeleton */}
          <div className="mt-1.5 flex items-center">
            <Skeleton className="h-5 w-20 rounded-full bg-gray-300/50 dark:bg-gray-600/50" />
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Book className="h-3.5 w-3.5 mr-1 text-gray-400" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Faux rating skeleton */}
        <div className="flex items-center">
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}
