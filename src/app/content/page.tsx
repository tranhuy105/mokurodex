// this page is for the content page that shows all the content in the database

import { ContentLibraryFiltersSkeleton } from "@/components/content/ContentFilters";
import { ContentLibrary } from "@/components/content/ContentLibrary";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Suspense } from "react";

interface ContentListPageProps {
    searchParams?: {
        tags?: string;
        collections?: string;
        status?: string;
        favorite?: string;
        isNsfw?: string;
        query?: string;
        contentType?:
            | "all"
            | "manga"
            | "lightnovel"
            | undefined;
    };
}

export default async function ContentListPage({
    searchParams,
}: ContentListPageProps) {
    const _searchParams = await Promise.resolve(
        searchParams
    );
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Content Library"
                subtitle="Browse your entire collection"
                className="mb-8"
            />

            <Suspense
                fallback={
                    <div className="space-y-6">
                        <Skeleton className="h-14 w-full rounded-xl" />
                        <div className="flex items-center space-x-4 mb-6">
                            <Skeleton className="h-10 w-24 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                        <ContentLibraryFiltersSkeleton />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array(15)
                                .fill(0)
                                .map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-64 rounded-xl"
                                    />
                                ))}
                        </div>
                    </div>
                }
            >
                <ContentLibrary
                    initialContentType={
                        _searchParams?.contentType as
                            | "all"
                            | "manga"
                            | "lightnovel"
                            | undefined
                    }
                />
            </Suspense>
        </div>
    );
}
