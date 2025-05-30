"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
    ContentType,
    ReadingHistory,
    Volume,
} from "@/types/content";
import {
    Book,
    BookOpen,
    BookText,
    Calendar,
    Clock,
    EyeOff,
    FileText,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface VolumeCardProps {
    volume: Volume;
    contentId: string;
    contentType: ContentType;
    readingHistory?: ReadingHistory | null;
    isNsfw?: boolean;
    isNsfwRevealed?: boolean;
    viewMode?: "grid" | "list";
}

export function VolumeCard({
    volume,
    contentId,
    contentType,
    readingHistory,
    isNsfw = false,
    isNsfwRevealed = false,
    viewMode = "list",
}: VolumeCardProps) {
    const [selectedPreview, setSelectedPreview] =
        useState(0);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Get preview images from the Volume previewImages property
    const previewImagesJson = volume.previewImages || "[]";
    const previewImages = JSON.parse(previewImagesJson);
    const hasPreviewImages =
        contentType === "manga" &&
        previewImages &&
        previewImages.length > 0;

    // Calculate progress percentage if reading history exists
    const progress = readingHistory
        ? contentType === "manga"
            ? Math.min(
                  Math.round(
                      (readingHistory.position /
                          (volume.pageCount || 1)) *
                          100
                  ),
                  100
              )
            : Math.min(readingHistory.position, 100) // For light novels, position is already a percentage
        : 0;

    // Determine the appropriate href based on content type
    const href =
        contentType === "manga"
            ? `/reader/manga/${contentId}/${
                  volume.volumeNumber
              }/${readingHistory?.position || 1}`
            : `/reader/epub/${contentId}/${volume.volumeNumber}`;

    // Get the appropriate icon based on content type
    const VolumeIcon =
        contentType === "manga" ? Book : BookText;

    // Handle image load completion
    const handleImageLoad = () => {
        setIsLoading(false);
    };

    // Handle image error
    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    // Get metadata from volume
    const metadata = volume.metadata
        ? JSON.parse(volume.metadata || "{}")
        : {};

    // Grid view - simplified and mobile-friendly
    if (viewMode === "grid") {
        return (
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Cover image */}
                <Link
                    href={href}
                    className="block relative aspect-[2/3] w-full bg-muted"
                >
                    {volume.coverImage ? (
                        <>
                            <Image
                                src={volume.coverImage}
                                alt={`Volume ${volume.volumeTitle} cover`}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className={cn(
                                    "object-cover",
                                    isNsfw &&
                                        !isNsfwRevealed &&
                                        "blur-xl"
                                )}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />

                            {isNsfw && !isNsfwRevealed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <EyeOff className="w-6 h-6 text-white" />
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-muted animate-pulse" />
                            )}

                            {imageError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                    <VolumeIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <VolumeIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}

                    <Badge className="absolute top-2 left-2 text-xs">
                        Vol {volume.volumeNumber}
                    </Badge>

                    {readingHistory && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-xs">
                            {progress}%
                        </Badge>
                    )}
                </Link>

                {/* Content */}
                <div className="p-3 space-y-2">
                    <Link
                        href={href}
                        className="font-medium text-sm hover:text-primary line-clamp-2 leading-snug"
                    >
                        {volume.volumeTitle ||
                            `Volume ${volume.volumeNumber}`}
                    </Link>

                    <div className="text-xs text-muted-foreground">
                        {volume.pageCount || 0} pages
                    </div>

                    {readingHistory && (
                        <div className="space-y-1">
                            <Progress
                                value={progress}
                                className="h-1"
                            />
                            <div className="text-xs text-muted-foreground">
                                {progress}% complete
                            </div>
                        </div>
                    )}

                    <Button
                        asChild
                        size="sm"
                        className="w-full text-xs h-8"
                    >
                        <Link href={href}>
                            {readingHistory ? (
                                <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Continue
                                </>
                            ) : (
                                <>
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Read
                                </>
                            )}
                        </Link>
                    </Button>
                </div>
            </Card>
        );
    }

    // List view - mobile-first design
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-3 sm:p-4">
                {/* Header section */}
                <div className="flex gap-3 mb-3">
                    {/* Cover image - smaller and consistent */}
                    <Link
                        href={href}
                        className="relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 bg-muted rounded overflow-hidden"
                    >
                        {volume.coverImage ? (
                            <>
                                <Image
                                    src={volume.coverImage}
                                    alt={`Volume ${volume.volumeTitle} cover`}
                                    fill
                                    sizes="80px"
                                    className={cn(
                                        "object-cover",
                                        isNsfw &&
                                            !isNsfwRevealed &&
                                            "blur-xl"
                                    )}
                                    onLoad={handleImageLoad}
                                    onError={
                                        handleImageError
                                    }
                                />

                                {isNsfw &&
                                    !isNsfwRevealed && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <EyeOff className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                {isLoading && (
                                    <div className="absolute inset-0 bg-muted animate-pulse" />
                                )}

                                {imageError && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                        <VolumeIcon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                <VolumeIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                        )}

                        {/* Progress indicator on cover */}
                        {readingHistory && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>
                        )}
                    </Link>

                    {/* Content info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={href}
                                    className="font-medium text-sm sm:text-base hover:text-primary line-clamp-2 leading-snug"
                                >
                                    {volume.volumeTitle ||
                                        `Volume ${volume.volumeNumber}`}
                                </Link>

                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant="outline"
                                        className="text-xs h-5 px-2"
                                    >
                                        Vol{" "}
                                        {
                                            volume.volumeNumber
                                        }
                                    </Badge>
                                    {readingHistory && (
                                        <Badge className="text-xs h-5 px-2 bg-blue-600">
                                            {progress}%
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <Button
                                asChild
                                size="sm"
                                className="flex-shrink-0 text-xs h-8 px-3"
                            >
                                <Link href={href}>
                                    {readingHistory ? (
                                        <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">
                                                Continue
                                            </span>
                                            <span className="sm:hidden">
                                                Go
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">
                                                Read
                                            </span>
                                            <span className="sm:hidden">
                                                Go
                                            </span>
                                        </>
                                    )}
                                </Link>
                            </Button>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                {volume.pageCount || 0}{" "}
                                pages
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(
                                    volume.addedDate
                                ).toLocaleDateString()}
                            </div>
                            {contentType === "lightnovel" &&
                                metadata.creator && (
                                    <div>
                                        By{" "}
                                        {metadata.creator}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                {readingHistory && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-1.5"
                        />
                    </div>
                )}

                {/* Preview images - horizontal scroll */}
                {hasPreviewImages && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                            Preview Pages
                        </div>

                        {/* Selected preview - large display */}
                        <div className="relative h-32 sm:h-40 bg-muted rounded overflow-hidden">
                            <Image
                                src={
                                    previewImages[
                                        selectedPreview
                                    ]
                                }
                                alt={`Preview ${
                                    selectedPreview + 1
                                }`}
                                fill
                                className={cn(
                                    "object-contain",
                                    isNsfw &&
                                        !isNsfwRevealed &&
                                        "blur-xl"
                                )}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />

                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {selectedPreview + 1} /{" "}
                                {previewImages.length}
                            </div>
                        </div>

                        {/* Preview thumbnails - horizontal scroll */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                            {previewImages.map(
                                (
                                    image: string,
                                    index: number
                                ) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            setSelectedPreview(
                                                index
                                            )
                                        }
                                        className={cn(
                                            "relative flex-shrink-0 w-12 h-16 sm:w-14 sm:h-18 bg-muted rounded overflow-hidden border-2 transition-colors",
                                            selectedPreview ===
                                                index
                                                ? "border-primary"
                                                : "border-transparent hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <Image
                                            src={image}
                                            alt={`Preview thumbnail ${
                                                index + 1
                                            }`}
                                            fill
                                            sizes="56px"
                                            className={cn(
                                                "object-cover",
                                                isNsfw &&
                                                    !isNsfwRevealed &&
                                                    "blur-sm"
                                            )}
                                        />
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
