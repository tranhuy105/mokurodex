import { notFound } from "next/navigation";
import { fetchMangaVolumes } from "@/actions/manga-api";
import { MangaDetail } from "@/components/manga/MangaDetail";
import { MangaDetailSkeleton } from "@/components/manga/MangaDetailSkeleton";
import { Suspense } from "react";
import { decodeUrlParam } from "@/lib/path-utils";

interface PageProps {
  params: Promise<{
    manga: string;
  }>;
}

// Main content component
async function MangaDetailContent({ manga }: { manga: string }) {
  try {
    const volumes = await fetchMangaVolumes(manga);

    if (volumes.length === 0) {
      notFound();
    }

    // Sort volumes by name
    volumes.sort((a, b) => {
      const aName = a.mokuroData.volume;
      const bName = b.mokuroData.volume;

      // Extract numeric part if available
      const aNum = parseInt(aName.replace(/\D/g, ""));
      const bNum = parseInt(bName.replace(/\D/g, ""));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }

      return aName.localeCompare(bName);
    });

    return (
      <MangaDetail
        manga={{
          id: manga,
          title: volumes[0].mokuroData.title,
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
  const { manga: encodedManga } = await params;

  // Ensure the manga ID is properly decoded
  const manga = decodeUrlParam(encodedManga);

  return (
    <Suspense fallback={<MangaDetailSkeleton />}>
      <MangaDetailContent manga={manga} />
    </Suspense>
  );
}
