import { Skeleton } from "@/components/ui/Skeleton";
import { Eye } from "lucide-react";

export function VolumeCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-200">
      <div className="grid grid-cols-12 overflow-hidden">
        {/* Volume thumbnail/image skeleton */}
        <div className="col-span-4 sm:col-span-3 lg:col-span-4 relative bg-gray-200 dark:bg-gray-700 aspect-[3/4] overflow-hidden">
          <Skeleton className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/0 to-black/20 dark:to-black/40"></div>
        </div>

        {/* Volume info skeleton */}
        <div className="col-span-8 sm:col-span-9 lg:col-span-8 p-3 sm:p-4 flex flex-col">
          <Skeleton className="h-5 w-3/4 mb-2" />

          {/* Stats line skeleton */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center">
              <Eye className="h-3.5 w-3.5 mr-1 text-gray-400" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Read button skeleton */}
          <div className="mt-auto pt-2 hidden sm:block">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
