import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
    ArrowUpAZ,
    Grid2X2,
    LayoutList,
} from "lucide-react";
import { VolumeCardSkeleton } from "./VolumeCardSkeleton";

interface VolumeGridSkeletonProps {
    count?: number;
    viewMode?: "grid" | "list";
}

export function VolumeGridSkeleton({
    count = 3,
    viewMode = "list",
}: VolumeGridSkeletonProps) {
    return (
        <div className="space-y-6">
            {/* Controls skeleton */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex items-center gap-1.5"
                    >
                        <ArrowUpAZ className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            Volume
                        </span>{" "}
                        1-{count}
                    </Button>

                    <Skeleton className="h-9 w-24" />
                </div>

                <div className="inline-flex items-center rounded-md border border-input bg-transparent p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className={cn(
                            "h-8 w-8 rounded-sm",
                            viewMode === "list" &&
                                "bg-muted"
                        )}
                    >
                        <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className={cn(
                            "h-8 w-8 rounded-sm",
                            viewMode === "grid" &&
                                "bg-muted"
                        )}
                    >
                        <Grid2X2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Volume cards skeleton */}
            <div
                className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : "flex flex-col space-y-4"
                )}
            >
                {Array(count)
                    .fill(0)
                    .map((_, i) => (
                        <VolumeCardSkeleton
                            key={i}
                            viewMode={viewMode}
                        />
                    ))}
            </div>
        </div>
    );
}
