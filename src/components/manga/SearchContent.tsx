"use client";

import { searchMangaByTitle } from "@/actions/manga-management-prisma";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { MangaGridSkeleton } from "@/components/manga/MangaGridSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaMetadata } from "@/types/manga";
import {
  AlertTriangle,
  Book,
  Search as SearchIcon,
  X,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [mangaList, setMangaList] = useState<MangaMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedTips, setShowAdvancedTips] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);

      // Update URL with search query
      const params = new URLSearchParams(searchParams);
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
        document.activeElement === searchInputRef.current
      ) {
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        const results = await searchMangaByTitle(debouncedQuery);
        setMangaList(results);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to search manga")
        );
        console.error("Error searching manga:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

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
            className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-base rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 block w-full pl-12 p-4 shadow-sm transition-all duration-200"
            placeholder="Search manga by title... (Ctrl+F)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* Advanced search tips toggle */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => setShowAdvancedTips(!showAdvancedTips)}
            className="text-sm flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {showAdvancedTips ? "Hide search tips" : "Show search tips"}
          </button>
        </div>

        {/* Advanced search tips */}
        {showAdvancedTips && (
          <div className="mt-2 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-xl text-sm">
            <h3 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
              Advanced Search Tips
            </h3>
            <ul className="space-y-1 text-orange-700 dark:text-orange-200 list-disc pl-5">
              <li>
                Search works with both English and Japanese terms (e.g.,
                &quot;ninja&quot; will match &quot;忍者&quot;)
              </li>
              <li>Search ignores spaces and diacritics for better matching</li>
              <li>
                Partial word matching is supported for terms longer than 3
                characters
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
      <div className="mt-8">
        {isLoading ? (
          <div className="animate-pulse">
            <MangaGridSkeleton count={8} />
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error searching manga"
            message={error.message}
            variant="error"
          />
        ) : mangaList.length > 0 ? (
          <>
            <div className="mb-6 text-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center">
              <div className="flex-1">
                Found{" "}
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {mangaList.length}
                </span>{" "}
                results for{" "}
                <span className="font-medium">
                  &quot;{debouncedQuery}&quot;
                </span>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {mangaList.length === 1
                  ? "1 manga"
                  : `${mangaList.length} manga`}
              </div>
            </div>
            <MangaGrid mangaList={mangaList} showFilters={false} />
          </>
        ) : debouncedQuery ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-xl border border-yellow-200 dark:border-yellow-800/30 max-w-md w-full text-center">
              <Book className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                No results found
              </h2>
              <p className="text-yellow-600 dark:text-yellow-300">
                No manga found for &quot;{debouncedQuery}&quot;. Try a different
                search term or check the spelling.
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
                Enter a search term to find manga in your collection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
