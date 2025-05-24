"use client";

import { useEffect, useState } from "react";
import { VolumeCard } from "./VolumeCard";
import { ChevronDown, SortAsc } from "lucide-react";
import { Volume } from "@/types/manga";
import { getReadingHistoryForVolumes } from "@/actions/manga-management-prisma";
import { ReadingHistory } from "@prisma/client";

interface VolumeGridProps {
  volumes: Volume[];
  mangaId: string;
  showReadingHistory?: boolean;
}

export function VolumeGrid({
  volumes,
  mangaId,
  showReadingHistory = false,
}: VolumeGridProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [readingHistoryMap, setReadingHistoryMap] = useState<
    Map<string, ReadingHistory>
  >(new Map());

  // Fetch reading history for all volumes at once
  useEffect(() => {
    async function fetchReadingHistory() {
      try {
        // Extract all volume IDs
        const volumeIds = volumes.map(
          (volume) => volume.mokuroData.volume_uuid
        );

        // Fetch reading history for all volumes in a single query
        const historyMap = await getReadingHistoryForVolumes(volumeIds);
        setReadingHistoryMap(historyMap);

        console.log(`Fetched reading history for ${historyMap.size} volumes`);
      } catch (error) {
        console.error("Error fetching reading history:", error);
      }
    }
    if (showReadingHistory) {
      fetchReadingHistory();
    }
  }, [volumes, showReadingHistory]);

  // Sort volumes based on current sort order
  const sortedVolumes = [...volumes].sort((a, b) => {
    const volA = parseInt(a.volumeName?.replace(/\D/g, "") || "0");
    const volB = parseInt(b.volumeName?.replace(/\D/g, "") || "0");
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
        {sortedVolumes.map((volume) => {
          // Get the reading history for this specific volume
          const volumeHistory =
            readingHistoryMap.get(volume.mokuroData.volume_uuid) || null;

          return (
            <VolumeCard
              key={volume.mokuroData.volume_uuid}
              volume={volume}
              mangaId={mangaId}
              readingHistory={volumeHistory}
            />
          );
        })}
      </div>
    </div>
  );
}
