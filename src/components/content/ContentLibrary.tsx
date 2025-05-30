"use client";

import { ContentGrid } from "@/components/content/ContentGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchContent } from "@/hooks/use-content-management";
import { ContentWithUserData } from "@/types/content";
import { AlertTriangle, BookX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ContentTypeSelector } from "./ContentTypeSelector";

interface ContentLibraryProps {
    initialContentType?: "all" | "manga" | "lightnovel";
}

export function ContentLibrary({
    initialContentType = "all",
}: ContentLibraryProps) {
    const searchParams = useSearchParams();
    const [contentType, setContentType] = useState<
        "all" | "manga" | "lightnovel"
    >(initialContentType);

    // Parse filter parameters from URL
    const tagsParam = searchParams.get("tags");
    const collectionsParam =
        searchParams.get("collections");
    const statusParam = searchParams.get("status");
    const favoriteParam = searchParams.get("favorite");
    const nsfwParam = searchParams.get("isNsfw");
    const queryParam = searchParams.get("query");

    // Create filter object for the search hook
    const filters = {
        query: queryParam || undefined,
        tags: tagsParam ? tagsParam.split(",") : undefined,
        collections: collectionsParam
            ? collectionsParam.split(",")
            : undefined,
        status: statusParam
            ? statusParam.split(",")
            : undefined,
        favorite: favoriteParam === "true",
        isNsfw:
            nsfwParam === "true"
                ? true
                : nsfwParam === "false"
                ? false
                : undefined,
        contentType:
            contentType === "all"
                ? undefined
                : [contentType],
    };

    // Use the search hook to fetch content
    const {
        data: rawContentList = [],
        error,
        isLoading,
    } = useSearchContent(filters);

    // Cast the data to the correct type
    const contentList =
        rawContentList as ContentWithUserData[];

    // Filter content by type if needed
    const filteredContent: ContentWithUserData[] =
        contentType === "all"
            ? contentList
            : contentList.filter(
                  (content) =>
                      content.contentType === contentType
              );

    // Check if we have active filters
    const hasActiveFilters = !!(
        tagsParam ||
        collectionsParam ||
        statusParam ||
        favoriteParam === "true" ||
        nsfwParam ||
        queryParam ||
        contentType !== "all"
    );

    // Create the empty state component
    const emptyState = (
        <EmptyState
            icon={BookX}
            title={`No ${
                contentType === "all"
                    ? "content"
                    : contentType === "manga"
                    ? "manga"
                    : "light novels"
            } found`}
            message={
                hasActiveFilters
                    ? "No content matched your filters. Try adjusting your search criteria."
                    : `No ${
                          contentType === "all"
                              ? "content"
                              : contentType === "manga"
                              ? "manga"
                              : "light novels"
                      } found in your library.`
            }
            variant="warning"
        />
    );

    if (error) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title="Failed to load content"
                message={
                    error instanceof Error
                        ? error.message
                        : "Unknown error"
                }
                variant="error"
            />
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-14 w-full rounded-xl" />
                <div className="flex items-center space-x-4 mb-6">
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
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
        );
    }

    return (
        <div className="space-y-6">
            <ContentTypeSelector
                activeType={contentType}
                onTypeChange={setContentType}
            />

            <ContentGrid
                contentList={filteredContent}
                emptyState={emptyState}
                showFilters={true}
            />
        </div>
    );
}
