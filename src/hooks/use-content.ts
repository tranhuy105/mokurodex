import * as contentActions from "@/server/actions/content";
import { Content, ContentType } from "@/types/content";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

// Define types for filter parameters
type ContentFilters = {
    query?: string;
    tags?: string[];
    collections?: string[];
    status?: string[];
    favorite?: boolean;
    isNsfw?: boolean;
    contentType?: string[];
};

// Query Keys
export const contentKeys = {
    all: ["content"] as const,
    lists: () => [...contentKeys.all, "list"] as const,
    list: (filters: ContentFilters) =>
        [...contentKeys.lists(), { ...filters }] as const,
    details: () => [...contentKeys.all, "detail"] as const,
    detail: (id: string) =>
        [...contentKeys.details(), id] as const,
};

// Helper function to ensure proper Content type
const ensureContentType = (data: unknown): Content => {
    if (!data) return data as Content;
    const item = data as Record<string, unknown>;
    return {
        ...item,
        contentType: item.contentType as ContentType,
    } as Content;
};

// Helper function to ensure array of Content
const ensureContentArray = (data: unknown[]): Content[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ensureContentType(item));
};

// Hooks for content operations

/**
 * Hook to fetch all content
 */
export function useAllContent() {
    return useQuery({
        queryKey: contentKeys.lists(),
        queryFn: contentActions.getAllContent,
        select: (data) => ensureContentArray(data),
    });
}

/**
 * Hook to fetch a single content with volumes
 */
export function useContentWithVolumes(id: string) {
    return useQuery({
        queryKey: contentKeys.detail(id),
        queryFn: () =>
            contentActions.getContentWithVolumes({ id }),
        enabled: !!id,
        select: (data) =>
            data ? ensureContentType(data) : null,
    });
}

/**
 * Hook to fetch pages for a volume
 */
export function useVolumePages(volumeId: string) {
    return useQuery({
        queryKey: ["volume", volumeId, "pages"],
        queryFn: () =>
            contentActions.getVolumePages({ id: volumeId }),
        enabled: !!volumeId,
    });
}

/**
 * Hook to import content from a directory
 */
export function useImportContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: contentActions.importContent,
        onSuccess: (data) => {
            if (data) {
                toast.success(
                    `Successfully imported ${data.title}`
                );
                queryClient.invalidateQueries({
                    queryKey: contentKeys.lists(),
                });
            } else {
                toast.error("Failed to import content");
            }
        },
        onError: (error) => {
            toast.error(
                `Error importing content: ${error.message}`
            );
        },
    });
}

/**
 * Hook to delete content
 */
export function useDeleteContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            contentActions.deleteContent({ id }),
        onSuccess: (success, id) => {
            if (success) {
                toast.success(
                    "Content deleted successfully"
                );
                queryClient.invalidateQueries({
                    queryKey: contentKeys.lists(),
                });
                queryClient.removeQueries({
                    queryKey: contentKeys.detail(id),
                });
            } else {
                toast.error("Failed to delete content");
            }
        },
        onError: (error) => {
            toast.error(
                `Error deleting content: ${error.message}`
            );
        },
    });
}

/**
 * Hook to scan content directories
 */
export function useScanContentDirectory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn:
            contentActions.scanContentDirectoryWithProgress,
        onSuccess: (data) => {
            if (data.success) {
                toast.success(
                    `Successfully imported ${data.importedCount} items`
                );
                if (data.failedCount > 0) {
                    toast.warning(
                        `Failed to import ${data.failedCount} items`
                    );
                }
                queryClient.invalidateQueries({
                    queryKey: contentKeys.lists(),
                });
            } else {
                toast.error(`Scan failed: ${data.error}`);
            }
        },
        onError: (error) => {
            toast.error(
                `Error scanning directory: ${error.message}`
            );
        },
    });
}

/**
 * Hook to get EPUB file URL
 */
export function useEpubFileUrl(
    contentId: string,
    volumeNumber: number = 1
) {
    return useQuery({
        queryKey: ["epub", contentId, volumeNumber],
        queryFn: () =>
            contentActions.getEpubFileUrl({
                contentId,
                volumeNumber,
            }),
        enabled: !!contentId,
    });
}

/**
 * Hook to clear and rescan all content
 */
export function useClearAndRescan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: contentActions.clearAndRescanAllContent,
        onSuccess: () => {
            toast.success("All content data cleared");
            queryClient.invalidateQueries({
                queryKey: contentKeys.all,
            });
        },
        onError: (error) => {
            toast.error(
                `Error clearing content data: ${error.message}`
            );
        },
    });
}
