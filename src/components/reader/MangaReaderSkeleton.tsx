import { Skeleton } from "@/components/ui/Skeleton";

export function MangaReaderSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Top navigation bar skeleton */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="ml-auto flex space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Main content area - reader */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-2/3 max-w-2xl aspect-[3/4]">
            <Skeleton className="absolute inset-0 rounded-md" />

            {/* Loading text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <svg
                className="animate-spin h-10 w-10 text-white mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm font-medium">Loading manga...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls skeleton */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
