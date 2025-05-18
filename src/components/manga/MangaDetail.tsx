"use client";

import {
  Book,
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Share2,
  Star,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import {
  Volume,
  MangaMetadata,
  ExtendedUserMangaMetadata,
} from "@/types/manga";
import { VolumeGrid } from "./VolumeGrid";
import { MangaManagementPanel } from "./MangaManagementPanel";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  fetchMangaWithUserData,
  updateMangaMetadata,
} from "@/actions/manga-management-api-prisma";
import { TagManagement } from "./TagManagement";
import { MangaManagementPanelSkeleton } from "./MangaManagementPanelSkeleton";

// Mock data for aesthetic elements
const MOCK_DATA = {
  description:
    "Đại học Bách khoa Hà Nội (tên tiếng Anh Hanoi University of Science and Technology – viết tắt HUST) được thành lập theo Nghị định số 147/NĐ ngày 6-3-1956 do Bộ trưởng Bộ Giáo dục Nguyễn Văn Huyên ký. Đây là trường đại học kỹ thuật đầu tiên của nước ta có nhiệm vụ đào tạo kỹ sư công nghiệp cho công cuộc xây dựng CNXH ở miền Bắc và đấu tranh giải phóng miền Nam; là trung tâm đào tạo, nghiên cứu khoa học và công nghệ đa ngành, đa lĩnh vực; kết hợp chặt chẽ giữa đào tạo với nghiên cứu khoa học nhằm tạo nguồn nhân lực chất lượng cao và bồi dưỡng nhân tài khoa học, công nghệ; định hướng phát triển thành đại học nghiên cứu ngang tầm với các đại học có uy tín trong khu vực và trên thế giới.",
  genres: ["Action", "Adventure", "Fantasy", "Shounen"],
  demographicTags: ["Young Adult", "Teen"],
  contentTags: [
    "First Time Intersect",
    "Overpowered Protagonist",
    "Love Interest Falls in Love First",
    "Love Triangle",
    "Super Power",
    "Drama",
    "Comedy",
    "High School Setting",
    "Enemies to Lovers",
  ],
  readCount: 58432,
  favoriteCount: 3219,
};

interface MangaDetailProps {
  manga: {
    id: string;
    title: string;
    volumes: Volume[];
  };
}

// Create a reducer to handle data fetching states
type State = {
  userData: ExtendedUserMangaMetadata | null;
  isLoading: boolean;
  error: Error | null;
  lastFetched: number;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ExtendedUserMangaMetadata | null }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        userData: action.payload,
        lastFetched: Date.now(),
      };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "RESET":
      return { userData: null, isLoading: false, error: null, lastFetched: 0 };
    default:
      return state;
  }
}

