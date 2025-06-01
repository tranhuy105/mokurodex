import MangaReaderContainer from "@/components/reader/manga/MangaReaderContainer";
import { MangaReaderSkeleton } from "@/components/reader/manga/MangaReaderSkeleton";
import { decodeUrlParam } from "@/lib/path-utils";
import { getVolumePages } from "@/server/actions/content";
import { getContentWithVolumes } from "@/server/actions/manga-reader";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: {
        mangaId: string;
        volumeNumber: string;
        pageNumber: string;
    };
}

/**
 * Server component that fetches initial data and renders the manga reader
 */
export default async function MangaReaderPage({
    params,
}: PageProps) {
    try {
        const {
            mangaId,
            volumeNumber: volumeNumberParam,
            pageNumber: pageNumberParam,
        } = await Promise.resolve(params);
        // Parse and validate params
        const contentId = decodeUrlParam(mangaId);
        const volumeNumber = parseInt(
            volumeNumberParam,
            10
        );
        const pageNumber = parseInt(pageNumberParam, 10);

        if (
            isNaN(volumeNumber) ||
            isNaN(pageNumber) ||
            pageNumber < 1
        ) {
            return notFound();
        }

        // Fetch the content with volumes using server action
        const content = await getContentWithVolumes({
            id: contentId,
        });

        if (!content) {
            return notFound();
        }

        // Find the current volume
        const currentVolume = content.contentVolumes.find(
            (v) => v.volumeNumber === volumeNumber
        );

        if (!currentVolume) {
            return notFound();
        }

        // Fetch all pages for the current volume
        const pages = await getVolumePages({
            id: currentVolume.id,
        });

        // Render the manga reader content component with initial data
        return (
            <Suspense fallback={<MangaReaderSkeleton />}>
                <MangaReaderContainer
                    mangaId={contentId}
                    volume={currentVolume}
                    volumes={content.contentVolumes}
                    pages={pages}
                    initialPage={pageNumber}
                    initialTimestamp={0}
                />
            </Suspense>
        );
    } catch (error) {
        console.error("Error loading manga reader:", error);
        return notFound();
    }
}
