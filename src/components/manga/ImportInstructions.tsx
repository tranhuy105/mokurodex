import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle, FolderTree, FileWarning } from "lucide-react";

export function ImportInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Import Instructions
        </CardTitle>
        <CardDescription>
          How to properly import your manga collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Absolute Path Requirements */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Full Path Required</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              Due to browser security restrictions, you{" "}
              <strong>must provide the absolute path</strong> to your manga
              directories. The browser cannot access your file system directly.
            </p>
            <p className="mt-2">
              <strong>Examples:</strong>
              <br />• Windows:{" "}
              <code>C:\Users\YourName\Documents\Manga\OnePiece</code>
              <br />• macOS/Linux: <code>/home/username/manga/one-piece</code>
            </p>
          </AlertDescription>
        </Alert>

        {/* Required Directory Structure */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FolderTree className="h-5 w-5" /> Required Directory Structure
          </h3>
          <p>
            Each manga directory must contain Mokuro-processed files with the
            following structure:
          </p>
          <div className="bg-secondary/50 p-4 rounded-md font-mono text-sm whitespace-pre">
            {`MangaTitle/
  ├── Volume 01/              # Volume folder
  │   ├── 001.jpg             # Page images
  │   ├── 002.jpg
  │   └── ...
  ├── volume01.mokuro         # Mokuro metadata file
  ├── Volume 02/              # Another volume
  ├── volume02.mokuro
  └── ...`}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Each volume must have a corresponding .mokuro file that contains the
            OCR data. These files are created when processing manga with the
            Mokuro tool.
          </p>
        </div>

        {/* Batch Import Instructions */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FolderTree className="h-5 w-5" /> Batch Import Process
          </h3>
          <p>When using the batch import feature:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Click &quot;Select Directories&quot; to choose manga folders from
              your system
            </li>
            <li>
              Due to browser security limitations, only folder names will be
              shown, not their full paths
            </li>
            <li>
              You{" "}
              <strong>must manually enter the complete absolute path</strong>{" "}
              for each directory
            </li>
            <li>Only directories with valid paths entered will be imported</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Important:</strong> The browser cannot access your file
            system directly, so you must enter the complete path to each manga
            directory yourself.
          </p>
        </div>

        {/* Processing Status */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileWarning className="h-5 w-5" /> Import Processing
          </h3>
          <p>When importing manga:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              The import process may take several minutes for large collections
            </li>
            <li>A progress bar will show the current import status</li>
            <li>Do not navigate away from the page during import</li>
            <li>
              Each manga will be processed individually and added to your
              library
            </li>
            <li>
              Failed imports will be reported with specific error messages
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            For batch imports, each directory is processed sequentially. If one
            fails, the others will still be attempted.
          </p>
        </div>

        {/* Common Issues */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Common Issues</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>No .mokuro files found</strong> - Make sure your manga
                has been processed with Mokuro
              </li>
              <li>
                <strong>Directory not found</strong> - Check that the path is
                correct and accessible
              </li>
              <li>
                <strong>Invalid path format</strong> - Ensure you&apos;re using
                the correct format for your OS
              </li>
              <li>
                <strong>Import fails</strong> - Check file permissions and that
                the directory structure matches the requirements
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
