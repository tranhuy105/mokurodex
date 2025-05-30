"use client";

import { useAllContentWithUserData } from "@/hooks/use-content-management";
import { ContentWithUserData } from "@/types/content";
import { Book, FileText, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ContentGrid } from "../content/ContentGrid";

export function HomeStats() {
    const { data: contentList = [], isLoading } =
        useAllContentWithUserData();

    if (isLoading) {
        return (
            <div className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>
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
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
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

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
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

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
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
            <RecentContent contentList={recentContent} />
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
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
