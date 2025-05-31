"use client";

import {
    useContentWithUserData,
    useReadingHistory,
    useUpdateUserContentMetadata,
} from "@/hooks/use-content-management";
import { ContentWithUserData } from "@/types/content";
import {
    Book,
    BookOpen,
    BookText,
    Calendar,
    Clock,
    Eye,
    EyeOff,
    Heart,
    Share2,
    Star,
    User,
} from "lucide-react";
import Image from "next/image";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";
import { TagManagement } from "../../tags";
import { ContentManagementPanel } from "./ContentManagementPanel";
import { ContentManagementPanelSkeleton } from "./ContentManagementPanelSkeleton";
import { VolumeGrid } from "./VolumeGrid";

// Mock data for aesthetic elements (will be replaced with real data in future)
const MOCK_DATA = {
    description:
        "This is a placeholder description for content that doesn't have user notes. This will be replaced with actual content metadata in the future.",
    genres: ["Action", "Adventure", "Fantasy", "Drama"],
    readCount: 1250,
    favoriteCount: 325,
};

interface ContentDetailProps {
    content: ContentWithUserData;
}

export function ContentDetail({
    content,
}: ContentDetailProps) {
    // State for content data
    const [isLoading, setIsLoading] = useState(true);

    // NSFW revealing state
    const [isNsfwRevealed, setIsNsfwRevealed] =
        useState(false);
    // Content loading state to prevent flashing of NSFW content
    const [contentReady, setContentReady] = useState(false);

    // Get content with user data using our hook
    const {
        data: contentWithUserData,
        isLoading: isContentLoading,
        refetch,
    } = useContentWithUserData(content.id);

    // Get reading history
    useReadingHistory(content.id);

    // Update metadata mutation
    const updateMetadata = useUpdateUserContentMetadata();

    // Track if the component is mounted
    const isMounted = useRef(true);

    const handleTagSelect = useCallback(
        async (tagId: string) => {
            // Prevent multiple operations - only check React Query's pending state
            if (updateMetadata.isPending) return;

            try {
                const currentTagIds =
                    contentWithUserData?.contentTags?.map(
                        (ct) => ct.tagId
                    ) || [];
                const isCurrentlySelected =
                    currentTagIds.includes(tagId);

                // Toggle the tag - simpler logic
                const newTagIds = isCurrentlySelected
                    ? currentTagIds.filter(
                          (id) => id !== tagId
                      )
                    : [...currentTagIds, tagId];

                // React Query will handle the pending state automatically
                await updateMetadata.mutateAsync({
                    contentId: content.id,
                    data: { tagIds: newTagIds },
                });

                // No need for manual refresh - React Query should auto-invalidate
                // If auto-invalidation isn't working, you might need to configure it in your mutation
            } catch (error) {
                console.error(
                    "Error updating tags:",
                    error
                );
                toast.error("Failed to update tag");
            }
        },
        [
            contentWithUserData?.contentTags,
            updateMetadata,
            content.id,
        ]
    );

    useEffect(() => {
        // Set isMounted to true when component mounts
        isMounted.current = true;

        // Set content ready when data is loaded
        if (!isContentLoading && contentWithUserData) {
            setContentReady(true);
            setIsLoading(false);
        }

        // Cleanup function to set isMounted to false when component unmounts
        return () => {
            isMounted.current = false;
        };
    }, [isContentLoading, contentWithUserData]);

    // Handle data refresh after updates
    const handleDataUpdate = async () => {
        if (isMounted.current) {
            await refetch();
        }
    };

    // Use the userData from the fetched data
    const userData = contentWithUserData?.userData || null;
    const isNsfw = userData?.isNsfw || false;

    // Calculate total pages across all volumes
    const totalPages =
        content.contentVolumes?.reduce(
            (total, vol) => total + (vol.pageCount || 0),
            0
        ) || 0;

    // Use the last volume's cover as the content cover if no custom cover
    const coverImage =
        userData?.customCover ||
        (content.contentVolumes &&
        content.contentVolumes.length > 0
            ? content.contentVolumes[
                  content.contentVolumes.length - 1
              ].coverImage
            : content.coverImage) ||
        null;

    // Determine content type icon
    const ContentTypeIcon =
        content.contentType === "manga" ? Book : BookText;
    const contentTypeLabel =
        content.contentType === "manga"
            ? "Manga"
            : "Light Novel";

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Hero Banner with parallax effect */}
            <div className="relative h-80 sm:h-96 md:h-[450px] lg:h-[500px] overflow-hidden">
                {/* Show loading placeholder when content isn't ready */}
                {!contentReady ? (
                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-800 animate-pulse"></div>
                ) : (
                    <>
                        {/* Background cover image with blur */}
                        {coverImage && (
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src={coverImage}
                                    alt={content.title}
                                    fill
                                    className={`object-cover scale-125 opacity-40 blur-[8px] transform-gpu ${
                                        isNsfw &&
                                        !isNsfwRevealed
                                            ? "filter blur-3xl"
                                            : "blur-[8px]"
                                    }`}
                                    priority
                                />
                            </div>
                        )}

                        {/* Layered gradients and patterns for depth */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-b ${
                                isNsfw && !isNsfwRevealed
                                    ? "from-purple-500/30 via-purple-900/40 to-gray-900"
                                    : "from-orange-500/30 via-purple-900/40 to-gray-900"
                            } z-10`}
                            style={{
                                mixBlendMode: "multiply",
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 opacity-70 z-10"></div>

                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.07] z-[11] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>

                        {/* Content container that allows title to be visible on the banner */}
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full z-20 flex items-end">
                            <div className="pb-24 md:pb-60 w-full max-w-6xl">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white drop-shadow-lg tracking-tight mb-3 sm:mb-4 lg:mb-5 leading-tight">
                                    {content.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/90">
                                    {/* Content type badge */}
                                    <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                        <ContentTypeIcon className="w-4 h-4 mr-1.5 text-blue-300" />
                                        <span>
                                            {
                                                contentTypeLabel
                                            }
                                        </span>
                                    </div>

                                    {userData?.author && (
                                        <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                            <User className="w-4 h-4 mr-1.5 text-orange-300" />
                                            <span>
                                                {
                                                    userData.author
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {userData?.rating && (
                                        <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                            <Star className="w-4 h-4 mr-1.5 text-yellow-300" />
                                            <span>
                                                {
                                                    userData.rating
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {userData?.releaseYear && (
                                        <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                            <Calendar className="w-4 h-4 mr-1.5 text-blue-300" />
                                            <span>
                                                {
                                                    userData.releaseYear
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {userData?.status && (
                                        <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                            <Clock className="w-4 h-4 mr-1.5 text-green-300" />
                                            <span>
                                                {
                                                    userData.status
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {isNsfw && (
                                        <div className="flex items-center bg-purple-600/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                            <EyeOff className="w-4 h-4 mr-1.5 text-white" />
                                            <span>
                                                NSFW
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative -mt-14 sm:-mt-20 md:-mt-28 lg:-mt-32 z-20 pb-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left sidebar with content info */}
                    <div className="lg:col-span-3 xl:col-span-3">
                        {/* Cover image card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 transform lg:-translate-y-12">
                            {/* Cover image */}
                            <div
                                className="relative pt-[140%] bg-gray-200 dark:bg-gray-700 overflow-hidden"
                                onClick={() =>
                                    isNsfw &&
                                    setIsNsfwRevealed(
                                        (prev) => !prev
                                    )
                                }
                            >
                                {!contentReady ? (
                                    <div className="absolute inset-0 bg-gray-300 dark:bg-gray-800 animate-pulse"></div>
                                ) : (
                                    <>
                                        {userData?.customCover ||
                                        coverImage ? (
                                            <>
                                                <Image
                                                    src={
                                                        userData?.customCover ||
                                                        coverImage ||
                                                        ""
                                                    }
                                                    alt={
                                                        content.title
                                                    }
                                                    fill
                                                    className={`object-cover ${
                                                        isNsfw &&
                                                        !isNsfwRevealed
                                                            ? "blur-2xl"
                                                            : ""
                                                    }`}
                                                    sizes="(max-width: 1024px) 30vw, 20vw"
                                                    priority
                                                />

                                                {/* NSFW overlay in cover */}
                                                {isNsfw &&
                                                    !isNsfwRevealed && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 cursor-pointer">
                                                            <EyeOff className="w-8 h-8 text-white mb-2" />
                                                            <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium">
                                                                NSFW
                                                                Content
                                                            </span>
                                                            <span className="mt-2 text-white text-xs">
                                                                Tap
                                                                to
                                                                reveal
                                                            </span>
                                                        </div>
                                                    )}

                                                {/* NSFW badge when revealed */}
                                                {isNsfw &&
                                                    isNsfwRevealed && (
                                                        <div
                                                            className="absolute top-2 right-2 p-2 bg-purple-600 text-white rounded-md cursor-pointer"
                                                            onClick={() =>
                                                                setIsNsfwRevealed(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </div>
                                                    )}
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <ContentTypeIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Favorite button */}
                            <div className="grid grid-cols-2 gap-1 p-1">
                                <button
                                    onClick={async () => {
                                        await updateMetadata.mutateAsync(
                                            {
                                                contentId:
                                                    content.id,
                                                data: {
                                                    favorite:
                                                        !(
                                                            userData?.favorite ||
                                                            false
                                                        ),
                                                },
                                            }
                                        );
                                        handleDataUpdate();
                                    }}
                                    className={`flex items-center justify-center gap-1.5 ${
                                        userData?.favorite
                                            ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400"
                                            : "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-800/30 text-orange-600 dark:text-orange-400"
                                    } font-medium py-2.5 px-4 rounded-lg transition-colors text-sm`}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${
                                            userData?.favorite
                                                ? "fill-red-500"
                                                : ""
                                        }`}
                                    />
                                    <span>
                                        {userData?.favorite
                                            ? "Favorited"
                                            : "Favorite"}
                                    </span>
                                </button>
                                <button className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-800/30 text-blue-600 dark:text-blue-400 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>

                        {/* Information panel */}
                        <div className="mt-6 lg:mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Information
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {/* Content Type */}
                                <div className="flex items-center p-4">
                                    <ContentTypeIcon className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                            Type
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {
                                                contentTypeLabel
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Volumes */}
                                <div className="flex items-center p-4">
                                    <BookOpen className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                            Volumes
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {
                                                content.volumes
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Pages */}
                                <div className="flex items-center p-4">
                                    <Book className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                    <div>
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                            Pages
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {totalPages}
                                        </span>
                                    </div>
                                </div>

                                {userData?.author && (
                                    <div className="flex items-center p-4">
                                        <User className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                        <div>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                                Author
                                            </span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {
                                                    userData.author
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {userData?.artist &&
                                    userData.artist !==
                                        userData.author && (
                                        <div className="flex items-center p-4">
                                            <User className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                            <div>
                                                <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                                    Artist
                                                </span>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {
                                                        userData.artist
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                {userData?.status && (
                                    <div className="flex items-center p-4">
                                        <Star className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                        <div>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                                Status
                                            </span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                {userData.status.replace(
                                                    /-/g,
                                                    " "
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {userData?.releaseYear && (
                                    <div className="flex items-center p-4">
                                        <Clock className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                        <div>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                                                Published
                                            </span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {
                                                    userData.releaseYear
                                                }
                                                {userData.publisher &&
                                                    ` by ${userData.publisher}`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats cards */}
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 p-4 text-center">
                                <div className="flex items-center justify-center mb-1">
                                    <Heart className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="block text-lg font-bold text-gray-900 dark:text-white">
                                    {MOCK_DATA.favoriteCount.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Favorites
                                </span>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 p-4 text-center">
                                <div className="flex items-center justify-center mb-1">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="block text-lg font-bold text-gray-900 dark:text-white">
                                    {MOCK_DATA.readCount.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Reads
                                </span>
                            </div>
                        </div>

                        {/* Content Management Panel */}
                        <div className="mt-6">
                            {isLoading ? (
                                <ContentManagementPanelSkeleton />
                            ) : (
                                <ContentManagementPanel
                                    content={content}
                                    userData={userData}
                                    onUpdate={
                                        handleDataUpdate
                                    }
                                />
                            )}
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="lg:col-span-9 xl:col-span-9 space-y-6">
                        {/* Description section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                    About
                                </h2>

                                {/* Genre tags */}
                                <div className="hidden sm:flex flex-wrap gap-2">
                                    {MOCK_DATA.genres
                                        .slice(0, 3)
                                        .map((genre) => (
                                            <span
                                                key={genre}
                                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    {MOCK_DATA.genres
                                        .length > 3 && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            +
                                            {MOCK_DATA
                                                .genres
                                                .length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-5">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {userData?.notes ||
                                        MOCK_DATA.description}
                                </p>

                                {/* Tags - mobile only */}
                                <div className="mt-4 flex sm:hidden flex-wrap gap-2">
                                    {MOCK_DATA.genres.map(
                                        (genre) => (
                                            <span
                                                key={genre}
                                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                            >
                                                {genre}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Real tags section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                    Tags
                                </h2>
                            </div>

                            <div className="p-5">
                                <TagManagement
                                    showInline={true}
                                    selectedTagIds={
                                        contentWithUserData?.contentTags?.map(
                                            (ct) => ct.tagId
                                        ) || []
                                    }
                                    onTagSelect={
                                        handleTagSelect
                                    }
                                    onTagsChange={
                                        handleDataUpdate
                                    }
                                    isLoading={isLoading}
                                    isUpdating={
                                        updateMetadata.isPending
                                    }
                                />
                            </div>
                        </div>

                        {/* Volumes section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                        <ContentTypeIcon className="w-5 h-5 mr-2 text-orange-500" />
                                        Volumes
                                    </h2>
                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
                                        {content
                                            .contentVolumes
                                            ?.length ||
                                            0}{" "}
                                        volumes available
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                {content.contentVolumes &&
                                content.contentVolumes
                                    .length > 0 ? (
                                    <VolumeGrid
                                        volumes={
                                            content.contentVolumes
                                        }
                                        contentId={
                                            content.id
                                        }
                                        contentType={
                                            content.contentType
                                        }
                                        showReadingHistory
                                        isNsfw={isNsfw}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <ContentTypeIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p>
                                            No volumes
                                            available for
                                            this content.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
