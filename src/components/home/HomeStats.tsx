"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { useAllContentWithUserData } from "@/hooks/use-content-management";
import { ContentWithUserData } from "@/types/content";
import {
    Book,
    FileText,
    LayoutGrid,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ContentGrid } from "../content/ContentGrid";

export function HomeStats() {
    const { data: contentList = [], isLoading } =
        useAllContentWithUserData();

    // Render skeleton loading state
    if (isLoading) {
        return (
            <div className="space-y-8">
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5"
                        >
                            <div className="flex items-start">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <div className="ml-4 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent content skeleton */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-64 rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const totalContent = contentList.length;
    const totalVolumes = contentList.reduce(
        (count, content) => count + content.volumes,
        0
    );
    const totalPages = contentList.reduce(
        (count, content) => count + content.volumes * 50,
        0
    ); // Estimate average 50 pages per volume

    // Get most recently added content (up to 3)
    const recentContent = [...contentList]
        .sort((a, b) => {
            if (a.lastModified && b.lastModified) {
                return (
                    new Date(b.lastModified).getTime() -
                    new Date(a.lastModified).getTime()
                );
            }
            return 0;
        })
        .slice(0, 3);

    return (
        <div className="space-y-8">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 hover:border-orange-300 dark:hover:border-orange-600 transition-colors">
                    <div className="flex items-start">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Book className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Content
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {totalContent}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                    <div className="flex items-start">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Volumes
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {totalVolumes}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                    <div className="flex items-start">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Total Pages
                            </p>
                            <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {totalPages.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Return recent content for use in the parent component */}
            {recentContent.length > 0 && (
                <RecentContent
                    contentList={recentContent}
                />
            )}
        </div>
    );
}

interface RecentContentProps {
    contentList: ContentWithUserData[];
}

function RecentContent({
    contentList,
}: RecentContentProps) {
    if (contentList.length === 0) return null;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Recently Added
                </h2>
                <Link
                    href="/content"
                    className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                >
                    View all
                </Link>
            </div>

            <ContentGrid
                contentList={contentList}
                showFilters={false}
                initialViewMode="list"
            />
        </div>
    );
}
