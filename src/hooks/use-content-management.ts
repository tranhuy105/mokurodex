import * as contentManagementActions from "@/server/actions/content-management";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

// Import types from the content types file
import type {
    // Collection,
    // Content,
    ContentStatus,
    ContentType,
    ContentWithUserData,
    Tag,
    TagType,
    UserContentMetadata,
} from "@/types/content";

// Query Keys
export const managementKeys = {
    all: ["content-management"] as const,
    tags: () => [...managementKeys.all, "tags"] as const,
    tag: (id: string) =>
        [...managementKeys.tags(), id] as const,
    collections: () =>
        [...managementKeys.all, "collections"] as const,
    collection: (id: string) =>
        [...managementKeys.collections(), id] as const,
    metadata: () =>
        [...managementKeys.all, "metadata"] as const,
    contentMetadata: (id: string) =>
        [...managementKeys.metadata(), id] as const,
    history: () =>
        [...managementKeys.all, "history"] as const,
    contentHistory: (id: string) =>
        [...managementKeys.history(), id] as const,
};

// // Helper functions for type safety
// const ensureContentType = (data: unknown): Content => {
//     if (!data) return data as Content;
//     const item = data as Record<string, unknown>;
//     return {
//         ...item,
//         contentType: item.contentType as ContentType,
//     } as Content;
// };

const ensureContentWithUserData = (
    data: unknown
): ContentWithUserData => {
    if (!data) return data as ContentWithUserData;

    const item = data as Record<string, unknown>;
    const userData = item.userData as Record<
        string,
        unknown
    > | null;

    // Ensure userData.status is properly typed if it exists
    if (
        userData?.status &&
        typeof userData.status === "string"
    ) {
        const status = userData.status;
        // Validate that status is one of the expected values
        const validStatuses: ContentStatus[] = [
            "reading",
            "completed",
            "on-hold",
            "dropped",
            "plan-to-read",
        ];

        if (
            validStatuses.includes(status as ContentStatus)
        ) {
            userData.status = status as ContentStatus;
        } else {
            userData.status = null;
        }
    }

    return {
        ...item,
        contentType: item.contentType as ContentType,
        userData: userData as UserContentMetadata | null,
    } as ContentWithUserData;
};

const ensureContentWithUserDataArray = (
    data: unknown[]
): ContentWithUserData[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) =>
        ensureContentWithUserData(item)
    );
};

const ensureTagArray = (data: unknown[]): Tag[] => {
    if (!Array.isArray(data)) return [];
    return data as Tag[];
};

// const ensureCollectionArray = (
//     data: unknown[]
// ): Collection[] => {
//     if (!Array.isArray(data)) return [];
//     return data as Collection[];
// };

// Define a type for search filters to avoid 'any'
type SearchFilters = {
    query?: string;
    tags?: string[];
    collections?: string[];
    status?: string[];
    favorite?: boolean;
    isNsfw?: boolean;
    contentType?: string[];
};

// ========== Tag Hooks ==========

/**
 * Hook to fetch all tags
 */
export function useTags() {
    return useQuery({
        queryKey: managementKeys.tags(),
        queryFn: contentManagementActions.getTags,
        select: (data) => ensureTagArray(data),
    });
}

/**
 * Hook to fetch a single tag with its content
 */
export function useTag(id: string) {
    return useQuery({
        queryKey: managementKeys.tag(id),
        queryFn: () =>
            contentManagementActions.getTag({ id }),
        enabled: !!id,
    });
}

/**
 * Hook to create a new tag
 */
export function useCreateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tag: {
            name: string;
            color?: string;
            type: TagType;
        }) => contentManagementActions.createTag(tag),
        onSuccess: (data) => {
            if (data) {
                toast.success(`Tag "${data.name}" created`);

                // More targeted invalidation
                queryClient.invalidateQueries({
                    queryKey: managementKeys.tags(),
                });
            } else {
                toast.error("Failed to create tag");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error creating tag: ${error.message}`
            );
        },
    });
}

/**
 * Hook to update a tag
 */
export function useUpdateTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: {
                name?: string;
                color?: string;
                type?: TagType;
            };
        }) => contentManagementActions.updateTag(id, data),
        onSuccess: (data) => {
            if (data) {
                toast.success(`Tag "${data.name}" updated`);

                // More targeted invalidation
                queryClient.invalidateQueries({
                    queryKey: managementKeys.tags(),
                    exact: false,
                });
                queryClient.invalidateQueries({
                    queryKey: managementKeys.tag(data.id),
                });
            } else {
                toast.error("Failed to update tag");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error updating tag: ${error.message}`
            );
        },
    });
}

