"use server";

import { CollectionActions } from "@/components/collections/CollectionActions";
import { ContentGrid } from "@/components/content/ContentGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
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
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface CollectionPageProps {
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
    userData?: {
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
    } | null;
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
    if (!Array.isArray(contentList)) return [];

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

async function CollectionContent({ id }: { id: string }) {
    const collectionData = (await getCollection({
        id,
    })) as RawCollection;

    if (!collectionData) {
        notFound();
    }

    // Ensure collection has the correct type
    const collection =
        ensureExtendedCollection(collectionData);

    const contentListData = (await getContentByCollection({
        id,
    })) as RawContent[];
    // Convert contentList to ContentWithUserData[] with proper type handling
    const typedContentList = ensureContentWithUserData(
        contentListData || []
    );

    return (
        <>
            {/* Collection Header */}
            <div className="relative mb-8 group">
                {/* Cover Image or Gradient Background */}
                <div className="absolute inset-0 h-64 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl overflow-hidden transition-all duration-500 ease-in-out group-hover:shadow-lg">
                    {collection.coverImage && (
                        <Image
                            src={collection.coverImage}
                            alt={collection.name}
                            fill
                            className="object-cover opacity-40 transition-transform duration-700 ease-in-out group-hover:scale-105"
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>

                {/* Collection Info */}
                <div className="relative pt-36 pb-6 px-6 z-10 text-white">
                    <div className="flex items-start justify-between">
                        <div className="transform transition-all duration-300 ease-in-out group-hover:translate-y-[-4px]">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {collection.name}
                            </h1>
                            {collection.description && (
                                <p className="mt-2 text-white/90 max-w-xl">
                                    {collection.description}
                                </p>
                            )}
                            <div className="mt-3 flex items-center text-sm text-white/70">
                                <BookOpen className="w-4 h-4 mr-1.5" />
                                <span>
                                    {collection
                                        .collectionContent
                                        ?.length || 0}{" "}
                                    items
                                </span>
                                <span className="mx-2">
                                    •
                                </span>
                                <span>
                                    Updated{" "}
                                    {formatDate(
                                        new Date(
                                            collection.updatedAt
                                        )
                                    )}
                                </span>
                            </div>
                        </div>

                        <CollectionActions
                            collection={collection}
                        />
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <div className="mb-6">
                <Link href="/collections">
                    <button className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Collections
                    </button>
                </Link>
            </div>

            {/* Collection Content */}
            <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium">
                        Content in this collection
                    </h2>
                    <Link href={`/collections/${id}/edit`}>
                        <button className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 py-1.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit Collection
                        </button>
                    </Link>
                </div>

                {!typedContentList ||
                typedContentList.length === 0 ? (
                    <EmptyState
                        icon={AlertTriangle}
                        title="No content in this collection"
                        message="This collection doesn't have any content yet. Add some manga or light novels to get started."
                        variant="warning"
                    />
                ) : (
                    <ContentGrid
                        contentList={typedContentList}
                        showFilters={false}
                    />
                )}
            </div>
        </>
    );
}

export default async function CollectionPage({
    params,
}: CollectionPageProps) {
    const { id } = params;

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <CollectionContent id={id} />
        </div>
    );
}
