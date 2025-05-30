import { ContinueReading } from "@/components/home/ContinueReading";
import { HomeStats } from "@/components/home/HomeStats";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { Suspense } from "react";

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Welcome to MokuroDex"
                subtitle="Your digital manga reading application"
                className="mb-8"
            />

            <Suspense
                fallback={
                    <div className="space-y-4 mb-8">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Skeleton className="h-20 rounded-lg" />
                            <Skeleton className="h-20 rounded-lg" />
                            <Skeleton className="h-20 rounded-lg" />
                        </div>
                    </div>
                }
            >
                <HomeStats />
            </Suspense>

            {/* Continue Reading section */}
            <Suspense
                fallback={
                    <div className="space-y-4 mb-8">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-8 w-48 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <Skeleton className="h-64 rounded-xl" />
                            <Skeleton className="h-64 rounded-xl" />
                            <Skeleton className="h-64 rounded-xl" />
                        </div>
                    </div>
                }
            >
                <ContinueReading
                    limit={3}
                    showHeader={true}
                />
            </Suspense>

            {/* CTA for all manga */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg overflow-hidden mt-8">
                <div className="px-6 py-5 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2 md:space-y-1 mb-4 md:mb-0">
                        <h2 className="text-xl font-bold text-white">
                            View Your Entire Collection
                        </h2>
                        <p className="text-orange-100">
                            Browse and read your entire
                            manga library
                        </p>
                    </div>
                    <Link
                        href="/content"
                        className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-white text-orange-600 font-medium hover:bg-orange-50 shadow-sm transition-colors"
                    >
                        Browse Library
                    </Link>
                </div>
            </div>
        </div>
    );
}
