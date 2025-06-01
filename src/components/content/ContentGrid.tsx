"use client";

import {
    useCollections,
    useTags,
} from "@/hooks/use-content-management";
import { formatDate } from "@/lib/utils";
import {
    Collection,
    ContentWithUserData,
    Tag,
} from "@/types/content";
import {
    Book,
    BookOpen,
    Calendar,
    ExternalLink,
    EyeOff,
    Filter,
    Heart,
    LayoutGrid,
    List,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    memo,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ContentCard } from "../content/ContentCard";
import { ContentLibraryFilters } from "./ContentFilters/ContentLibraryFilters";

interface ContentGridProps {
    contentList: ContentWithUserData[];
    emptyState?: ReactNode;
    initialViewMode?: "grid" | "list";
    showFilters?: boolean;
}

// Client component wrapper to fetch filter data
export function ContentGrid({
    contentList,
    emptyState,
    initialViewMode = "grid",
    showFilters = true,
}: ContentGridProps) {
    const { data: tags = [], isLoading: isTagsLoading } =
        useTags();
    const {
        data: collections = [],
        isLoading: isCollectionsLoading,
    } = useCollections();
    const isLoading = isTagsLoading || isCollectionsLoading;

    if (isLoading && showFilters) {
        return <div className="w-full h-10"></div>;
    }

    return (
        <ContentGridContent
            initialViewMode={initialViewMode}
            contentList={contentList}
            emptyState={emptyState}
            tags={tags}
            collections={collections}
            showFilters={showFilters}
        />
    );
}

// Memoize the MangaCard component to prevent unnecessary re-renders
const MemoizedContentCard = memo(ContentCard);

