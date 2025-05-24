import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  fetchMangaWithVolumes,
  fetchVolumePages,
} from "@/actions/manga-api-prisma";
import { decodeUrlParam } from "@/lib/path-utils";
import MangaReaderContainer from "@/components/reader/MangaReaderContainer";
import { MangaReaderSkeleton } from "@/components/reader/MangaReaderSkeleton";
import { getMangaReaderProps } from "@/lib/reader-utils";

interface PageProps {
  params: {
    mangaId: string;
    volume: string;
    page: string;
  };
}

// The main server component that loads data
async function MangaReaderContent({ params }: { params: PageProps["params"] }) {
  try {
    // Parse and validate params
    const p = await Promise.resolve(params);
    const { mangaId: encodedManga, volume: volumeId, page: pageStr } = p;
    const mangaId = decodeUrlParam(encodedManga);
    const pageNum = parseInt(pageStr, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return notFound();
    }

    // Fetch manga and volume data
    const mangaData = await fetchMangaWithVolumes(mangaId);
    if (!mangaData) {
      return notFound();
    }

    // Find the current volume
    const volumes = mangaData.mangaVolumes || [];
    const currentVolume = volumes.find((v) => v.volumeUuid === volumeId);

    if (!currentVolume) {
      return notFound();
    }

    // Fetch pages for the current volume
    const pages = await fetchVolumePages(currentVolume.volumeUuid);

    if (!pages || pages.length === 0) {
      return notFound();
    }

    // Validate page number is within range
    if (pageNum > pages.length) {
      // Redirect to the last page if the requested page is beyond the available pages
      return notFound();
    }

    // Prepare reader props
    const readerProps = getMangaReaderProps({
      mangaId,
      volume: currentVolume,
      volumes,
      pages,
      initialPage: pageNum,
    });

    // Pass data to the client component
    return <MangaReaderContainer {...readerProps} />;
  } catch (error) {
    console.error("Error loading manga reader:", error);
    return notFound();
  }
}

export default function ReaderPage({ params }: PageProps) {
  return (
    <Suspense fallback={<MangaReaderSkeleton />}>
      <MangaReaderContent params={params} />
    </Suspense>
  );
}
