import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/card";

interface VolumeCardSkeletonProps {
    viewMode?: "grid" | "list";
}

export function VolumeCardSkeleton({
    viewMode = "list",
}: VolumeCardSkeletonProps) {
    // Grid view skeleton
    if (viewMode === "grid") {
        return (
            <Card className="overflow-hidden h-full flex flex-col">
                {/* Cover image skeleton */}
                <div className="relative aspect-[2/3] w-full">
                    <Skeleton className="absolute inset-0" />
                </div>

                {/* Content skeleton */}
                <div className="p-3 flex flex-col flex-grow">
                    {/* Title skeleton */}
                    <Skeleton className="h-5 w-4/5 mb-2" />

                    {/* Metadata skeleton */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Progress skeleton */}
                    <div className="mt-auto mb-2">
                        <div className="flex justify-between mb-1">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1 w-full" />
                    </div>

                    {/* Button skeleton */}
                    <Skeleton className="h-8 w-full mt-auto" />
                </div>
            </Card>
        );
    }

    // List view skeleton (default)
    return (
        <Card className="overflow-hidden">
            <div className="flex">
                {/* Cover image skeleton */}
                <div className="relative h-[120px] w-[80px] sm:h-[150px] sm:w-[100px] flex-shrink-0">
                    <Skeleton className="absolute inset-0" />
                </div>

                {/* Content details skeleton */}
                <div className="flex flex-col flex-grow p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow">
                            {/* Title and badges skeleton */}
                            <div className="flex items-center gap-2 mb-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-12 rounded-full" />
                            </div>

                            {/* Metadata skeleton */}
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>

                        {/* Button skeleton */}
                        <Skeleton className="h-8 w-24 flex-shrink-0" />
                    </div>

                    {/* Preview image skeleton */}
                    <Skeleton className="h-20 w-full mt-2" />
                </div>
            </div>
        </Card>
    );
}
