import { Button } from "@/components/ui/button";
import { useImportWorkflow } from "@/hooks/useImportWorkflow";
import { useSettings } from "@/hooks/useSettings";
import { FolderSearch, FolderTree } from "lucide-react";
import { useState } from "react";

export function DirectoryScanner() {
    const [customPath, setCustomPath] =
        useState<string>("");
    const { addParentDirectoryToQueue } =
        useImportWorkflow();
    const { mangaDir } = useSettings();

    // Add the configured data directory to the queue
    const scanConfiguredDirectory = () => {
        if (mangaDir) {
            addParentDirectoryToQueue(mangaDir);
        }
    };

    // Add a custom directory to the queue
    const scanCustomDirectory = () => {
        if (customPath.trim()) {
            addParentDirectoryToQueue(customPath.trim());
            setCustomPath("");
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-sm font-medium">
                    Scan Configured Directory
                </h3>
                <div className="flex items-center gap-2">
                    <div className="flex-1 text-sm bg-secondary/20 px-3 py-2 rounded-md truncate">
                        {mangaDir ||
                            "No directory configured"}
                    </div>
                    <Button
                        onClick={scanConfiguredDirectory}
                        disabled={!mangaDir}
                        className="flex items-center gap-1"
                    >
                        <FolderSearch className="h-4 w-4" />
                        Scan
                    </Button>
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-medium">
                    Scan Custom Directory
                </h3>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={customPath}
                        onChange={(e) =>
                            setCustomPath(e.target.value)
                        }
                        placeholder="Enter absolute path to parent directory"
                        className="flex-1 px-3 py-2 text-sm border rounded-md"
                    />
                    <Button
                        onClick={scanCustomDirectory}
                        disabled={!customPath.trim()}
                        className="flex items-center gap-1"
                    >
                        <FolderSearch className="h-4 w-4" />
                        Scan
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    The directory should contain
                    &apos;manga&apos; and &apos;ln&apos;
                    subdirectories
                </p>
            </div>

            <div className="rounded-md bg-secondary/20 p-3 mt-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FolderTree className="h-4 w-4 text-primary" />
                    Expected Directory Structure
                </div>
                <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                    {`ParentDirectory/
  ├── manga/
  │   ├── MangaTitle1/
  │   └── MangaTitle2/
  └── ln/
      ├── LightNovelTitle1/
      └── LightNovelTitle2/`}
                </pre>
            </div>
        </div>
    );
}
