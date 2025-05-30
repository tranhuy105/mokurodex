// content page for a specific content item (content detail page)

import { ContentDetail } from "@/components/content/details/ContentDetail";
import { ContentDetailSkeleton } from "@/components/content/details/ContentDetailSkeleton";
import { decodeUrlParam } from "@/lib/path-utils";
import { getContentWithUserData } from "@/server/actions/content-management";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: {
        contentId: string;
    };
}

// Main content component
async function ContentDetailContent({
    contentId,
}: {
    contentId: string;
}) {
    try {
        const content = await getContentWithUserData({
            id: contentId,
        });

        if (!content) {
            notFound();
        }
        //@ts-expect-error: luoi deo map ok
        return <ContentDetail content={content} />;
    } catch (error) {
        console.error("Error loading content:", error);
        notFound();
    }
}

export default async function ContentPage({
    params,
}: PageProps) {
    const _params = await Promise.resolve(params);
    const contentId = decodeUrlParam(_params.contentId);

    return (
        <Suspense fallback={<ContentDetailSkeleton />}>
            <ContentDetailContent contentId={contentId} />
        </Suspense>
    );
}
