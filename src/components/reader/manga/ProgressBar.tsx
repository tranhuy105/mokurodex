import { ReadingMode } from "@/hooks/useSettings";
import { PageWithTextBlocks } from "@/types/content";
import { useMemo } from "react";

interface ProgressBarProps {
    currentPage: number;
    totalPages: number;
    pages: PageWithTextBlocks[];
    mode: ReadingMode;
    loadedPages?: Set<string>; // Actually loaded images
    prefetchedPages?: Set<string>; // Images that started loading but may not be complete
}

export default function ProgressBar({
    currentPage,
    totalPages,
    pages,
    mode,
    loadedPages = new Set(),
    prefetchedPages = new Set(),
}: ProgressBarProps) {
    const progress = (currentPage / totalPages) * 100;

    // For single/double page mode, show MangaDex-style segmented progress bar
    const segments = useMemo(() => {
        return Array.from(
            { length: totalPages },
            (_, i) => {
                const pageNumber = i + 1;
                const page = pages[i];
                const imagePath = page?.imagePath;

                // Determine segment status based on MangaDex logic
                let status:
                    | "read"
                    | "loaded"
                    | "prefetched"
                    | "pending" = "pending";

                // Pages up to current are considered read (full orange)
                if (pageNumber <= currentPage) {
                    status = "read";
                }
                // Images that are fully loaded (high opacity orange)
                else if (
                    imagePath &&
                    loadedPages.has(imagePath)
                ) {
                    status = "loaded";
                }
                // Images that started prefetching but not fully loaded yet (medium opacity orange)
                else if (
                    imagePath &&
                    prefetchedPages.has(imagePath)
                ) {
                    status = "prefetched";
                }
                // Not fetched at all (low opacity orange/gray)

                return { pageNumber, status, imagePath };
            }
        );
    }, [
        currentPage,
        totalPages,
        pages,
        loadedPages,
        prefetchedPages,
    ]);

    // For longStrip mode, use the simple progress bar (unchanged)
    if (mode === "longStrip") {
        return (
            <div
                className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none"
                style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                <div className="h-1 bg-gray-800 w-full">
                    <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    }

    // MangaDex-style segmented progress bar for single/double page modes
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none"
            style={{
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <div className="h-1 bg-gray-800 w-full flex gap-[1px]">
                {segments.map((segment) => {
                    // Define colors based on status (accurate MangaDex colors)
                    let bgColor = "";
                    switch (segment.status) {
                        case "read":
                            bgColor = "bg-orange-500"; // Full bright orange - current and read pages
                            break;
                        case "loaded":
                            bgColor = "bg-orange-500/60"; // Medium orange - fully loaded ahead
                            break;
                        case "prefetched":
                            bgColor = "bg-orange-500/30"; // Lower orange - prefetching
                            break;
                        case "pending":
                        default:
                            bgColor = "bg-gray-600/40"; // Much more bland gray - not fetched at all
                            break;
                    }

                    return (
                        <div
                            key={segment.pageNumber}
                            className={`h-full transition-all duration-200 ${bgColor}`}
                            style={{
                                width: `${
                                    100 / totalPages
                                }%`,
                                minWidth: "1px", // Ensure visibility but no overflow
                            }}
                            title={`Page ${segment.pageNumber}: ${segment.status}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}
