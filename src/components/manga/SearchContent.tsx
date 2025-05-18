"use client";

import { searchMangaByTitle } from "@/actions/manga-api";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { MangaGridSkeleton } from "@/components/manga/MangaGridSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaMetadata } from "@/types/manga";
import {
    AlertTriangle,
    Book,
    Search as SearchIcon,
} from "lucide-react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get("q") || "";
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] =
        useState(initialQuery);
    const [mangaList, setMangaList] = useState<
        MangaMetadata[]
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);

            // Update URL with search query
            const params = new URLSearchParams(
                searchParams
            );
            if (query) {
                params.set("q", query);
            } else {
                params.delete("q");
            }

            // Replace the URL with the new search params
            router.replace(`/search?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, router, searchParams]);

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

    // Fetch search results when debounced query changes
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery.trim()) {
                setMangaList([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const results = await searchMangaByTitle(
                    debouncedQuery
                );
                setMangaList(results);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error(
                              "Failed to search manga"
                          )
                );
                console.error(
                    "Error searching manga:",
                    err
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    return (
        <>
            {/* Search input */}
            <div className="relative mb-8 max-w-3xl mx-auto">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 p-3 shadow-sm"
                        placeholder="Search manga by title... (Ctrl+F)"
                        value={query}
                        onChange={(e) =>
                            setQuery(e.target.value)
                        }
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <span className="text-2xl">
                                &times;
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search results */}
            <div className="mt-8">
                {isLoading ? (
                    <MangaGridSkeleton count={8} />
                ) : error ? (
                    <EmptyState
                        icon={AlertTriangle}
                        title="Error searching manga"
                        message={error.message}
                        variant="error"
                    />
                ) : mangaList.length > 0 ? (
                    <>
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 px-2">
                            Found {mangaList.length} results
                            for &ldquo;{debouncedQuery}
                            &rdquo;
                        </div>
                        <MangaGrid
                            mangaList={mangaList}
                            showFilters={false}
                        />
                    </>
                ) : debouncedQuery ? (
                    <EmptyState
                        icon={Book}
                        title="No results found"
                        message={`No manga found for "${debouncedQuery}". Try a different search term.`}
                        variant="warning"
                    />
                ) : (
                    <EmptyState
                        icon={SearchIcon}
                        title="Start searching"
                        message="Enter a search term to find manga in your collection."
                        variant="default"
                    />
                )}
            </div>
        </>
    );
}