/**
 * Hook to delete a tag
 */
export function useDeleteTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            contentManagementActions.deleteTag({ id }),
        onSuccess: (success, id) => {
            if (success) {
                toast.success("Tag deleted");

                // More targeted invalidation
                queryClient.invalidateQueries({
                    queryKey: managementKeys.tags(),
                });
                queryClient.removeQueries({
                    queryKey: managementKeys.tag(id),
                });

                // Also invalidate content by tag queries
                queryClient.invalidateQueries({
                    queryKey: ["content", "byTag", id],
                });

                // Don't invalidate all content queries - only those related to tags
                queryClient.invalidateQueries({
                    queryKey: ["content", "search"],
                    predicate: (query) => {
                        // Only invalidate search queries that might include tag filters
                        const filters = query
                            .queryKey[2] as
                            | SearchFilters
                            | undefined;
                        return Boolean(
                            filters?.tags?.includes(id)
                        );
                    },
                });
            } else {
                toast.error("Failed to delete tag");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error deleting tag: ${error.message}`
            );
        },
    });
}

// ========== Collection Hooks ==========

/**
 * Hook to fetch all collections
 */
export function useCollections() {
    return useQuery({
        queryKey: managementKeys.collections(),
        queryFn: contentManagementActions.getCollections,
    });
}

/**
 * Hook to fetch a single collection with its content
 */
export function useCollection(id: string) {
    return useQuery({
        queryKey: managementKeys.collection(id),
        queryFn: () =>
            contentManagementActions.getCollection({ id }),
        enabled: !!id,
    });
}

/**
 * Hook to create a new collection
 */
export function useCreateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (collection: {
            name: string;
            description?: string;
            coverImage?: string;
            contentIds?: string[];
        }) =>
            contentManagementActions.createCollection(
                collection
            ),
        onSuccess: (data) => {
            if (data) {
                toast.success(
                    `Collection "${data.name}" created`
                );
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collections(),
                });
            } else {
                toast.error("Failed to create collection");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error creating collection: ${error.message}`
            );
        },
    });
}

/**
 * Hook to update a collection
 */
export function useUpdateCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: {
                name?: string;
                description?: string;
                coverImage?: string;
                contentIds?: string[];
            };
        }) =>
            contentManagementActions.updateCollection(
                id,
                data
            ),
        onSuccess: (data) => {
            if (data) {
                toast.success(
                    `Collection "${data.name}" updated`
                );
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collections(),
                });
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collection(
                        data.id
                    ),
                });
            } else {
                toast.error("Failed to update collection");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error updating collection: ${error.message}`
            );
        },
    });
}

/**
 * Hook to delete a collection
 */
export function useDeleteCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            contentManagementActions.deleteCollection({
                id,
            }),
        onSuccess: (success, id) => {
            if (success) {
                toast.success("Collection deleted");
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collections(),
                });
                queryClient.removeQueries({
                    queryKey: managementKeys.collection(id),
                });
            } else {
                toast.error("Failed to delete collection");
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error deleting collection: ${error.message}`
            );
        },
    });
}

/**
 * Hook to add content to a collection
 */
export function useAddContentToCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            contentId,
            collectionId,
        }: {
            contentId: string;
            collectionId: string;
        }) =>
            contentManagementActions.addContentToCollection(
                { contentId, collectionId }
            ),
        onSuccess: (success, { collectionId }) => {
            if (success) {
                toast.success(
                    "Content added to collection"
                );
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collections(),
                });
                queryClient.invalidateQueries({
                    queryKey:
                        managementKeys.collection(
                            collectionId
                        ),
                });
            } else {
                toast.error(
                    "Failed to add content to collection"
                );
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error adding content to collection: ${error.message}`
            );
        },
    });
}

/**
 * Hook to remove content from a collection
 */
export function useRemoveContentFromCollection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            contentId,
            collectionId,
        }: {
            contentId: string;
            collectionId: string;
        }) =>
            contentManagementActions.removeContentFromCollection(
                { contentId, collectionId }
            ),
        onSuccess: (success, { collectionId }) => {
            if (success) {
                toast.success(
                    "Content removed from collection"
                );
                queryClient.invalidateQueries({
                    queryKey: managementKeys.collections(),
                });
                queryClient.invalidateQueries({
                    queryKey:
                        managementKeys.collection(
                            collectionId
                        ),
                });
            } else {
                toast.error(
                    "Failed to remove content from collection"
                );
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error removing content from collection: ${error.message}`
            );
        },
    });
}