export function MangaDetail({ manga }: MangaDetailProps) {
  // Use reducer for better state management
  const [state, dispatch] = useReducer(reducer, {
    userData: null,
    isLoading: true,
    error: null,
    lastFetched: 0,
  });

  // NSFW revealing state
  const [isNsfwRevealed, setIsNsfwRevealed] = useState(false);
  // Content loading state to prevent flashing of NSFW content
  const [contentReady, setContentReady] = useState(false);

  // Track if the component is mounted
  const isMounted = useRef(true);

  // Reference for previous manga ID to detect changes
  const prevMangaIdRef = useRef(manga.id);

  // Cache timeout in milliseconds (30 seconds)
  const CACHE_TIMEOUT = 30000;

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true;

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const mangaIdChanged = prevMangaIdRef.current !== manga.id;
    prevMangaIdRef.current = manga.id;

    // Reset content ready state when manga changes
    if (mangaIdChanged) {
      setContentReady(false);
    }

    // Determine if we should fetch data
    const shouldFetch =
      mangaIdChanged || // Manga changed
      !state.userData || // No data
      Date.now() - state.lastFetched > CACHE_TIMEOUT; // Cache expired

    if (!shouldFetch) {
      console.log(
        `[MangaDetail] Using cached data for ${manga.id}, age: ${
          (Date.now() - state.lastFetched) / 1000
        }s`
      );
      // Even when using cached data, ensure content is ready
      if (!contentReady) setContentReady(true);
      return;
    }

    const loadData = async () => {
      console.log(`[MangaDetail] Fetching data for ${manga.id}`);
      dispatch({ type: "FETCH_START" });

      try {
        const mangaData = await fetchMangaWithUserData(manga.id);

        // Only update state if component is still mounted
        if (isMounted.current) {
          console.log(
            `[MangaDetail] Fetched data for ${manga.id}:`,
            mangaData?.userData ? "has user data" : "no user data"
          );
          dispatch({
            type: "FETCH_SUCCESS",
            payload: mangaData?.userData || null,
          });
          // Mark content as ready once we have the data
          setContentReady(true);
        }
      } catch (error) {
        console.error("[MangaDetail] Error loading manga data:", error);

        if (isMounted.current) {
          dispatch({
            type: "FETCH_ERROR",
            payload: error instanceof Error ? error : new Error(String(error)),
          });
          // Even with an error, we should show content (just without NSFW protection)
          setContentReady(true);
        }
      }
    };

    loadData();
  }, [manga.id, state.lastFetched]);

  const handleDataUpdate = async () => {
    try {
      console.log(`[MangaDetail] Refreshing manga data for ${manga.id}`);
      dispatch({ type: "FETCH_START" });

      const updatedManga = await fetchMangaWithUserData(manga.id);

      if (updatedManga) {
        console.log(`[MangaDetail] Updated userData for manga ${manga.id}:`, {
          collectionIds: updatedManga.userData?.collectionIds,
          tagIds: updatedManga.userData?.tagIds,
          status: updatedManga.userData?.status,
        });

        dispatch({
          type: "FETCH_SUCCESS",
          payload: updatedManga.userData,
        });
      } else {
        console.warn(
          `[MangaDetail] No updated manga data found for ${manga.id}`
        );
        dispatch({
          type: "FETCH_SUCCESS",
          payload: null,
        });
      }
    } catch (error) {
      console.error("[MangaDetail] Error updating manga data:", error);
      dispatch({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error : new Error(String(error)),
      });
    }
  };

  // Use the userData and isLoading from the state
  const { userData, isLoading } = state;
  const isNsfw = userData?.isNsfw || false;

  const totalPages = manga.volumes.reduce(
    (total, vol) => total + (vol.metadata?.pageCount || 0),
    0
  );

  // Use the last volume's cover as the manga cover
  const coverImage =
    manga.volumes.length > 0
      ? manga.volumes[manga.volumes.length - 1].coverImage
      : null;

  // Create a compatible manga metadata object for the management panel
  const mangaMetadata: MangaMetadata = {
    id: manga.id,
    title: manga.title,
    volumes: manga.volumes.length,
    coverImage: coverImage || undefined,
    lastModified: new Date().toISOString(),
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner with parallax effect - MADE LARGER */}
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
                  alt={manga.title}
                  fill
                  className={`object-cover scale-125 opacity-40 blur-[8px] transform-gpu ${
                    isNsfw && !isNsfwRevealed ? "filter blur-3xl" : "blur-[8px]"
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
              style={{ mixBlendMode: "multiply" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900 opacity-70 z-10"></div>

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.07] z-[11] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>

            {/* NSFW warning overlay */}
            {isNsfw && !isNsfwRevealed && (
              <div className="fixed inset-0 z-21 flex items-center justify-center">
                <div className="text-center p-8 bg-gray-900/90 rounded-xl backdrop-blur-md max-w-md">
                  <div className="inline-flex items-center justify-center mb-3 bg-purple-600 rounded-full p-3 text-white">
                    <EyeOff className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    NSFW Content
                  </h2>
                  <p className="text-gray-300 mb-4">
                    This manga contains mature content that may not be suitable
                    for all audiences.
                  </p>
                  <button
                    onClick={() => setIsNsfwRevealed(true)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Reveal Content
                  </button>
                </div>
              </div>
            )}

            {/* Content container that allows title to be visible on the banner - REPOSITIONED */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full z-20 flex items-end">
              <div className="pb-24 md:pb-60 w-full max-w-6xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white drop-shadow-lg tracking-tight mb-3 sm:mb-4 lg:mb-5 leading-tight">
                  {manga.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-white/90">
                  {userData?.author && (
                    <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <User className="w-4 h-4 mr-1.5 text-orange-300" />
                      <span>{userData.author}</span>
                    </div>
                  )}
                  {userData?.rating && (
                    <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Star className="w-4 h-4 mr-1.5 text-yellow-300" />
                      <span>{userData.rating}</span>
                    </div>
                  )}
                  {userData?.releaseYear && (
                    <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Calendar className="w-4 h-4 mr-1.5 text-blue-300" />
                      <span>{userData.releaseYear}</span>
                    </div>
                  )}
                  {userData?.status && (
                    <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <Clock className="w-4 h-4 mr-1.5 text-green-300" />
                      <span>{userData.status}</span>
                    </div>
                  )}
                  {isNsfw && (
                    <div className="flex items-center bg-purple-600/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <EyeOff className="w-4 h-4 mr-1.5 text-white" />
                      <span>NSFW</span>
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
          {/* Left sidebar with manga info */}
          <div className="lg:col-span-3 xl:col-span-3">
            {/* Cover image card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700 transform lg:-translate-y-12">
              {/* Cover image */}
              <div
                className="relative pt-[140%] bg-gray-200 dark:bg-gray-700 overflow-hidden"
                onClick={() => isNsfw && setIsNsfwRevealed((prev) => !prev)}
              >
                {!contentReady ? (
                  <div className="absolute inset-0 bg-gray-300 dark:bg-gray-800 animate-pulse"></div>
                ) : (
                  <>
                    {userData?.customCover || coverImage ? (
                      <>
                        <Image
                          src={userData?.customCover || coverImage || ""}
                          alt={manga.title}
                          fill
                          className={`object-cover ${
                            isNsfw && !isNsfwRevealed ? "blur-2xl" : ""
                          }`}
                          sizes="(max-width: 1024px) 30vw, 20vw"
                          priority
                        />

                        {/* NSFW overlay in cover */}
                        {isNsfw && !isNsfwRevealed && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 cursor-pointer">
                            <EyeOff className="w-8 h-8 text-white mb-2" />
                            <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium">
                              NSFW Content
                            </span>
                            <span className="mt-2 text-white text-xs">
                              Tap to reveal
                            </span>
                          </div>
                        )}

                        {/* NSFW badge when revealed */}
                        {isNsfw && isNsfwRevealed && (
                          <div
                            className="absolute top-2 right-2 p-2 bg-purple-600 text-white rounded-md cursor-pointer"
                            onClick={() => setIsNsfwRevealed(false)}
                          >
                            <Eye className="w-4 h-4" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-20 h-20 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Favorite button */}
              <div className="grid grid-cols-2 gap-1 p-1">
                <button
                  className={`flex items-center justify-center gap-1.5 ${
                    userData?.favorite
                      ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400"
                      : "bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-800/30 text-orange-600 dark:text-orange-400"
                  } font-medium py-2.5 px-4 rounded-lg transition-colors text-sm`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      userData?.favorite ? "fill-red-500" : ""
                    }`}
                  />
                  <span>{userData?.favorite ? "Favorited" : "Favorite"}</span>
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
                <div className="flex items-center p-4">
                  <BookOpen className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                      Volumes
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {manga.volumes.length}
                    </span>
                  </div>
                </div>

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
                        {userData.author}
                      </span>
                    </div>
                  </div>
                )}

                {userData?.artist && userData.artist !== userData.author && (
                  <div className="flex items-center p-4">
                    <User className="w-5 h-5 mr-3 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                        Artist
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {userData.artist}
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
                        {userData.status.replace(/-/g, " ")}
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
                        {userData.releaseYear}
                        {userData.publisher && ` by ${userData.publisher}`}
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

            {/* Manga Management Panel */}
            <div className="mt-6">
              {isLoading ? (
                <MangaManagementPanelSkeleton />
              ) : (
                <MangaManagementPanel
                  manga={mangaMetadata}
                  userData={userData}
                  onUpdate={handleDataUpdate}
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
                  {MOCK_DATA.genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {genre}
                    </span>
                  ))}
                  {MOCK_DATA.genres.length > 3 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      +{MOCK_DATA.genres.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {userData?.notes || MOCK_DATA.description}
                </p>

                {/* Tags - mobile only */}
                <div className="mt-4 flex sm:hidden flex-wrap gap-2">
                  {MOCK_DATA.genres.map((genre) => (
                    <span
                      key={genre}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {genre}
                    </span>
                  ))}
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
                  selectedTagIds={userData?.tagIds || []}
                  onTagSelect={async (tagId: string) => {
                    // Toggle tag selection
                    const currentTags = userData?.tagIds || [];
                    const newTags = currentTags.includes(tagId)
                      ? currentTags.filter((id) => id !== tagId)
                      : [...currentTags, tagId];

                    // Update user metadata with new tags
                    await updateMangaMetadata(manga.id, {
                      tagIds: newTags,
                    });

                    // Refresh data
                    handleDataUpdate();
                  }}
                  onTagsChange={handleDataUpdate}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Volumes section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Book className="w-5 h-5 mr-2 text-orange-500" />
                    Volumes
                  </h2>
                  <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    {manga.volumes.length} volumes available
                  </span>
                </div>
              </div>

              <div className="p-5">
                <VolumeGrid volumes={manga.volumes} mangaId={manga.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
