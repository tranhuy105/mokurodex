"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    useAllContent,
    useDeleteContent,
    useScanContentDirectory,
} from "@/hooks/use-content";
import { useSettings } from "@/hooks/useSettings";
import { Book, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ContentList } from "../content/ContentList";
import { DirectoryConfigDialog } from "./DirectoryConfigDialog";
import { ImportInstructions } from "./ImportInstructions";
import { ProgressIndicator } from "./ProgressIndicator";

export function MangaScanController() {
    // Tab state
    const [activeTab, setActiveTab] = useState<
        "manga" | "ln"
    >("manga");

    // Progress tracking state
    const [importProgress, setImportProgress] = useState({
        current: 0,
        total: 0,
        currentItem: "",
    });
    const [progressPercentage, setProgressPercentage] =
        useState(0);
    const [showProgressBar, setShowProgressBar] =
        useState(false);

    // Hooks
    const { isLoading: settingsLoading, mangaDir } =
        useSettings();
    const { mutate: removeContent } = useDeleteContent();
    const {
        data: allContent = [],
        isLoading: contentLoading,
        refetch: refetchContent,
    } = useAllContent();

    const { mutate: scanDirectory, isPending: isScanning } =
        useScanContentDirectory();

    // Update progress percentage whenever importProgress changes
    useEffect(() => {
        if (
            importProgress.total > 0 &&
            importProgress.current > 0
        ) {
            const percentage = Math.round(
                (importProgress.current /
                    importProgress.total) *
                    100
            );
            setProgressPercentage(percentage);
        } else {
            setProgressPercentage(0);
        }
    }, [importProgress]);

    // Handle content deletion
    const handleDelete = async (id: string) => {
        removeContent(id, {
            onSuccess: () => {
                toast.success("Content Removed");
                // Refresh content list after deletion
                refetchContent();
            },
            onError: () => {
                toast.error("Removal Failed");
            },
        });
    };

    // Function to scan a directory using the server action
    const handleScanDirectory = (type: "manga" | "ln") => {
        if (!mangaDir) {
            toast.error(
                "Data directory not configured. Please set it in Settings first."
            );
            return;
        }

        setShowProgressBar(true);
        setActiveTab(type);

        // Set initial progress
        setImportProgress({
            current: 0,
            total: 1,
            currentItem: `Preparing to scan ${type} directory...`,
        });

        scanDirectory(
            {
                baseDir: mangaDir,
                contentType: type,
            },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        toast.success(
                            `Successfully imported ${
                                result.importedCount
                            } ${
                                type === "manga"
                                    ? "manga"
                                    : "light novels"
                            }`
                        );

                        // If there were failures, show a warning
                        if (result.failedCount > 0) {
                            toast.warning(
                                `Failed to import ${result.failedCount} items`
                            );
                        }

                        // Refresh content after scan
                        refetchContent();
                    } else {
                        toast.error(
                            result.error ||
                                `No content could be imported from ${
                                    type === "manga"
                                        ? "manga"
                                        : "light novel"
                                } directory`
                        );
                    }
                },
                onError: (error) => {
                    toast.error(
                        `Scan failed: ${error.message}`
                    );
                },
                onSettled: () => {
                    setShowProgressBar(false);
                    setImportProgress({
                        current: 0,
                        total: 0,
                        currentItem: "",
                    });
                },
            }
        );
    };

    // Filter content by type based on activeTab
    const mangaContent = allContent.filter(
        (content) => content.contentType === "manga"
    );

    const lightNovelContent = allContent.filter(
        (content) => content.contentType === "lightnovel"
    );

    if (settingsLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">
                    Loading settings...
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ImportInstructions />

            <Card>
                <CardHeader>
                    <CardTitle>Content Scanner</CardTitle>
                    <CardDescription>
                        Scan your data directory for manga
                        and light novels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium">
                                    Data Directory
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {mangaDir ||
                                        "Not configured"}
                                </p>
                            </div>
                            <DirectoryConfigDialog
                                mangaDir={mangaDir || ""}
                            />
                        </div>

                        <ProgressIndicator
                            isScanning={isScanning}
                            showProgressBar={
                                showProgressBar
                            }
                            progressPercentage={
                                progressPercentage
                            }
                            currentItem={
                                importProgress.currentItem
                            }
                            current={importProgress.current}
                            total={importProgress.total}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs
                defaultValue="manga"
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as "manga" | "ln")
                }
            >
                <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger
                        value="manga"
                        className="flex items-center"
                    >
                        <Book className="h-4 w-4 mr-2" />
                        Manga{" "}
                        {mangaContent.length > 0 &&
                            `(${mangaContent.length})`}
                    </TabsTrigger>
                    <TabsTrigger
                        value="ln"
                        className="flex items-center"
                    >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Light Novels{" "}
                        {lightNovelContent.length > 0 &&
                            `(${lightNovelContent.length})`}
                    </TabsTrigger>
                </TabsList>

                {/* Manga Tab Content */}
                <TabsContent
                    value="manga"
                    className="space-y-4"
                >
                    <div className="flex justify-end">
                        <button
                            onClick={() =>
                                handleScanDirectory("manga")
                            }
                            disabled={
                                isScanning || !mangaDir
                            }
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                            Scan Manga Directory
                        </button>
                    </div>

                    <ContentList
                        contentType="manga"
                        contentList={mangaContent}
                        onDelete={handleDelete}
                        isLoading={
                            contentLoading || isScanning
                        }
                    />
                </TabsContent>

                {/* Light Novel Tab Content */}
                <TabsContent
                    value="ln"
                    className="space-y-4"
                >
                    <div className="flex justify-end">
                        <button
                            onClick={() =>
                                handleScanDirectory("ln")
                            }
                            disabled={
                                isScanning || !mangaDir
                            }
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                            Scan Light Novel Directory
                        </button>
                    </div>

                    <ContentList
                        contentType="ln"
                        contentList={lightNovelContent}
                        onDelete={handleDelete}
                        isLoading={
                            contentLoading || isScanning
                        }
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
