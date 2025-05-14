import { Skeleton } from "@/components/ui/Skeleton";
import { Book, BookOpen, Clock } from "lucide-react";
import { VolumeGridSkeleton } from "./VolumeGridSkeleton";

export function MangaDetailSkeleton() {
  return (
    <>
      {/* Banner with blur effect skeleton */}
      <div className="relative h-64 md:h-80 bg-gray-900 overflow-hidden">
        <Skeleton className="absolute inset-0 opacity-30" />

        {/* Color overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-orange-500/20 via-gray-900/80 to-gray-900 z-10"
          style={{ mixBlendMode: "multiply" }}
        ></div>

        {/* Pattern overlay for texture */}
        <div className="absolute inset-0 opacity-10 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
      </div>

      <div className="container mx-auto px-4 relative -mt-24 z-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar with manga info */}
          <div className="lg:col-span-3 xl:col-span-2">
            {/* Cover image card skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 transform lg:-translate-y-8">
              {/* Cover image skeleton */}
              <div className="relative pt-[140%] bg-gray-300 dark:bg-gray-700">
                <Skeleton className="absolute inset-0" />
              </div>
            </div>

            {/* Stats panel skeleton */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-5 w-24" />
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="flex items-center p-4">
                  <BookOpen className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Volumes
                    </span>
                    <Skeleton className="h-4 w-8 mt-1" />
                  </div>
                </div>

                <div className="flex items-center p-4">
                  <Book className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Pages
                    </span>
                    <Skeleton className="h-4 w-12 mt-1" />
                  </div>
                </div>

                <div className="flex items-center p-4">
                  <Clock className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase">
                      Updated
                    </span>
                    <Skeleton className="h-4 w-16 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-9 xl:col-span-10">
            <div className="mb-6">
              <Skeleton className="h-8 w-2/3 mb-3" />

              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>

            {/* Description section skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-20" />
              </div>

              <div className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Tags section skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-16" />
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-32 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
            </div>

            {/* Volumes section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-32" />
              </div>

              <div className="p-6">
                <VolumeGridSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
