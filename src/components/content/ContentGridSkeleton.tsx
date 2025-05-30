export function ContentGridSkeleton({
    count = 8,
}: {
    count?: number;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map(
                (_, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                        {/* Cover image skeleton */}
                        <div className="relative aspect-[3/4] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                        {/* Content details skeleton */}
                        <div className="p-4">
                            {/* Title */}
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>

                            {/* Metadata */}
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
                            </div>

                            {/* Tags */}
                            <div className="mt-3 flex gap-1">
                                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
