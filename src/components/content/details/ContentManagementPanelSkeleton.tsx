export function ContentManagementPanelSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            <div className="p-4 space-y-4">
                {/* Rating */}
                <div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                            ></div>
                        ))}
                    </div>
                </div>

                {/* Reading Status */}
                <div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
