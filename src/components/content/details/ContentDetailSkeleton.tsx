export function ContentDetailSkeleton() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Hero Banner Skeleton */}
            <div className="relative h-80 sm:h-96 md:h-[450px] lg:h-[500px] overflow-hidden">
                <div className="absolute inset-0 bg-gray-300 dark:bg-gray-800 animate-pulse"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative -mt-14 sm:-mt-20 md:-mt-28 lg:-mt-32 z-20 pb-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left sidebar skeleton */}
                    <div className="lg:col-span-3 xl:col-span-3">
                        {/* Cover image card skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 transform lg:-translate-y-12">
                            {/* Cover image skeleton */}
                            <div className="relative pt-[140%] bg-gray-300 dark:bg-gray-700 animate-pulse"></div>

                            {/* Button skeleton */}
                            <div className="grid grid-cols-2 gap-1 p-1">
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            </div>
                        </div>

                        {/* Information panel skeleton */}
                        <div className="mt-6 lg:mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {[1, 2, 3, 4, 5].map(
                                    (i) => (
                                        <div
                                            key={i}
                                            className="flex items-center p-4"
                                        >
                                            <div className="w-5 h-5 mr-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Stats cards skeleton */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 p-4">
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 p-4">
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                    <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Content Management Panel Skeleton */}
                        <div className="mt-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
                                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                                <div className="p-4 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="space-y-2"
                                        >
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content area skeleton */}
                    <div className="lg:col-span-9 xl:col-span-9 space-y-6">
                        {/* Description section skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="hidden sm:flex gap-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-5 space-y-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Tags section skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>

                            <div className="p-5">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        1, 2, 3, 4, 5, 6, 7,
                                        8,
                                    ].map((i) => (
                                        <div
                                            key={i}
                                            className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Volumes section skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            </div>

                            <div className="p-5">
                                <div className="flex justify-end mb-4">
                                    <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {[
                                        1, 2, 3, 4, 5, 6, 7,
                                        8, 9, 10,
                                    ].map((i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse h-64"
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
