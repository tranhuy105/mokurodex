import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Book,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  Star,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Volume } from "@/types/manga";
import { getUserMangaMetadata } from "@/actions/manga-management-actions";

// Mock data for volumes - only use when real data isn't available
export const VOLUME_MOCK_DATA = {
  getRandomReadCount: (seed: string) => {
    // Use a deterministic approach instead of Math.random()
    let hash = 0;
    if (seed.length === 0) return 5000;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Generate a number between 1000 and 10000
    return 1000 + (Math.abs(hash) % 9000);
  },
  getRandomRating: (seed: string) => {
    // Use a deterministic approach instead of Math.random() to avoid hydration errors
    // Simple hash function to generate a number from a string
    let hash = 0;
    if (seed.length === 0) return "4.5";
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Generate a rating between 4.0 and 5.0 based on the hash
    const normalizedHash = Math.abs(hash) % 11; // 0-10
    return (4.0 + normalizedHash / 10).toFixed(1);
  },
  getReleaseInfo: (seed: string) => {
    const publishers = [
      "VIZ Media",
      "Shueisha",
      "Kodansha",
      "Yen Press",
      "Seven Seas",
    ];

    // Deterministic publisher selection based on seed
    let hash = 0;
    if (seed.length === 0)
      return { publisher: publishers[0], releaseDate: "2023-01-01" };

    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const publisherIndex = Math.abs(hash) % publishers.length;
    const publisher = publishers[publisherIndex];

    // Generate a deterministic date (within last 5 years)
    const year = 2019 + (Math.abs(hash) % 5);
    const month = 1 + (Math.abs(hash >> 8) % 12);
    const day = 1 + (Math.abs(hash >> 16) % 28);

    // Format as YYYY-MM-DD
    const releaseDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    return {
      publisher,
      releaseDate,
    };
  },
};

interface VolumeCardProps {
  volume: Volume;
  mangaId: string;
}

// Format date for display
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  } catch {
    return "Unknown date";
  }
}

