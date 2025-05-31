import {
    ImportItem,
    useImport,
    WorkflowStep,
} from "@/contexts/ImportContext";
import { scanContentDirectoryWithProgress } from "@/server/actions/content";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { contentKeys } from "./use-content";

// Define workflow steps for the import process
const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: "initialize",
        name: "Initialize Import",
        status: "pending",
    },
    {
        id: "verify_directory",
        name: "Verify Directories",
        status: "pending",
    },
    {
        id: "find_content_directories",
        name: "Find Content Directories",
        status: "pending",
    },
    {
        id: "detect_content",
        name: "Detect Content Type",
        status: "pending",
    },
    {
        id: "process_content",
        name: "Process Content",
        status: "pending",
    },
    {
        id: "save_database",
        name: "Save to Database",
        status: "pending",
    },
    {
        id: "complete",
        name: "Import Complete",
        status: "pending",
    },
];

export function useImportWorkflow() {
    const [isProcessing, setIsProcessing] = useState(false);
    const {
        state,
        addItems,
        setCurrentItem,
        updateItemStatus,
        addChildItems,
        setScanMode,
        setImporting,
        initializeWorkflow,
        updateWorkflowStep,
        setCurrentStep,
        reset,
    } = useImport();
    const queryClient = useQueryClient();

    // Function to add a parent directory for scanning
    const addParentDirectoryToQueue = useCallback(
        (baseDir: string) => {
            // Add both manga and light novel types
            const newItems: ImportItem[] = [
                {
                    id: nanoid(),
                    name: "Manga Directory",
                    path: baseDir,
                    status: "pending",
                    progress: 0,
                    type: "manga",
                    children: [],
                },
                {
                    id: nanoid(),
                    name: "Light Novel Directory",
                    path: baseDir,
                    status: "pending",
                    progress: 0,
                    type: "lightnovel",
                    children: [],
                },
            ];

            addItems(newItems);
            setScanMode("directory");

            // Initialize workflow steps
            initializeWorkflow(WORKFLOW_STEPS);
        },
        [addItems, setScanMode, initializeWorkflow]
    );

    // Function to process directory scanning
    const processDirectoryScan = useCallback(async () => {
        if (isProcessing || state.items.length === 0)
            return;

        setIsProcessing(true);
        setImporting(true);

        try {
            // Start workflow - Initialize step
            updateWorkflowStep("initialize", "processing");
            await new Promise((resolve) =>
                setTimeout(resolve, 500)
            ); // Brief delay for visual feedback
            updateWorkflowStep("initialize", "success");
            setCurrentStep("verify_directory");

            // Process each item (manga and light novel directories)
            for (const item of state.items) {
                if (item.status !== "pending") continue;

                // Set current item
                setCurrentItem(item.id);
                updateItemStatus(item.id, "processing");

                try {
                    // Convert lightnovel type to ln for the API
                    const contentType =
                        item.type === "lightnovel"
                            ? "ln"
                            : "manga";

                    // Update workflow step - Verify Directory
                    updateWorkflowStep(
                        "verify_directory",
                        "processing"
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 500)
                    ); // Brief delay for visual feedback

                    // Scan the content directory with progress tracking
                    const result =
                        await scanContentDirectoryWithProgress(
                            {
                                baseDir: item.path,
                                contentType,
                            }
                        );

                    // Update workflow steps based on the result step
                    if (
                        result.step === "verify_directory"
                    ) {
                        if (!result.success) {
                            updateWorkflowStep(
                                "verify_directory",
                                "error",
                                result.error
                            );
                            updateItemStatus(
                                item.id,
                                "error",
                                result.error
                            );
                            continue;
                        }
                    }

                    updateWorkflowStep(
                        "verify_directory",
                        "success"
                    );
                    setCurrentStep(
                        "find_content_directories"
                    );

                    // Find Content Directories step
                    updateWorkflowStep(
                        "find_content_directories",
                        "processing"
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 500)
                    ); // Brief delay for visual feedback

                    if (
                        result.step ===
                            "find_content_directories" &&
                        !result.success
                    ) {
                        updateWorkflowStep(
                            "find_content_directories",
                            "error",
                            result.error
                        );
                        updateItemStatus(
                            item.id,
                            "error",
                            result.error
                        );
                        continue;
                    }

                    updateWorkflowStep(
                        "find_content_directories",
                        "success"
                    );
                    setCurrentStep("detect_content");

                    // Content Detection step
                    updateWorkflowStep(
                        "detect_content",
                        "processing"
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 500)
                    ); // Brief delay for visual feedback
                    updateWorkflowStep(
                        "detect_content",
                        "success"
                    );

                    // Process Content step
                    setCurrentStep("process_content");
                    updateWorkflowStep(
                        "process_content",
                        "processing"
                    );

                    // Create child items for each found content
                    if (
                        result.importedItems.length > 0 ||
                        result.failedItems.length > 0
                    ) {
                        const childItems: ImportItem[] =
                            result.importedItems.map(
                                (content) => ({
                                    id: nanoid(),
                                    name: content.name,
                                    path: `${item.path}/${contentType}/${content.name}`,
                                    status: "success",
                                    type: item.type,
                                    message: `Successfully imported ${content.name}`,
                                })
                            );

                        // Add failed items as well
                        const failedItems: ImportItem[] =
                            result.failedItems.map(
                                (failed) => ({
                                    id: nanoid(),
                                    name: failed.name,
                                    path: `${item.path}/${contentType}/${failed.name}`,
                                    status: "error",
                                    type: item.type,
                                    message:
                                        failed.error ||
                                        "Import failed",
                                })
                            );

                        // Add all child items to the parent
                        addChildItems(item.id, [
                            ...childItems,
                            ...failedItems,
                        ]);
                    }

                    updateWorkflowStep(
                        "process_content",
                        "success"
                    );

                    // Save to Database step
                    setCurrentStep("save_database");
                    updateWorkflowStep(
                        "save_database",
                        "processing"
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 500)
                    ); // Brief delay for visual feedback
                    updateWorkflowStep(
                        "save_database",
                        "success"
                    );

                    // Update parent status
                    if (result.success) {
                        updateItemStatus(
                            item.id,
                            "success",
                            `Imported ${
                                result.importedCount
                            } ${
                                item.type === "manga"
                                    ? "manga"
                                    : "light novels"
                            }`
                        );
                    } else {
                        updateItemStatus(
                            item.id,
                            "error",
                            result.error ||
                                `No ${
                                    item.type === "manga"
                                        ? "manga"
                                        : "light novels"
                                } found`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error scanning ${item.type} directory:`,
                        error
                    );
                    updateItemStatus(
                        item.id,
                        "error",
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred"
                    );

                    // Update workflow with error
                    const currentStep =
                        state.workflowSteps.find(
                            (step) =>
                                step.status === "processing"
                        )?.id;
                    if (currentStep) {
                        updateWorkflowStep(
                            currentStep,
                            "error",
                            "Process failed"
                        );
                    }
                }
            }

            // Complete step
            setCurrentStep("complete");
            updateWorkflowStep("complete", "processing");
            await new Promise((resolve) =>
                setTimeout(resolve, 500)
            ); // Brief delay for visual feedback
            updateWorkflowStep("complete", "success");

            // Invalidate queries to refresh content list
            queryClient.invalidateQueries({
                queryKey: contentKeys.lists(),
            });

            // Show success message
            const successCount = state.items.filter(
                (item) => item.status === "success"
            ).length;
            const errorCount = state.items.filter(
                (item) => item.status === "error"
            ).length;

            if (successCount > 0) {
                toast.success(
                    `Successfully scanned ${successCount} directories`
                );
            }

            if (errorCount > 0) {
                toast.error(
                    `Failed to scan ${errorCount} directories`
                );
            }
        } catch (error) {
            console.error(
                "Error processing directory scan:",
                error
            );
            toast.error("Error processing directory scan");

            // Update workflow with error
            const currentStep = state.workflowSteps.find(
                (step) => step.status === "processing"
            )?.id;
            if (currentStep) {
                updateWorkflowStep(
                    currentStep,
                    "error",
                    "Process failed"
                );
            }
        } finally {
            setCurrentItem(null);
            setIsProcessing(false);
            setImporting(false);
        }
    }, [
        isProcessing,
        state.items,
        state.workflowSteps,
        setCurrentItem,
        updateItemStatus,
        addChildItems,
        setImporting,
        updateWorkflowStep,
        setCurrentStep,
        queryClient,
    ]);

    // Process queue - only directory scan mode is available
    const processQueue = useCallback(() => {
        return processDirectoryScan();
    }, [processDirectoryScan]);

    // Function to cancel the import process
    const cancelImport = useCallback(() => {
        if (!isProcessing) {
            reset();
        } else {
            toast.error(
                "Can't cancel while processing. Please wait for the current item to complete."
            );
        }
    }, [isProcessing, reset]);

    return {
        importState: state,
        isProcessing,
        addParentDirectoryToQueue,
        processQueue,
        cancelImport,
        resetImport: reset,
    };
}
