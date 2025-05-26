"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchAllManga,
  removeManga,
  scanDataDirectoryContent,
} from "@/actions/manga-api-prisma";
import { Manga } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { ImportInstructions } from "./ImportInstructions";
import { useSettings } from "@/hooks/useSettings";
import { DirectoryConfigDialog } from "./DirectoryConfigDialog";
import { ScanControls } from "./ScanControls";
import { ContentList } from "./ContentList";
import { ProgressIndicator } from "./ProgressIndicator";

export function MangaScanController() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedManga, setScannedManga] = useState<Manga[]>([]);
  const [showScanned, setShowScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<"manga" | "ln">("manga");
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
  });
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const { isLoading: settingsLoading, mangaDir } = useSettings();

  // Update progress percentage whenever importProgress changes
  useEffect(() => {
    if (importProgress.total > 0 && importProgress.current > 0) {
      const percentage = Math.round(
        (importProgress.current / importProgress.total) * 100
      );
      setProgressPercentage(percentage);
    } else {
      setProgressPercentage(0);
    }
  }, [importProgress]);

  const handleDelete = async (id: string) => {
    try {
      const success = await removeManga(id);
      if (success) {
        setScannedManga(scannedManga.filter((manga) => manga.id !== id));
        toast.success("Content Removed");
      } else {
        toast.error("Removal Failed");
      }
    } catch {
      toast.error("Removal Failed");
    }
  };

  const loadDbManga = async () => {
    setIsScanning(true);
    try {
      const manga = await fetchAllManga();
      console.log(manga);
      setScannedManga(manga);
      setShowScanned(true);
    } catch {
      toast.error("Failed to Load Content");
    } finally {
      setIsScanning(false);
    }
  };

  // Function to scan a directory using the server action
  const scanDirectory = async (type: "manga" | "ln") => {
    if (!mangaDir) {
      toast.error(
        "Data directory not configured. Please set it in Settings first."
      );
      return;
    }

    setIsScanning(true);
    setShowProgressBar(true);
    setActiveTab(type);

    // Show a persistent loading toast
    const loadingToastId = toast.loading(
      `Scanning ${type === "manga" ? "manga" : "light novel"} directory...`,
      { duration: Infinity }
    );

    try {
      // Set initial progress
      setImportProgress({
        current: 0,
        total: 1,
        currentItem: `Preparing to scan ${type} directory...`,
      });

      // Use the server action to scan the directory
      const result = await scanDataDirectoryContent(mangaDir, type);

      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      if (result.success) {
        // Load all manga to show updated list
        const allManga = await fetchAllManga();
        console.log("Fetched manga after scan:", allManga);
        setScannedManga(allManga);
        setShowScanned(true);
        toast.success(
          `Successfully imported ${result.importedCount} ${
            type === "manga" ? "manga" : "light novels"
          }`
        );
      } else {
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.error(
            `No content could be imported from ${
              type === "manga" ? "manga" : "light novel"
            } directory`
          );
        }
      }

      // Show failed imports if any
      if (result.failedCount > 0) {
        toast.error(`Failed to import ${result.failedCount} items`);
      }
    } catch (error) {
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      console.error("Scan error:", error);
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(`Scan failed: ${errorMessage}`);
    } finally {
      setIsScanning(false);
      setShowProgressBar(false);
      setImportProgress({ current: 0, total: 0, currentItem: "" });
    }
  };

  // Filter manga by type (manga or ln) based on directory path
  const filteredManga = scannedManga;

  console.log("Filtered manga count:", filteredManga.length);
  console.log("Total scanned manga count:", scannedManga.length);

  if (settingsLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading settings...</span>
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
            Scan your data directory for manga and light novels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Data Directory</h3>
                <p className="text-sm text-muted-foreground">
                  {mangaDir || "Not configured"}
                </p>
              </div>
              <DirectoryConfigDialog mangaDir={mangaDir || ""} />
            </div>

            <ScanControls
              onScan={scanDirectory}
              onLoadDatabase={loadDbManga}
              isScanning={isScanning}
              mangaDir={mangaDir}
            />

            <ProgressIndicator
              isScanning={isScanning}
              showProgressBar={showProgressBar}
              progressPercentage={progressPercentage}
              currentItem={importProgress.currentItem}
              current={importProgress.current}
              total={importProgress.total}
            />
          </div>
        </CardContent>
      </Card>

      {showScanned && (
        <ContentList
          contentType={activeTab}
          contentList={filteredManga}
          onDelete={handleDelete}
          isLoading={isScanning}
        />
      )}
    </div>
  );
}
