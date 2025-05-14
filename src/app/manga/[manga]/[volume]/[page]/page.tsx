import MangaReader from "@/components/reader/MangaReader";
import { MangaReaderSkeleton } from "@/components/reader/MangaReaderSkeleton";
import { notFound } from "next/navigation";
import { fetchMangaVolumes, fetchVolumePages } from "@/actions/manga-api";
import { Suspense } from "react";
import { decodeUrlParam } from "@/lib/path-utils";

interface PageProps {
  params: {
    manga: string;
    volume: string;
    page: string;
  };
}

interface DebugInfo {
  manga: string;
  volume: string;
  page: string;
  volumeIds?: Array<{
    name: string | undefined;
    uuid: string;
    pageCount: number;
  }>;
  currentVolume?: { name: string | undefined; uuid: string; pageCount: number };
  pageNum?: number;
  [key: string]: unknown;
}

// Custom error component for debugging
function ErrorDisplay({
  error,
  details,
}: {
  error: Error;
  details?: Record<string, unknown>;
}) {
  return (
    <div className="container mx-auto p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
        Error Loading Manga
      </h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
        <p className="font-mono text-red-600 dark:text-red-400">
          {error.message}
        </p>
      </div>
      {details && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Debug Details:</h2>
          <pre className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-96 text-sm">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Reader content component
async function ReaderContent({ manga, volume, page }: PageProps["params"]) {
  try {
    const debugInfo: Partial<DebugInfo> = { manga, volume, page };

    // Get manga volumes using the client-safe API
    const volumes = await fetchMangaVolumes(manga);
    debugInfo.volumeIds = volumes.map((v) => ({
      name: v.mokuroData.volume,
      uuid: v.mokuroData.volume_uuid,
      pageCount: v.metadata?.pageCount || 0,
    }));

    // Find the current volume
    const currentVolume = volumes.find(
      (v) => v.mokuroData.volume_uuid === volume
    );

    if (!currentVolume) {
      return (
        <ErrorDisplay
          error={new Error(`Volume not found: ${volume}`)}
          details={debugInfo}
        />
      );
    }

    // Store current volume info for debugging
    debugInfo.currentVolume = {
      name: currentVolume.mokuroData.volume,
      uuid: currentVolume.mokuroData.volume_uuid,
      pageCount: currentVolume.metadata?.pageCount || 0,
    };

    // Get pages for the current volume
    const pages = await fetchVolumePages(manga, currentVolume);

    // Double-check that pages were loaded successfully
    if (!pages || pages.length === 0) {
      return (
        <ErrorDisplay
          error={
            new Error(
              `Failed to load pages for volume: ${currentVolume.mokuroData.volume}`
            )
          }
          details={{
            ...debugInfo,
            pagesLoaded: pages.length,
          }}
        />
      );
    }

    // Get the page number
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > pages.length) {
      return (
        <ErrorDisplay
          error={new Error(`Invalid page number: ${page}`)}
          details={{
            ...debugInfo,
            pagesLoaded: pages.length,
            validRange: {
              min: 1,
              max: pages.length,
            },
          }}
        />
      );
    }

    debugInfo.pageNum = pageNum;

    return (
      <MangaReader
        manga={manga}
        volume={currentVolume}
        pages={pages}
        volumes={volumes}
        initialPage={pageNum}
      />
    );
  } catch (error) {
    return (
      <ErrorDisplay
        error={
          error instanceof Error
            ? error
            : new Error(`Error loading manga: ${String(error)}`)
        }
        details={{
          manga,
          volume,
          page,
          error: String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }}
      />
    );
  }
}

export default async function ReaderPage({ params }: PageProps) {
  try {
    // Await the params object before destructuring
    const paramsResolved = await params;
    const { manga: encodedManga, volume, page } = paramsResolved;

    // Ensure the manga ID is properly decoded
    const manga = decodeUrlParam(encodedManga);

    return (
      <Suspense fallback={<MangaReaderSkeleton />}>
        <ReaderContent manga={manga} volume={volume} page={page} />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading manga page:", error);
    notFound();
  }
}
