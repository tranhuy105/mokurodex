export function MangaGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full"
        >
          {/* Cover Image Skeleton */}
          <div className="relative pt-[150%] bg-gray-100 dark:bg-gray-700 animate-pulse">
            {/* Volume count badge skeleton */}
            <div className="absolute top-2 left-2 w-16 h-7 bg-gray-200 dark:bg-gray-600 rounded-md"></div>

            {/* Title area skeleton */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent">
              <div className="absolute bottom-3 left-3 right-3">
                <div className="h-5 bg-gray-300/50 dark:bg-gray-500/50 rounded w-3/4 mb-2"></div>
                <div className="h-5 bg-gray-300/50 dark:bg-gray-500/50 rounded w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 mr-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
            </div>

            <div className="flex gap-1.5 pt-1">
              <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-5 w-20 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListViewSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center p-5">
          {/* Thumbnail skeleton */}
          <div className="w-20 h-28 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse"></div>

          {/* Content skeleton */}
          <div className="ml-5 flex-1 space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>

            <div className="flex gap-6">
              <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-5 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>

            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="h-6 w-24 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="ml-4 hidden md:flex flex-col items-end gap-2">
            <div className="h-7 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-7 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
