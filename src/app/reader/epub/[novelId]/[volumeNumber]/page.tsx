import EpubReaderContainer from "@/components/reader/epub/EpubReaderContainer";
import { LoadingOverlay } from "@/components/reader/epub/LoadingOverlay";
import { decodeUrlParam } from "@/lib/path-utils";
import { getContentWithVolumes } from "@/server/actions/manga-reader";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: {
        novelId: string;
        volumeNumber: string;
    };
}

/**
 * Server component that fetches initial data and renders the EPUB reader
 */
export default async function EpubReaderPage({
    params,
}: PageProps) {
    try {
        const { novelId, volumeNumber: volumeNumberParam } =
            await Promise.resolve(params);

        // Parse and validate params
        const contentId = decodeUrlParam(novelId);
        const volumeNumber = parseInt(
            volumeNumberParam,
            10
        );

        if (isNaN(volumeNumber) || volumeNumber < 1) {
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

        // Render the EPUB reader component with initial data
        return (
            <Suspense
                fallback={
                    <LoadingOverlay
                        isLoading={true}
                        title={"Getting the novel ready..."}
                        description={
                            "This may take a few seconds"
                        }
                    />
                }
            >
                <EpubReaderContainer
                    contentId={contentId}
                    volume={currentVolume}
                    volumes={content.contentVolumes}
                />
            </Suspense>
        );
    } catch (error) {
        console.error("Error loading EPUB reader:", error);
        return notFound();
    }
}
