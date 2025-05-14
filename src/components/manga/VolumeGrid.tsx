"use client";

import { useState } from "react";
import { Volume } from "@/types/manga";
import { VolumeCard } from "./VolumeCard";
import { ChevronDown, SortAsc } from "lucide-react";

interface VolumeGridProps {
  volumes: Volume[];
  mangaId: string;
}

export function VolumeGrid({ volumes, mangaId }: VolumeGridProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sort volumes based on current sort order
  const sortedVolumes = [...volumes].sort((a, b) => {
    const volA = parseInt(a.mokuroData.volume.replace(/\D/g, "") || "0");
    const volB = parseInt(b.mokuroData.volume.replace(/\D/g, "") || "0");
    return sortOrder === "asc" ? volA - volB : volB - volA;
  });

  return (
    <div>
      {/* Sort controls */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <SortAsc className="w-4 h-4 mr-2" />
          <span>
            Sort: {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
        </button>
      </div>

      {/* Volume cards */}
      <div className="flex flex-col space-y-5">
        {sortedVolumes.map((volume) => (
          <VolumeCard
            key={volume.mokuroData.volume_uuid}
            volume={volume}
            mangaId={mangaId}
          />
        ))}
      </div>
    </div>
  );
}