// Inner component with all the actual content
function ContentGridContent({
    contentList,
    emptyState,
    tags,
    collections,
    initialViewMode,
    showFilters,
}: ContentGridProps & {
    tags: Tag[];
    collections: Collection[];
    initialViewMode: "grid" | "list";
    showFilters: boolean;
}) {
    const [sortOrder, setSortOrder] = useState<
        "date" | "title" | "volumes"
    >("date");
    const [sortDirection, setSortDirection] = useState<
        "asc" | "desc"
    >("desc");
    const [viewMode, setViewMode] = useState<
        "grid" | "list"
    >(initialViewMode);
    const [showFiltersPanel, setShowFiltersPanel] =
        useState(false);
    const filterPanelRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close filter panel
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                filterPanelRef.current &&
                !filterPanelRef.current.contains(
                    event.target as Node
                ) &&
                showFiltersPanel
            ) {
                setShowFiltersPanel(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [showFiltersPanel]);

    // Sort content list based on current sort options (memoized)
    const sortedContentList = useMemo(() => {
        return [...contentList].sort((a, b) => {
            if (sortOrder === "date") {
                // Sort by lastModified date
                if (a.lastModified && b.lastModified) {
                    const dateA = new Date(
                        a.lastModified
                    ).getTime();
                    const dateB = new Date(
                        b.lastModified
                    ).getTime();
                    return sortDirection === "asc"
                        ? dateA - dateB
                        : dateB - dateA;
                }
            } else if (sortOrder === "title") {
                // Sort by title
                return sortDirection === "asc"
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            } else if (sortOrder === "volumes") {
                // Sort by number of volumes
                return sortDirection === "asc"
                    ? a.volumes - b.volumes
                    : b.volumes - a.volumes;
            }

            // Default fallback sort by title
            return a.title.localeCompare(b.title);
        });
    }, [contentList, sortOrder, sortDirection]);

    // Memoized content rendering
    const content = useMemo(() => {
        if (contentList.length === 0 && emptyState) {
            console.log(
                "Will render empty state because contentList.length is 0"
            );
            return <div className="mt-8">{emptyState}</div>;
        } else if (viewMode === "grid") {
            console.log(
                `Will render grid view with ${sortedContentList.length} content items`
            );
            return (
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedContentList.map((content) => (
                        <MemoizedContentCard
                            key={content.id}
                            content={content}
                        />
                    ))}
                </div>
            );
        } else {
            console.log(
                `Will render list view with ${sortedContentList.length} content items`
            );

            return (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedContentList.map((content) => (
                        <Link
                            key={content.id}
                            href={`/content/${encodeURIComponent(
                                content.id
                            )}`}
                            className="flex items-center p-5 hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors group"
                        >
                            <div className="w-20 h-28 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative">
                                {content.coverImage ? (
                                    <>
                                        <Image
                                            src={
                                                content.coverImage
                                            }
                                            alt={
                                                content.title
                                            }
                                            fill
                                            className={`object-cover ${
                                                content
                                                    .userData
                                                    ?.isNsfw
                                                    ? "blur-md"
                                                    : ""
                                            }`}
                                            sizes="80px"
                                        />

                                        {/* NSFW indicator overlay */}
                                        {content.userData
                                            ?.isNsfw && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <div className="bg-purple-600 rounded-full p-1">
                                                    <EyeOff className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Book className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="ml-5 flex-1 min-w-0">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                    {content.title}
                                </h3>

                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <Book className="w-4 h-4 mr-1.5 text-orange-500" />
                                        <span>
                                            {
                                                content.volumes
                                            }{" "}
                                            {content.volumes ===
                                            1
                                                ? "volume"
                                                : "volumes"}
                                        </span>
                                    </div>
                                    {content.lastModified && (
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1.5 text-blue-500" />
                                            <span>
                                                Updated{" "}
                                                {formatDate(
                                                    content.lastModified
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Additional information for the list view */}
                                <div className="mt-2 flex gap-2">
                                    {content.userData
                                        ?.favorite && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 w-24 justify-center">
                                            <Heart className="w-3 h-3 mr-1 fill-red-500 flex-shrink-0" />
                                            <span className="truncate">
                                                Favorite
                                            </span>
                                        </span>
                                    )}
                                    {content.userData
                                        ?.isNsfw && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 w-24 justify-center">
                                            <EyeOff className="w-3 h-3 mr-1 flex-shrink-0" />
                                            <span className="truncate">
                                                NSFW
                                            </span>
                                        </span>
                                    )}
                                    {content.userData
                                        ?.status && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 w-24 justify-center">
                                            <span className="truncate">
                                                {
                                                    content
                                                        .userData
                                                        .status
                                                }
                                            </span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        {sortOrder ===
                                            "date" &&
                                        sortDirection ===
                                            "desc" &&
                                        content ===
                                            sortedContentList[0]
                                            ? "Recent"
                                            : content.contentType ===
                                              "manga"
                                            ? "Manga"
                                            : "Light Novel"}
                                    </span>
                                    {content.volumes >
                                        10 && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                            Collection
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="ml-4 hidden md:flex flex-col items-end gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                    {content.volumes}{" "}
                                    {content.volumes === 1
                                        ? "vol"
                                        : "vols"}
                                </span>

                                <button className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900/30 dark:hover:text-orange-300 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    View Details
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            );
        }
    }, [
        sortedContentList,
        contentList.length,
        emptyState,
        viewMode,
        sortOrder,
        sortDirection,
    ]);

    return (
        <div className="w-full space-y-5">
            {/* Only show controls if showFilters is true */}
            {showFilters && (
                <>
                    {/* Main controls bar */}
                    <div className="flex flex-col gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-20 z-20 p-4 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                                    {
                                        sortedContentList.length
                                    }{" "}
                                    items
                                </div>

                                <button
                                    onClick={() =>
                                        setShowFiltersPanel(
                                            !showFiltersPanel
                                        )
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                        showFiltersPanel
                                            ? "bg-orange-100 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400"
                                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="inline">
                                        Filters
                                    </span>
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/70 p-1 rounded-lg">
                                <button
                                    onClick={() =>
                                        setViewMode("grid")
                                    }
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === "grid"
                                            ? "bg-white text-orange-600 shadow-sm dark:bg-gray-600 dark:text-orange-400"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                    aria-label="Grid view"
                                >
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() =>
                                        setViewMode("list")
                                    }
                                    className={`p-2 rounded-lg transition-all ${
                                        viewMode === "list"
                                            ? "bg-white text-orange-600 shadow-sm dark:bg-gray-600 dark:text-orange-400"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                    aria-label="List view"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                            <button
                                onClick={() => {
                                    setSortOrder("date");
                                    if (
                                        sortOrder === "date"
                                    ) {
                                        setSortDirection(
                                            (prev) =>
                                                prev ===
                                                "asc"
                                                    ? "desc"
                                                    : "asc"
                                        );
                                    }
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                                    sortOrder === "date"
                                        ? "bg-orange-100 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Date{" "}
                                    {sortOrder === "date" &&
                                        (sortDirection ===
                                        "asc"
                                            ? "↑"
                                            : "↓")}
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    setSortOrder("title");
                                    if (
                                        sortOrder ===
                                        "title"
                                    ) {
                                        setSortDirection(
                                            (prev) =>
                                                prev ===
                                                "asc"
                                                    ? "desc"
                                                    : "asc"
                                        );
                                    }
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                                    sortOrder === "title"
                                        ? "bg-orange-100 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                <span>
                                    Title{" "}
                                    {sortOrder ===
                                        "title" &&
                                        (sortDirection ===
                                        "asc"
                                            ? "A→Z"
                                            : "Z→A")}
                                </span>
                            </button>

                            <button
                                onClick={() => {
                                    setSortOrder("volumes");
                                    if (
                                        sortOrder ===
                                        "volumes"
                                    ) {
                                        setSortDirection(
                                            (prev) =>
                                                prev ===
                                                "asc"
                                                    ? "desc"
                                                    : "asc"
                                        );
                                    }
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                                    sortOrder === "volumes"
                                        ? "bg-orange-100 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>
                                    Volumes{" "}
                                    {sortOrder ===
                                        "volumes" &&
                                        (sortDirection ===
                                        "asc"
                                            ? "↑"
                                            : "↓")}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Filter panel container */}
                    {showFiltersPanel && (
                        <div
                            ref={filterPanelRef}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-gray-700/50 animate-in fade-in slide-in-from-top-4 duration-200"
                        >
                            <div className="p-0">
                                {/* Render the filter component inside our panel */}
                                <div className="-mt-10">
                                    <ContentLibraryFilters
                                        embedded={true}
                                        onClose={() =>
                                            setShowFiltersPanel(
                                                false
                                            )
                                        }
                                        tags={tags}
                                        collections={
                                            collections
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Render the prepared content */}
            {content}
        </div>
    );
}
