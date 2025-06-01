import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ImportProvider } from "@/context/ImportContext";
import {
    useAllContent,
    useDeleteContent,
} from "@/hooks/use-content";
import { useImportWorkflow } from "@/hooks/useImportWorkflow";
import { Pause, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ContentList } from "../content/ContentList";
import { DirectoryScanner } from "./DirectoryScanner";
import { ImportWorkflow } from "./ImportWorkflow";
import { NewImportInstructions } from "./NewImportInstructions";

export function ImportController() {
    const {
        importState,
        isProcessing,
        processQueue,
        cancelImport,
        resetImport,
    } = useImportWorkflow();

    // Get content for display
    const {
        data: allContent = [],
        isLoading: contentLoading,
        refetch: refetchContent,
    } = useAllContent();
    const { mutate: removeContent } = useDeleteContent();

    // Handle content deletion
    const handleDelete = async (id: string) => {
        removeContent(id, {
            onSuccess: () => {
                toast.success("Content Removed");
                refetchContent();
            },
            onError: () => {
                toast.error("Removal Failed");
            },
        });
    };

    // Filter content by type
    const mangaContent = allContent.filter(
        (content) => content.contentType === "manga"
    );

    const lightNovelContent = allContent.filter(
        (content) => content.contentType === "lightnovel"
    );

    return (
        <div className="space-y-6">
            <NewImportInstructions />

            <Card>
                <CardHeader>
                    <CardTitle>Scan Directory</CardTitle>
                    <CardDescription>
                        Scan a parent directory containing
                        manga and light novel subdirectories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DirectoryScanner />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Import Queue</CardTitle>
                        <CardDescription>
                            {importState.items.length > 0
                                ? `${importState.items.length} items in queue`
                                : "No items in queue"}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {importState.items.length > 0 && (
                            <>
                                {isProcessing ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={
                                            cancelImport
                                        }
                                        disabled={
                                            importState
                                                .items
                                                .length ===
                                            0
                                        }
                                        className="flex items-center gap-1"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={
                                                resetImport
                                            }
                                            disabled={
                                                importState
                                                    .items
                                                    .length ===
                                                0
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Clear
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={
                                                processQueue
                                            }
                                            disabled={
                                                importState
                                                    .items
                                                    .length ===
                                                    0 ||
                                                isProcessing
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <Play className="h-4 w-4" />
                                            Start Import
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Overall progress */}
                    {isProcessing && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">
                                    Overall Progress
                                </span>
                                <span className="text-sm">
                                    {
                                        importState.overallProgress
                                    }
                                    %
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div
                                    className="bg-primary h-2.5 rounded-full"
                                    style={{
                                        width: `${importState.overallProgress}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Workflow visualization */}
                    <ImportWorkflow />
                </CardContent>
            </Card>

            {/* Content Lists */}
            <div className="grid grid-cols-1 gap-6">
                <Tabs defaultValue="manga">
                    <TabsList className="mb-4">
                        <TabsTrigger value="manga">
                            Manga ({mangaContent.length})
                        </TabsTrigger>
                        <TabsTrigger value="ln">
                            Light Novels (
                            {lightNovelContent.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manga">
                        <ContentList
                            contentType="manga"
                            contentList={mangaContent}
                            onDelete={handleDelete}
                            isLoading={
                                contentLoading ||
                                isProcessing
                            }
                        />
                    </TabsContent>

                    <TabsContent value="ln">
                        <ContentList
                            contentType="ln"
                            contentList={lightNovelContent}
                            onDelete={handleDelete}
                            isLoading={
                                contentLoading ||
                                isProcessing
                            }
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Wrapped version with provider
export function ImportControllerWithProvider() {
    return (
        <ImportProvider>
            <ImportController />
        </ImportProvider>
    );
}
