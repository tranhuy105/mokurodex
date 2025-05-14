import { VolumeCardSkeleton } from "./VolumeCardSkeleton";

interface VolumeGridSkeletonProps {
  count?: number;
}

export function VolumeGridSkeleton({ count = 6 }: VolumeGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <VolumeCardSkeleton key={index} />
        ))}
    </div>
  );
}
