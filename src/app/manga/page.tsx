import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { MangaGridSkeleton } from "@/components/manga/MangaGridSkeleton";
import { Suspense } from "react";
import {
  searchMangaWithFilters,
  getAllMangaWithUserData,
} from "@/actions/manga-management-prisma";

interface MangaListPageProps {
  searchParams?: {
    tags?: string;
    collections?: string;
    status?: string;
    favorite?: string;
    query?: string;
  };
}

// Main content component
async function MangaListContent({ searchParams }: MangaListPageProps) {
  try {
    const params = await Promise.resolve(searchParams || {});
    console.log("Loaded search params:", params);

    // Parse filter parameters from URL
    const hasActiveFilters =
      !!params.tags ||
      !!params.collections ||
      !!params.status ||
      params.favorite === "true" ||
      !!params.query;

    // If no active filters, get all manga rather than using searchMangaWithFilters
    let mangaListPromise;
    if (hasActiveFilters) {
      console.log("Active filters detected, using searchMangaWithFilters");
      const filterOptions = {
        tags: params.tags ? params.tags.split(",") : undefined,
        collections: params.collections
          ? params.collections.split(",")
          : undefined,
        status: params.status ? params.status.split(",") : undefined,
        favorite: params.favorite === "true",
        query: params.query,
      };

      console.log("Filter options:", filterOptions);
      mangaListPromise = searchMangaWithFilters(filterOptions);
    } else {
      // When no filters, get all manga
      console.log("No active filters, getting all manga");
      mangaListPromise = getAllMangaWithUserData();
    }

    const mangaList = await mangaListPromise;
    console.log(`Loaded ${mangaList.length} manga from database`);

    // Create the empty state component that will be passed to MangaGrid when needed
    const emptyState = (
      <EmptyState
        icon={AlertTriangle}
        title="No manga found"
        message={
          hasActiveFilters
            ? "No manga matched your filters. Try adjusting your search criteria."
            : "No manga found in your library."
        }
        variant="warning"
      />
    );

    // Always return MangaGrid, passing emptyState as a prop
    return <MangaGrid mangaList={mangaList} emptyState={emptyState} />;
  } catch (error) {
    console.error("Error loading manga list:", error);
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load manga list"
        message={error instanceof Error ? error.message : "Unknown error"}
        variant="error"
      />
    );
  }
}

export default function MangaListPage(props: MangaListPageProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Manga Library"
        subtitle="Browse your collection"
        className="mb-8"
      />

      <Suspense fallback={<MangaGridSkeleton count={12} />}>
        <MangaListContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
