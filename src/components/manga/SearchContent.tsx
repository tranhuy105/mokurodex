"use client";

import { ContentGrid } from "@/components/content/ContentGrid";
import { ContentGridSkeleton } from "@/components/content/ContentGridSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSearchContent } from "@/hooks/use-content-management";
import {
    ContentWithUserData,
    SortOption,
} from "@/types/content";
import {
    AlertTriangle,
    Book,
    Bookmark,
    LayoutGrid,
    Search as SearchIcon,
    Sparkles,
    X,
} from "lucide-react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] =
        useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function SearchContent() {
    // Routing and URL state
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";

    // Local state
    const [query, setQuery] = useState(initialQuery);
    const debouncedQuery = useDebounce(query, 300);
    const [viewMode, setViewMode] = useState<
        "grid" | "list"
    >("grid");
    const [showAdvancedTips, setShowAdvancedTips] =
        useState(false);
    const [sortBy, setSortBy] =
        useState<SortOption>("relevance");

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const previousSearchResults = useRef<
        ContentWithUserData[]
    >([]);

    // Update URL when debounced query changes
    useEffect(() => {
        // Update URL with search query
        const params = new URLSearchParams(searchParams);
        if (debouncedQuery) {
            params.set("q", debouncedQuery);
        } else {
            params.delete("q");
        }

        // Replace the URL with the new search params
        router.replace(`/search?${params.toString()}`);
    }, [debouncedQuery, router, searchParams]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+F or Cmd+F for macOS
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
                e.preventDefault(); // Prevent browser's default search
                searchInputRef.current?.focus();
            }

            // Escape key to clear search
            if (
                e.key === "Escape" &&
                document.activeElement ===
                    searchInputRef.current
            ) {
                setQuery("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
    }, []);

    // Use the search hook
    const {
        data: rawSearchResults = [],
        isLoading,
        error,
        isFetching,
        isError,
    } = useSearchContent({
        query: debouncedQuery.trim(),
    });

    // Ensure type safety and sort results if needed
    const sortResults = useCallback(
        (results: ContentWithUserData[]) => {
            if (!Array.isArray(results)) {
                return [];
            }

            if (sortBy === "newest") {
                return [...results].sort(
                    (a, b) =>
                        new Date(b.lastModified).getTime() -
                        new Date(a.lastModified).getTime()
                );
            } else if (sortBy === "title") {
                return [...results].sort((a, b) =>
                    a.title.localeCompare(b.title)
                );
            }
            return results; // Default is relevance, already sorted by the API
        },
        [sortBy]
    );

    // Process search results
    const searchResults = sortResults(
        Array.isArray(rawSearchResults)
            ? (rawSearchResults as unknown as ContentWithUserData[])
            : []
    );

    // Store results for animations
    useEffect(() => {
        if (
            searchResults &&
            searchResults.length > 0 &&
            !isLoading
        ) {
            previousSearchResults.current = searchResults;
        }
    }, [searchResults, isLoading]);

    // Clear search handler
    const handleClearSearch = () => {
        setQuery("");
        searchInputRef.current?.focus();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search input */}
            <div className="mb-8 max-w-3xl mx-auto">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 block w-full pl-12 p-4 shadow-sm transition-all duration-200"
                        placeholder="Search content by title... (Ctrl+F)"
                        value={query}
                        onChange={(e) =>
                            setQuery(e.target.value)
                        }
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">
                                Clear search
                            </span>
                        </button>
                    )}
                </div>

                {/* Search controls */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    {/* Advanced search tips toggle */}
                    <button
                        onClick={() =>
                            setShowAdvancedTips(
                                !showAdvancedTips
                            )
                        }
                        className="text-sm flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {showAdvancedTips
                            ? "Hide search tips"
                            : "Show search tips"}
                    </button>

                    {/* Controls for sorting and view */}
                    {searchResults &&
                        searchResults.length > 0 && (
                            <div className="flex items-center space-x-3">
                                {/* Sort dropdown */}
                                <div className="flex items-center space-x-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Sort:
                                    </span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(
                                                e.target
                                                    .value as SortOption
                                            )
                                        }
                                        className="bg-white dark:bg-gray-800 text-sm border border-gray-300 dark:border-gray-700 rounded-md p-1 text-gray-700 dark:text-gray-200"
                                    >
                                        <option value="relevance">
                                            Relevance
                                        </option>
                                        <option value="newest">
                                            Newest
                                        </option>
                                        <option value="title">
                                            Title
                                        </option>
                                    </select>
                                </div>

                                {/* View toggle */}
                                <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                                    <button
                                        onClick={() =>
                                            setViewMode(
                                                "grid"
                                            )
                                        }
                                        className={`p-2 ${
                                            viewMode ===
                                            "grid"
                                                ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                                                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                        }`}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        <span className="sr-only">
                                            Grid view
                                        </span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setViewMode(
                                                "list"
                                            )
                                        }
                                        className={`p-2 ${
                                            viewMode ===
                                            "list"
                                                ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                                                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                        }`}
                                    >
                                        <Bookmark className="h-4 w-4" />
                                        <span className="sr-only">
                                            List view
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}
                </div>

                {/* Advanced search tips */}
                {showAdvancedTips && (
                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl text-sm">
                        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Advanced Search Tips
                        </h3>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-200 list-disc pl-5">
                            <li>
                                Search works with both
                                English and Japanese terms
                                (e.g., &quot;ninja&quot;
                                will match &quot;忍者&quot;)
                            </li>
                            <li>
                                Search ignores spaces and
                                diacritics for better
                                matching
                            </li>
                            <li>
                                Partial word matching is
                                supported for terms longer
                                than 3 characters
                            </li>
                            <li>
                                Press{" "}
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 text-xs">
                                    Esc
                                </kbd>{" "}
                                to clear search
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Search results */}
            <div className="mt-8 min-h-[300px]">
                {isLoading && isFetching ? (
                    <div className="animate-pulse">
                        <ContentGridSkeleton count={8} />
                    </div>
                ) : isError || error ? (
                    <EmptyState
                        icon={AlertTriangle}
                        title="Error searching content"
                        message={
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }
                        variant="error"
                    />
                ) : searchResults &&
                  searchResults.length > 0 ? (
                    <div
                        className={
                            isFetching
                                ? "opacity-60 transition-opacity duration-200"
                                : ""
                        }
                    >
                        <div className="mb-6 text-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
                            <div className="flex-1">
                                Found{" "}
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                    {searchResults.length}
                                </span>{" "}
                                results for{" "}
                                <span className="font-medium">
                                    &quot;{debouncedQuery}
                                    &quot;
                                </span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                                {searchResults.length === 1
                                    ? "1 item"
                                    : `${searchResults.length} items`}
                            </div>
                        </div>
                        <ContentGrid
                            contentList={searchResults}
                            showFilters={false}
                            initialViewMode={viewMode}
                        />
                    </div>
                ) : debouncedQuery ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-xl border border-yellow-200 dark:border-yellow-800/30 max-w-md w-full text-center">
                            <Book className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
                            <h2 className="text-xl font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                No results found
                            </h2>
                            <p className="text-yellow-600 dark:text-yellow-300">
                                No content found for &quot;
                                {debouncedQuery}&quot;. Try
                                a different search term or
                                check the spelling.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl border border-gray-200 dark:border-gray-700 max-w-md w-full text-center">
                            <SearchIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start searching
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                Enter a search term to find
                                content in your collection.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
