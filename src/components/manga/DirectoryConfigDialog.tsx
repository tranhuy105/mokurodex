"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/useSettings";
import toast from "react-hot-toast";

interface DirectoryConfigDialogProps {
  mangaDir: string;
}

export function DirectoryConfigDialog({
  mangaDir,
}: DirectoryConfigDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { updateSettings } = useSettings();

  // Format directory path for display
  const formatDirPath = (dirPath: string) => {
    // Replace backslashes with forward slashes for consistent display
    return dirPath.replace(/\\/g, "/");
  };

  // Function to update the data directory in settings
  const updateDataDirectory = async (newPath: string) => {
    try {
      await updateSettings({ mangaDir: newPath });
      toast.success("Data directory updated successfully");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to update data directory");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderOpen className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Data Directory Configuration</DialogTitle>
          <DialogDescription>
            Set your data directory in the Settings page. The scanner will look
            for content in manga/ and ln/ subdirectories.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm mb-4">
            Your current data directory is:{" "}
            <strong>{mangaDir || "Not configured"}</strong>
          </p>
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2">
              Update Data Directory
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="data-dir"
                defaultValue={mangaDir}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., D:\Manga or /home/user/manga"
              />
              <Button
                onClick={() => {
                  const input = document.getElementById(
                    "data-dir"
                  ) as HTMLInputElement;
                  if (input && input.value) {
                    updateDataDirectory(input.value);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
          <p className="text-sm">
            Please ensure you have the following structure:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mt-2 text-xs overflow-x-auto whitespace-pre">
            {`${formatDirPath(mangaDir || "[YOUR_DATA_DIR]")}/
├── manga/
│   ├── [manga_title_1]/
│   └── [manga_title_2]/
└── ln/
    ├── [light_novel_1]/
    └── [light_novel_2]/`}
          </pre>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button asChild>
            <a href="/settings">Go to Settings</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
