import { EditCollectionForm } from "@/components/collections/EditCollectionForm";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    getCollection,
    getContentByCollection,
} from "@/server/actions/content-management";
import {
    ContentStatus,
    ContentType,
    ContentWithUserData,
    ExtendedCollection,
} from "@/types/content";
import { notFound } from "next/navigation";

interface EditCollectionPageProps {
    params: {
        id: string;
    };
}

// Define types for the raw data from the server
interface RawCollectionContent {
    contentId: string;
    content: {
        id: string;
        title: string;
        volumes: number;
        coverImage: string | null;
        addedDate: Date;
        lastModified: Date;
        directoryPath: string;
        lastScanned: Date;
        scanStatus: string;
        errorMessage: string | null;
        contentType: string;
    };
}

interface RawCollection {
    id: string;
    name: string;
    description: string | null;
    coverImage: string | null;
    createdAt: Date;
    updatedAt: Date;
    collectionContent?: RawCollectionContent[];
}

interface RawContentUserData {
    id: string;
    contentId: string;
    rating: number | null;
    progress: number | null;
    status: string | null;
    notes: string | null;
    favorite: boolean;
    isNsfw: boolean;
    customCover: string | null;
    author: string | null;
    artist: string | null;
    releaseYear: number | null;
    publisher: string | null;
    updatedAt: Date;
}

interface RawContent {
    id: string;
    title: string;
    volumes: number;
    coverImage: string | null;
    addedDate: Date;
    lastModified: Date;
    directoryPath: string;
    lastScanned: Date;
    scanStatus: string;
    errorMessage: string | null;
    contentType: string;
    userData?: RawContentUserData | null;
}

// Helper function to ensure ContentType is properly typed
function ensureContentType(
    contentType: string
): ContentType {
    return contentType as ContentType;
}

// Helper function to ensure ContentStatus is properly typed
function ensureContentStatus(
    status: string | null
): ContentStatus | null {
    if (!status) return null;
    return status as ContentStatus;
}

// Helper function to ensure ExtendedCollection type
function ensureExtendedCollection(
    collection: RawCollection
): ExtendedCollection {
    return {
        ...collection,
        contentIds:
            collection.collectionContent?.map(
                (item) => item.contentId
            ) || [],
        collectionContent:
            collection.collectionContent?.map((item) => ({
                contentId: item.contentId,
                content: {
                    ...item.content,
                    contentType: ensureContentType(
                        item.content.contentType
                    ),
                },
            })),
    };
}

// Helper function to ensure ContentWithUserData array
function ensureContentWithUserData(
    contentList: RawContent[]
): ContentWithUserData[] {
    return contentList.map((content) => ({
        ...content,
        contentType: ensureContentType(content.contentType),
        userData: content.userData
            ? {
                  ...content.userData,
                  status: ensureContentStatus(
                      content.userData.status
                  ),
              }
            : null,
    }));
}

export default async function EditCollectionPage({
    params,
}: EditCollectionPageProps) {
    const { id } = await Promise.resolve(params);
    const collectionData = (await getCollection({
        id,
    })) as RawCollection;

    if (!collectionData) {
        notFound();
    }

    // Ensure collection has the correct type
    const collection =
        ensureExtendedCollection(collectionData);

    // Get content for this collection and ensure correct types
    const contentListData = await getContentByCollection({
        id,
    });
    const contentList = ensureContentWithUserData(
        contentListData || []
    );

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
            <PageHeader
                title="Edit Collection"
                subtitle="Modify your collection details and manage content"
                className="mb-8"
            />

            <EditCollectionForm
                collection={collection}
                initialContent={contentList}
            />
        </div>
    );
}
