import { notFound } from "next/navigation";
import { fetchMangaWithVolumes } from "@/actions/manga-api-prisma";
import { MangaDetail } from "@/components/manga/MangaDetail";
import { MangaDetailSkeleton } from "@/components/manga/MangaDetailSkeleton";
import { Suspense } from "react";
import { decodeUrlParam } from "@/lib/path-utils";
import { Volume } from "@/types/manga";

interface PageProps {
  params: {
    mangaId: string;
  };
}

// Main content component
async function MangaDetailContent({ mangaId }: { mangaId: string }) {
  try {
    console.log("mangaId", mangaId);
    const manga = await fetchMangaWithVolumes(mangaId);
    const prismaVolumes = manga?.mangaVolumes || [];

    if (!manga || !prismaVolumes) {
      notFound();
    }

    // Sort volumes by name
    prismaVolumes.sort((a, b) => {
      const aName = a.volumeTitle;
      const bName = b.volumeTitle;

      // Extract numeric part if available
      const aNum = parseInt(aName.replace(/\D/g, ""));
      const bNum = parseInt(bName.replace(/\D/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return aName.localeCompare(bName);
    });

    // Transform Prisma volumes to match the expected Volume type
    const volumes: Volume[] = prismaVolumes.map((vol) => ({
      mokuroData: {
        version: "1.0",
        volume_uuid: vol.volumeUuid,
        title_uuid: manga.id,
        title: manga.title,
        volume: vol.volumeTitle,
        pages: [],
      },
      volumeName: vol.volumeTitle,
      coverImage: vol.coverImage,
      metadata: {
        releaseDate: vol.addedDate.toISOString(),
        lastModified: vol.lastModified.toISOString(),
        publisher: "Unknown",
        pageCount: vol.pageCount,
      },
      previewImages: vol.previewImages ? JSON.parse(vol.previewImages) : [],
    }));

    return (
      <MangaDetail
        manga={{
          id: manga.id,
          title: manga.title,
          volumes: volumes,
        }}
      />
    );
  } catch (error) {
    console.error("Error loading manga:", error);
    notFound();
  }
}

export default async function MangaPage({ params }: PageProps) {
  // Access mangaId directly from params
  const mangaId = decodeUrlParam(params.mangaId);

  return (
    <Suspense fallback={<MangaDetailSkeleton />}>
      <MangaDetailContent mangaId={mangaId} />
    </Suspense>
  );
}