export function VolumeCard({ volume, mangaId }: VolumeCardProps) {
  const pageCount = volume.metadata?.pageCount || 0;
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isHoveringPreview, setIsHoveringPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isNsfwRevealed, setIsNsfwRevealed] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Get preview images from the VolumeEntity previewImages property
  const previewImages = volume.previewImages || [];
  const hasPreviewImages = previewImages && previewImages.length > 0;

  // Check if the parent manga is marked as NSFW
  useEffect(() => {
    async function checkNsfwStatus() {
      try {
        const userData = await getUserMangaMetadata(mangaId);
        if (userData?.isNsfw) {
          setIsNsfw(true);
        }
        // Mark content as ready once we know the NSFW status
        setContentReady(true);
      } catch (error) {
        console.error("Error checking NSFW status:", error);
        // Even with an error, we should show content (just without NSFW protection)
        setContentReady(true);
      }
    }

    // Reset content ready and start checking
    setContentReady(false);
    checkNsfwStatus();
  }, [mangaId]);

  // Handle image load completion
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // Toggle NSFW reveal
  const toggleNsfwReveal = (e: React.MouseEvent) => {
    if (isNsfw) {
      e.preventDefault();
      e.stopPropagation();
      setIsNsfwRevealed(!isNsfwRevealed);
    }
  };

  // Reset loading state when active preview changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [activePreviewIndex]);

  // Use real metadata if available, otherwise use mock data
  const hasMetadata = volume.metadata !== undefined;
  // Use deterministic readCount to prevent hydration errors
  const readCount = VOLUME_MOCK_DATA.getRandomReadCount(
    volume.mokuroData.volume_uuid || volume.mokuroData.volume
  );
  // Use a deterministic rating based on volume ID to prevent hydration errors
  const rating = VOLUME_MOCK_DATA.getRandomRating(
    volume.mokuroData.volume_uuid || volume.mokuroData.volume
  );

  // Get release info (real or mock)
  const releaseInfo =
    hasMetadata && volume.metadata
      ? {
          publisher: volume.metadata.publisher || "Unknown Publisher",
          releaseDate: formatDate(volume.metadata.releaseDate),
        }
      : VOLUME_MOCK_DATA.getReleaseInfo(
          volume.mokuroData.volume_uuid || volume.mokuroData.volume
        );

  // Navigation functions for preview carousel
  const goToPrevPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePreviewIndex((prev) =>
      prev === 0 ? previewImages.length - 1 : prev - 1
    );
  };

  const goToNextPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePreviewIndex((prev) =>
      prev === previewImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg h-full">
      <div className="sm:flex h-full">
        {/* Cover image section - made wider on desktop */}
        <div className="sm:w-2/5 lg:w-1/2 ">
          <Link
            href={`/manga/${encodeURIComponent(mangaId)}/${
              volume.mokuroData.volume_uuid
            }/1`}
            className="group block relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-900"
            onClick={isNsfw && !isNsfwRevealed ? toggleNsfwReveal : undefined}
          >
            {!contentReady ? (
              // Loading state
              <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
            ) : (
              <>
                {volume.coverImage ? (
                  <>
                    <Image
                      src={volume.coverImage}
                      alt={`Volume ${volume.mokuroData.volume} cover`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isNsfw && !isNsfwRevealed ? "blur-xl" : ""
                      }`}
                      priority
                    />

                    {/* NSFW overlay */}
                    {isNsfw && !isNsfwRevealed && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                        <div className="bg-purple-600 rounded-full p-3 mb-2">
                          <EyeOff className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-medium">
                          NSFW Content
                        </span>
                        <span className="text-white/80 text-sm mt-1">
                          Click to reveal
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Book className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                {/* Volume badge */}
                <div className="absolute top-3 left-3 bg-orange-600 text-white px-2.5 py-1 rounded-md text-sm font-bold shadow-md z-30">
                  Vol. {volume.mokuroData.volume}
                </div>

                {/* NSFW badge if marked */}
                {isNsfw && (
                  <div className="absolute top-3 right-3 bg-purple-600 text-white px-2.5 py-1 rounded-md text-sm font-bold shadow-md z-30">
                    NSFW
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Read button */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center transform translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="bg-orange-600 hover:bg-orange-700 text-white rounded-full py-2 px-4 flex items-center justify-center shadow-lg">
                    {isNsfw && !isNsfwRevealed ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        <span className="font-medium text-sm">
                          Reveal Content
                        </span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="font-medium text-sm">Read Now</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Content section */}
        <div className="sm:w-3/5 lg:w-2/3 p-4 flex flex-col">
          {/* Header with title and rating */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                Volume {volume.mokuroData.volume}
                {contentReady && isNsfw && (
                  <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded">
                    NSFW
                  </span>
                )}
              </h3>
              {volume.mokuroData.title && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {volume.mokuroData.title}
                </p>
              )}
            </div>
            <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span className="font-medium">{rating}</span>
            </div>
          </div>

          {/* Volume metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
              <span>{pageCount || "?"} pages</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
              <span>{readCount.toLocaleString()} reads</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
              <span>{releaseInfo.releaseDate}</span>
            </div>
            <div className="flex items-center">
              <ExternalLink className="w-4 h-4 mr-1.5 text-gray-400 dark:text-gray-500" />
              <span className="truncate">{releaseInfo.publisher}</span>
            </div>
          </div>

          {/* Preview section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Preview Pages
              </h4>
              <Link
                href={`/manga/${encodeURIComponent(mangaId)}/${
                  volume.mokuroData.volume_uuid
                }/1`}
                className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            {hasPreviewImages ? (
              <div className="sm:flex sm:space-x-3">
                {/* Main preview image - contained size on desktop */}
                <div
                  className="relative w-full sm:w-3/4 aspect-[4/3] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
                  onMouseEnter={() => setIsHoveringPreview(true)}
                  onMouseLeave={() => setIsHoveringPreview(false)}
                  onClick={
                    isNsfw && !isNsfwRevealed ? toggleNsfwReveal : undefined
                  }
                >
                  <Link
                    href={`/manga/${encodeURIComponent(mangaId)}/${
                      volume.mokuroData.volume_uuid
                    }/1`}
                    className="block relative h-full rounded-lg overflow-hidden cursor-pointer"
                    onClick={
                      isNsfw && !isNsfwRevealed
                        ? (e) => e.preventDefault()
                        : undefined
                    }
                  >
                    {!contentReady ? (
                      // Loading placeholder for preview image
                      <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
                    ) : (
                      <>
                        {/* Loading shimmer */}
                        {isLoading && (
                          <div className="absolute inset-0 bg-gradient-to-r from-gray-300 dark:from-gray-700 to-gray-200 dark:to-gray-800 animate-pulse" />
                        )}

                        {/* Error display */}
                        {imageError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-8 h-8 mx-auto mb-1 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              <p className="text-xs">Failed to load image</p>
                            </div>
                          </div>
                        )}

                        {/* NSFW overlay for preview */}
                        {isNsfw && !isNsfwRevealed && (
                          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gray-900/80 text-white">
                            <EyeOff className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">
                              NSFW Content
                            </span>
                            <span className="text-xs mt-1">
                              Click to reveal
                            </span>
                          </div>
                        )}

                        {/* Preview images */}
                        {previewImages.map((src, index) => (
                          <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-300 ${
                              index === activePreviewIndex
                                ? "opacity-100 z-10"
                                : "opacity-0 z-0"
                            }`}
                          >
                            <Image
                              src={src}
                              alt={`Preview page ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className={`object-contain ${
                                isNsfw && !isNsfwRevealed ? "blur-xl" : ""
                              }`}
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                              priority={index === activePreviewIndex}
                            />
                          </div>
                        ))}

                        {/* Page counter */}
                        <div className="absolute bottom-2 right-2 z-20">
                          <div className="px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                            {activePreviewIndex + 1} / {previewImages.length}
                          </div>
                        </div>
                      </>
                    )}
                  </Link>

                  {/* Navigation arrows - only show if content is revealed or not NSFW and content is ready */}
                  {previewImages.length > 1 &&
                    contentReady &&
                    (!isNsfw || isNsfwRevealed) && (
                      <>
                        <button
                          onClick={goToPrevPreview}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-20
                          ${
                            isHoveringPreview
                              ? "bg-black/60 text-white opacity-80 hover:bg-orange-600"
                              : "bg-black/40 text-white/90 opacity-60 sm:opacity-0"
                          } transition-opacity duration-200`}
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={goToNextPreview}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-20
                          ${
                            isHoveringPreview
                              ? "bg-black/60 text-white opacity-80 hover:bg-orange-600"
                              : "bg-black/40 text-white/90 opacity-60 sm:opacity-0"
                          } transition-opacity duration-200`}
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                </div>

                {/* Thumbnail grid - right side on desktop, bottom on mobile */}
                <div className="mt-3 sm:mt-0 sm:w-1/4 flex flex-wrap sm:grid sm:grid-cols-2 sm:gap-2 gap-1">
                  {contentReady
                    ? previewImages.slice(0, 8).map((src, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isNsfw && !isNsfwRevealed) {
                              toggleNsfwReveal(e);
                            } else {
                              setActivePreviewIndex(index);
                            }
                          }}
                          className={`relative mx-0.5 mb-1 sm:mx-0 sm:mb-0 h-11 w-11 sm:h-14 sm:w-14 rounded overflow-hidden border-2 transition-all duration-200 
                          ${
                            index === activePreviewIndex
                              ? "border-orange-500 ring-1 ring-orange-300 dark:ring-orange-700"
                              : "border-transparent hover:border-orange-300 dark:hover:border-orange-700"
                          }
                          ${isNsfw && !isNsfwRevealed ? "blur-lg" : ""}`}
                          aria-label={`View preview ${index + 1}`}
                        >
                          <Image
                            src={src}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </button>
                      ))
                    : // Loading placeholders for thumbnails
                      Array(4)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="mx-0.5 mb-1 sm:mx-0 sm:mb-0 h-11 w-11 sm:h-14 sm:w-14 rounded overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse"
                          />
                        ))}
                  {contentReady && previewImages.length > 8 && (
                    <div className="relative mx-0.5 mb-1 sm:mx-0 sm:mb-0 h-11 w-11 sm:h-14 sm:w-14 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      +{previewImages.length - 8}
                    </div>
                  )}
                </div>
              </div>
            ) : // Empty state or loading state
            !contentReady ? (
              <div className="aspect-[4/3] max-w-full bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ) : (
              <div className="aspect-[4/3] max-w-full bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                  <Book className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-medium">No preview available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
