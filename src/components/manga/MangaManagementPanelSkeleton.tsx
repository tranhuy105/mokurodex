"use client";

export function MangaManagementPanelSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      <div className="p-4 space-y-6 animate-pulse">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-20"
            >
              <div className="w-6 h-6 mb-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div>
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"
              ></div>
            ))}
          </div>
        </div>

        {/* Reading Status */}
        <div>
          <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-14"
              >
                <div className="w-5 h-5 mb-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 h-24"></div>
        </div>

        {/* Metadata */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