// ========== User Content Metadata Hooks ==========

/**
 * Hook to fetch user metadata for a specific content
 */
export function useUserContentMetadata(contentId: string) {
    return useQuery({
        queryKey: managementKeys.contentMetadata(contentId),
        queryFn: () =>
            contentManagementActions.getUserContentMetadata(
                { id: contentId }
            ),
        enabled: !!contentId,
    });
}

/**
 * Hook to fetch all user content metadata
 */
export function useAllUserContentMetadata() {
    return useQuery({
        queryKey: managementKeys.metadata(),
        queryFn:
            contentManagementActions.getAllUserContentMetadata,
    });
}

/**
 * Hook to update user metadata for content
 */
export function useUpdateUserContentMetadata() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            contentId,
            data,
        }: {
            contentId: string;
            data: {
                rating?: number | null;
                progress?: number | null;
                status?: ContentStatus | null;
                notes?: string | null;
                favorite?: boolean;
                isNsfw?: boolean;
                customCover?: string | null;
                author?: string | null;
                artist?: string | null;
                releaseYear?: number | null;
                publisher?: string | null;
                tagIds?: string[];
                collectionIds?: string[];
            };
        }) =>
            contentManagementActions.updateUserContentMetadata(
                contentId,
                { contentId, ...data }
            ),
        onSuccess: (
            data,
            { contentId, data: updatedData }
        ) => {
            if (data) {
                toast.success("Content metadata updated");

                // Precise invalidation for the specific content
                queryClient.invalidateQueries({
                    queryKey:
                        managementKeys.contentMetadata(
                            contentId
                        ),
                });

                queryClient.invalidateQueries({
                    queryKey: [
                        "content",
                        "withUserData",
                        contentId,
                    ],
                });

                // Only invalidate tag-related queries if tags were updated
                if (updatedData.tagIds !== undefined) {
                    queryClient.invalidateQueries({
                        queryKey: managementKeys.tags(),
                        exact: false,
                    });

                    // Invalidate content by tag queries for affected tags
                    if (
                        updatedData.tagIds &&
                        updatedData.tagIds.length > 0
                    ) {
                        updatedData.tagIds.forEach(
                            (tagId) => {
                                queryClient.invalidateQueries(
                                    {
                                        queryKey: [
                                            "content",
                                            "byTag",
                                            tagId,
                                        ],
                                    }
                                );
                            }
                        );
                    }
                }

                // Only invalidate collection-related queries if collections were updated
                if (
                    updatedData.collectionIds !== undefined
                ) {
                    // Invalidate collection queries
                    queryClient.invalidateQueries({
                        queryKey:
                            managementKeys.collections(),
                        exact: false,
                    });

                    // Invalidate specific collection queries
                    if (
                        updatedData.collectionIds &&
                        updatedData.collectionIds.length > 0
                    ) {
                        updatedData.collectionIds.forEach(
                            (collectionId) => {
                                queryClient.invalidateQueries(
                                    {
                                        queryKey:
                                            managementKeys.collection(
                                                collectionId
                                            ),
                                    }
                                );
                                queryClient.invalidateQueries(
                                    {
                                        queryKey: [
                                            "content",
                                            "byCollection",
                                            collectionId,
                                        ],
                                    }
                                );
                            }
                        );
                    }
                }

                // Only invalidate status-related search queries if status was updated
                if (updatedData.status !== undefined) {
                    queryClient.invalidateQueries({
                        queryKey: ["content", "search"],
                        predicate: (query) => {
                            const filters = query
                                .queryKey[2] as
                                | SearchFilters
                                | undefined;
                            return Boolean(
                                filters?.status?.includes(
                                    updatedData.status as string
                                )
                            );
                        },
                    });
                }

                // Only invalidate favorite-related search queries if favorite was updated
                if (updatedData.favorite !== undefined) {
                    queryClient.invalidateQueries({
                        queryKey: ["content", "search"],
                        predicate: (query) => {
                            const filters = query
                                .queryKey[2] as
                                | SearchFilters
                                | undefined;
                            return (
                                filters?.favorite ===
                                updatedData.favorite
                            );
                        },
                    });
                }
            } else {
                toast.error(
                    "Failed to update content metadata"
                );
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error updating content metadata: ${error.message}`
            );
        },
    });
}

/**
 * Hook to update a single metadata field efficiently without triggering excessive rerenders
 */
export function useUpdateUserContentMetadataField() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            contentId,
            field,
            value,
        }: {
            contentId: string;
            field: string;
            value: number | string | boolean | null;
        }) =>
            contentManagementActions.updateUserContentMetadataField(
                contentId,
                field,
                value
            ),
        onSuccess: (data, { contentId, field, value }) => {
            if (data) {
                // Only show toast for significant changes
                if (field === "favorite") {
                    const action = data.favorite
                        ? "added to"
                        : "removed from";
                    toast.success(
                        `Content ${action} favorites`
                    );

                    // Only refresh content library for favorite changes
                    contentManagementActions.refreshContentLibrary();

                    // Invalidate search queries that filter by favorite
                    queryClient.invalidateQueries({
                        queryKey: ["content", "search"],
                        predicate: (query) => {
                            const filters = query
                                .queryKey[2] as
                                | SearchFilters
                                | undefined;
                            return (
                                filters?.favorite !==
                                undefined
                            );
                        },
                    });
                }

                if (field === "status") {
                    // Invalidate search queries that filter by this status
                    queryClient.invalidateQueries({
                        queryKey: ["content", "search"],
                        predicate: (query) => {
                            const filters = query
                                .queryKey[2] as
                                | SearchFilters
                                | undefined;
                            return Boolean(
                                filters?.status?.includes(
                                    value as string
                                )
                            );
                        },
                    });
                }

                // Minimal invalidation - only invalidate the specific content
                queryClient.invalidateQueries({
                    queryKey: [
                        "content",
                        "withUserData",
                        contentId,
                    ],
                });

                // Also invalidate the metadata query
                queryClient.invalidateQueries({
                    queryKey:
                        managementKeys.contentMetadata(
                            contentId
                        ),
                });
            }
        },
        onError: (error: Error) => {
            toast.error(
                `Error updating content: ${error.message}`
            );
        },
    });
}

// ========== Reading History Hooks ==========

/**
 * Hook to fetch reading history for a specific content
 */
export function useReadingHistory(contentId: string) {
    return useQuery({
        queryKey: managementKeys.contentHistory(contentId),
        queryFn: () =>
            contentManagementActions.getReadingHistory({
                id: contentId,
            }),
        enabled: !!contentId,
    });
}

/**
 * Hook to update reading history
 */
export function useUpdateReadingHistory() {
    // No automatic invalidation to avoid re-renders during reading
    return useMutation({
        mutationFn: (data: {
            contentId: string;
            volumeId: string;
            position: number;
            chapterHref?: string;
        }) =>
            contentManagementActions.updateReadingHistory(
                data
            ),
        // No automatic invalidation to avoid re-renders during reading
    });
}

/**
 * Hook to refresh the continue reading section
 */
export function useRefreshContinueReading() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:
            contentManagementActions.refreshContinueReading,
        onSuccess: () => {
            // More targeted invalidation - only invalidate reading history
            queryClient.invalidateQueries({
                queryKey: managementKeys.history(),
            });
        },
    });
}

// ========== Search Hooks ==========

/**
 * Hook to search content with filters
 */
export function useSearchContent(filters: {
    query?: string;
    tags?: string[];
    collections?: string[];
    status?: string[];
    favorite?: boolean;
    isNsfw?: boolean;
    contentType?: string[];
}) {
    return useQuery({
        queryKey: ["content", "search", filters],
        queryFn: () =>
            contentManagementActions.searchContent(filters),
    });
}

/**
 * Hook to get content by tag
 */
export function useContentByTag(tagId: string) {
    return useQuery({
        queryKey: ["content", "byTag", tagId],
        queryFn: () =>
            contentManagementActions.getContentByTag({
                id: tagId,
            }),
        enabled: !!tagId,
    });
}

/**
 * Hook to get content by collection
 */
export function useContentByCollection(
    collectionId: string
) {
    return useQuery({
        queryKey: ["content", "byCollection", collectionId],
        queryFn: () =>
            contentManagementActions.getContentByCollection(
                { id: collectionId }
            ),
        enabled: !!collectionId,
    });
}

/**
 * Hook to get content with user data
 */
export function useContentWithUserData(contentId: string) {
    return useQuery({
        queryKey: ["content", "withUserData", contentId],
        queryFn: () =>
            contentManagementActions.getContentWithUserData(
                { id: contentId }
            ),
        enabled: !!contentId,
        select: (data) =>
            data ? ensureContentWithUserData(data) : null,
    });
}

/**
 * Hook to get all content with user data
 */
export function useAllContentWithUserData() {
    return useQuery({
        queryKey: ["content", "allWithUserData"],
        queryFn:
            contentManagementActions.getAllContentWithUserData,
        select: (data) =>
            ensureContentWithUserDataArray(data),
    });
}
