"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  FolderPlus,
  RefreshCw,
  Trash2,
  Info,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchAllManga,
  removeManga,
  importCustomMangaDirectory,
} from "@/actions/manga-api-prisma";
import { Manga } from "@prisma/client";
import { Spinner } from "@/components/ui/spinner";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImportInstructions } from "./ImportInstructions";

// Add this interface to handle the non-standard webkitdirectory attribute
interface DirectoryInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
  multiple?: boolean;
}

// Helper component to display path information
function PathInfoHelp() {
  return (
    <div className="flex items-center text-sm text-gray-500 mt-1">
      <Info className="h-4 w-4 mr-1" />
      <span>
        Enter the full path to your manga directory (e.g., C:\Manga\MyManga or
        /home/user/manga)
      </span>
    </div>
  );
}

export function MangaScanController() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedManga, setScannedManga] = useState<Manga[]>([]);
  const [showScanned, setShowScanned] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [selectedDirectories, setSelectedDirectories] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
  });
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [manualPaths, setManualPaths] = useState<string[]>([]);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const batchDirectoryInputRef = useRef<HTMLInputElement>(null);

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
        toast.success("Manga Removed");
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
      setScannedManga(manga);
      setShowScanned(true);
    } catch {
      toast.error("Failed to Load Manga");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportCustomDirectory = async () => {
    if (!customPath.trim()) {
      toast.error("Please enter a directory path");
      return;
    }

    setIsScanning(true);
    setIsDialogOpen(false);
    setShowProgressBar(true);
    setImportProgress({
      current: 1,
      total: 1,
      currentItem: customPath,
    });

    // Show a persistent loading toast
    const loadingToastId = toast.loading(
      `Importing manga from ${customPath}...`,
      {
        duration: Infinity,
      }
    );

    try {
      const result = await importCustomMangaDirectory(customPath);
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      if (result) {
        // Add the newly imported manga to the list
        setScannedManga((prev) => {
          // Check if manga already exists in the list
          const exists = prev.some((m) => m.id === result.id);
          if (exists) {
            // Update the existing manga
            return prev.map((m) => (m.id === result.id ? result : m));
          } else {
            // Add the new manga
            return [...prev, result];
          }
        });
        setShowScanned(true);
        toast.success(`Successfully imported manga from ${customPath}`);
      } else {
        toast.error(`Failed to import manga from ${customPath}`);
      }
    } catch (error) {
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      console.error("Import error:", error);
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;

        // Provide more user-friendly messages for common errors
        if (errorMessage.includes("relative path")) {
          errorMessage =
            "Please provide a full path (e.g., C:\\Manga\\MyManga)";
        } else if (errorMessage.includes("does not exist")) {
          errorMessage = `Directory not found: ${customPath}`;
        } else if (errorMessage.includes("No .mokuro files found")) {
          errorMessage = "No .mokuro files found in the selected directory";
        }
      }

      toast.error(`Import failed: ${errorMessage}`);
    } finally {
      setIsScanning(false);
      setShowProgressBar(false);
      setCustomPath("");
      setImportProgress({ current: 0, total: 0, currentItem: "" });
    }
  };

  const handleBatchDirectoryInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Extract unique directory paths from the selected files
    const dirPaths = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split("/");
        if (parts.length > 1) {
          // The first part is the directory name
          dirPaths.add(parts[0]);
        }
      }
    }

    // Get directory name from the first file
    let newDirName = "";
    if (files[0] && files[0].webkitRelativePath) {
      const parts = files[0].webkitRelativePath.split("/");
      if (parts.length > 1) {
        newDirName = parts[0];
      }
    }

    if (newDirName) {
      // Add the new directory to the existing list
      setSelectedDirectories((prev) => {
        if (prev.includes(newDirName)) return prev; // Skip if already in the list
        const newDirs = [...prev, newDirName];
        // Update manual paths array with empty strings for the new directory
        setManualPaths((prevPaths) => [...prevPaths, ""]);
        return newDirs;
      });

      // Inform the user about path limitations
      toast.error(
        `Added directory: ${newDirName}. Browser security restricts access to full file paths. Please enter the complete path manually.`,
        { duration: 5000 }
      );
    }
  };

  // Handle manual path edit for a specific directory
  const handlePathEdit = (index: number, newPath: string) => {
    const newPaths = [...manualPaths];
    newPaths[index] = newPath;
    setManualPaths(newPaths);
  };

  const handleBatchImport = async () => {
    // Filter out empty paths
    const pathsToImport = manualPaths.filter((path) => path.trim() !== "");

    if (pathsToImport.length === 0) {
      toast.error("Please enter at least one valid directory path");
      return;
    }

    setIsScanning(true);
    setIsBatchDialogOpen(false);
    setShowProgressBar(true);
    setImportProgress({
      current: 1,
      total: pathsToImport.length,
      currentItem: pathsToImport[0] || "",
    });

    const results: Manga[] = [];
    const failedDirs: string[] = [];
    const errorMessages: Record<string, string> = {};

    // Create a persistent loading toast that we'll update
    const loadingToastId = toast.loading(
      `Preparing to import ${pathsToImport.length} directories...`,
      { duration: Infinity }
    );

    try {
      // Import each directory sequentially
      for (let i = 0; i < pathsToImport.length; i++) {
        const dir = pathsToImport[i];
        setImportProgress({
          current: i + 1,
          total: pathsToImport.length,
          currentItem: dir,
        });

        // Update the loading toast
        toast.loading(`Importing ${i + 1}/${pathsToImport.length}: ${dir}`, {
          id: loadingToastId,
        });

        try {
          const result = await importCustomMangaDirectory(dir);
          if (result) {
            results.push(result);
          } else {
            failedDirs.push(dir);
          }
        } catch (error) {
          console.error(`Error importing directory ${dir}:`, error);
          failedDirs.push(dir);

          // Store the specific error message for this directory
          if (error instanceof Error) {
            let errorMessage = error.message;

            // Provide more user-friendly messages for common errors
            if (errorMessage.includes("relative path")) {
              errorMessage = "Invalid path format";
            } else if (errorMessage.includes("does not exist")) {
              errorMessage = "Directory not found";
            } else if (errorMessage.includes("No .mokuro files found")) {
              errorMessage = "No .mokuro files found";
            }

            errorMessages[dir] = errorMessage;
          }
        }
      }

      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      // Update the scanned manga list with all successfully imported manga
      if (results.length > 0) {
        setScannedManga((prev) => {
          const newList = [...prev];

          // Add or update each imported manga
          results.forEach((result) => {
            const existingIndex = newList.findIndex((m) => m.id === result.id);
            if (existingIndex >= 0) {
              newList[existingIndex] = result;
            } else {
              newList.push(result);
            }
          });

          return newList;
        });
        setShowScanned(true);
        toast.success(`Successfully imported ${results.length} manga`);
      }

      // Show a toast with the number of failed imports
      if (failedDirs.length > 0) {
        const errorDetails = failedDirs
          .map((dir) => `${dir}: ${errorMessages[dir] || "Unknown error"}`)
          .join("\n");

        console.error("Failed imports:", errorDetails);
        toast.error(`Failed to import ${failedDirs.length} directories`);
      }
    } catch (error) {
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);

      console.error("Batch import error:", error);
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(`Batch import failed: ${errorMessage}`);
    } finally {
      setIsScanning(false);
      setShowProgressBar(false);
      setSelectedDirectories([]);
      setManualPaths([]);
      setImportProgress({ current: 0, total: 0, currentItem: "" });
    }
  };

  const handleDirectorySelect = async () => {
    try {
      if (directoryInputRef.current) {
        directoryInputRef.current.click();
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
      toast.error("Failed to open directory selector");
    }
  };

  const handleBatchDirectorySelect = async () => {
    try {
      if (batchDirectoryInputRef.current) {
        batchDirectoryInputRef.current.click();
      }
    } catch (error) {
      console.error("Error selecting directories:", error);
      toast.error("Failed to open directory selector");
    }
  };

  const handleDirectoryInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Due to browser security restrictions, we can only get the file name,
      // not the full path. We need to inform the user about this limitation.
      const file = files[0];

      // Get the directory name from the webkitRelativePath
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split("/");
        if (parts.length > 1) {
          const dirName = parts[0];
          // Set the directory name but also show a note to the user
          setCustomPath(dirName);

          // Show a toast notification explaining the limitation
          toast.error(
            "Browser security restricts access to full file paths. Please enter the complete path to this directory manually.",
            { duration: 10000 }
          );
        }
      } else {
        // For browsers that don't support webkitRelativePath
        setCustomPath(file.name);
        toast.success(
          "Please enter the complete path to your manga directory manually.",
          { duration: 5000 }
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <ImportInstructions />

      <Card>
        <CardHeader>
          <CardTitle>Manga Scanner</CardTitle>
          <CardDescription>
            Import manga directories into the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Dialog
              open={isBatchDialogOpen}
              onOpenChange={(open) => {
                if (isScanning) return; // Prevent closing while scanning
                setIsBatchDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="flex items-center"
                  disabled={isScanning}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Batch Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Batch Import Manga Directories</DialogTitle>
                  <DialogDescription>
                    Select manga directories and enter their full paths to
                    import.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Step 1: Select Directories</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBatchDirectorySelect}
                        className="w-full"
                      >
                        {selectedDirectories.length > 0
                          ? `${selectedDirectories.length} directories selected`
                          : "Select Directories"}
                      </Button>

                      {/* Hidden input for directory selection */}
                      <input
                        ref={batchDirectoryInputRef}
                        type="file"
                        {...({
                          webkitdirectory: "",
                          directory: "",
                        } as DirectoryInputProps)}
                        style={{ display: "none" }}
                        onChange={handleBatchDirectoryInputChange}
                      />
                    </div>

                    {selectedDirectories.length > 0 && (
                      <div className="mt-4">
                        <Label className="mb-2 block">
                          Step 2: Enter Full Paths
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enter the absolute path for each directory. These must
                          be complete paths.
                        </p>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                          {selectedDirectories.map((dir, index) => (
                            <div
                              key={index}
                              className="py-2 border-b last:border-0"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium w-6 text-muted-foreground">
                                    {index + 1}.
                                  </span>
                                  <span className="font-medium text-sm">
                                    {dir}
                                  </span>
                                </div>
                                <div className="ml-6 mt-1">
                                  <Input
                                    value={manualPaths[index] || ""}
                                    onChange={(e) =>
                                      handlePathEdit(index, e.target.value)
                                    }
                                    className="text-sm"
                                    placeholder="Enter full absolute path (e.g., C:\Manga\OnePiece)"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <PathInfoHelp />
                    <p className="text-sm text-gray-500">
                      Each directory must contain .mokuro files for the manga to
                      be imported.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsBatchDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBatchImport}
                    disabled={selectedDirectories.length === 0 || isScanning}
                  >
                    {isScanning ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Importing...
                      </>
                    ) : (
                      "Import All"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (isScanning) return; // Prevent closing while scanning
                setIsDialogOpen(open);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center"
                  disabled={isScanning}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Import Single Directory
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Import Custom Manga Directory</DialogTitle>
                  <DialogDescription>
                    Enter the path to a directory containing manga with .mokuro
                    files.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="directory-path">Directory Path</Label>
                    <div className="flex gap-2">
                      <Input
                        id="directory-path"
                        value={customPath}
                        onChange={(e) => setCustomPath(e.target.value)}
                        placeholder="e.g., C:\Manga\MyManga"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDirectorySelect}
                      >
                        Browse
                      </Button>

                      {/* Hidden input for directory selection */}
                      <input
                        ref={directoryInputRef}
                        type="file"
                        {...({
                          webkitdirectory: "",
                          directory: "",
                        } as DirectoryInputProps)}
                        style={{ display: "none" }}
                        onChange={handleDirectoryInputChange}
                      />
                    </div>
                    <PathInfoHelp />
                    <p className="text-sm text-gray-500">
                      The directory must contain .mokuro files for the manga to
                      be imported.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportCustomDirectory}
                    disabled={!customPath.trim() || isScanning}
                  >
                    {isScanning ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Importing...
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              onClick={loadDbManga}
              variant="secondary"
              disabled={isScanning}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Database Manga
            </Button>
          </div>

          {/* Show progress indicator when scanning */}
          {isScanning && showProgressBar && (
            <div className="mt-4 p-4 border rounded-md bg-secondary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Importing {importProgress.current} of {importProgress.total}
                </span>
                <span className="text-xs text-muted-foreground">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-2 transition-all duration-300 ease-in-out"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
              {importProgress.currentItem && (
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  <span className="truncate">{importProgress.currentItem}</span>
                </div>
              )}
            </div>
          )}

          {/* Show global loading state when scanning but no progress info */}
          {isScanning && !showProgressBar && (
            <div className="mt-4 flex items-center justify-center p-6 border rounded-md bg-secondary/10">
              <div className="text-center">
                <Spinner className="mx-auto h-8 w-8 mb-3" />
                <p className="text-sm font-medium">Loading manga data...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a moment
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showScanned && (
        <Card>
          <CardHeader>
            <CardTitle>
              Manga Database{" "}
              {scannedManga.length > 0 && `(${scannedManga.length})`}
            </CardTitle>
            <CardDescription>
              Manga that have been imported into the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scannedManga.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FolderPlus className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-3">No manga found in the database.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scannedManga.map((manga) => (
                  <div
                    key={manga.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{manga.title}</h3>
                        <Badge variant="outline">
                          {manga.volumes}{" "}
                          {manga.volumes === 1 ? "volume" : "volumes"}
                        </Badge>
                        {manga.scanStatus === "error" && (
                          <Badge
                            variant="destructive"
                            className="flex items-center"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {manga.directoryPath}
                      </p>
                      {manga.scanStatus === "error" && manga.errorMessage && (
                        <p className="mt-1 text-sm text-red-500">
                          {manga.errorMessage}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDelete(manga.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={isScanning}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
