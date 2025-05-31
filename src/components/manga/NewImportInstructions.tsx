import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertCircle,
    FileWarning,
    FolderTree,
    Info,
} from "lucide-react";

export function NewImportInstructions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Import Guide
                </CardTitle>
                <CardDescription>
                    How to import content into your library
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Server-Side Import Notice */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                        Server-Side Import
                    </AlertTitle>
                    <AlertDescription>
                        <p className="mt-2">
                            This import tool runs directly
                            on the server. You need to
                            provide paths that are valid on
                            the server&apos;s file system,
                            not your local machine.
                        </p>
                        <p className="mt-2">
                            <strong>Examples:</strong>
                            <br />• Windows:{" "}
                            <code>
                                C:\Users\ServerUser\Documents\Manga
                            </code>
                            <br />• macOS/Linux:{" "}
                            <code>
                                /home/serveruser/manga
                            </code>
                        </p>
                    </AlertDescription>
                </Alert>

                {/* Required Directory Structure */}
                <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <FolderTree className="h-5 w-5" />{" "}
                        Directory Structure
                    </h3>

                    <p className="text-sm text-muted-foreground">
                        The directory scanner expects a
                        specific folder structure with
                        separate manga and light novel
                        directories:
                    </p>

                    <div className="bg-secondary/50 p-4 rounded-md font-mono text-sm whitespace-pre overflow-x-auto">
                        {`ParentDirectory/
  ├── manga/                  # Manga content directory
  │   ├── OnePiece/           # Individual manga series
  │   │   ├── Volume 01/      # Volume folder
  │   │   ├── volume01.mokuro # Mokuro metadata file
  │   │   └── ...
  │   ├── Naruto/             # Another manga series
  │   └── ...
  │
  └── ln/                     # Light novel content directory
      ├── SpiceAndWolf/       # Individual light novel series
      │   ├── volume01.epub   # EPUB file for volume 1
      │   └── ...
      ├── Overlord/           # Another light novel series
      └── ...`}
                    </div>
                </div>

                {/* Import Workflow */}
                <div className="space-y-3">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <FileWarning className="h-5 w-5" />{" "}
                        Import Process
                    </h3>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>
                            Enter the{" "}
                            <strong>absolute path</strong>{" "}
                            to the parent directory
                            containing your manga and light
                            novel folders
                        </li>
                        <li>
                            Click{" "}
                            <strong>Scan Directory</strong>{" "}
                            to add the directory to the
                            import queue
                        </li>
                        <li>
                            Click{" "}
                            <strong>Start Import</strong> to
                            begin the scanning and import
                            process
                        </li>
                        <li>
                            The system will automatically
                            scan the manga/ and ln/
                            subdirectories and import all
                            valid content
                        </li>
                        <li>
                            The workflow diagram will show
                            the progress of the scanning and
                            importing process
                        </li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-2">
                        The import process may take several
                        minutes for large collections. You
                        can monitor the progress in
                        real-time through the workflow
                        visualization.
                    </p>
                </div>

                {/* Manga Structure */}
                <div className="space-y-2">
                    <h4 className="font-medium">
                        Manga Structure Requirements
                    </h4>
                    <div className="bg-secondary/50 p-4 rounded-md font-mono text-sm whitespace-pre overflow-x-auto">
                        {`manga/MangaTitle/
  ├── Volume 01/              # Volume folder
  │   ├── 001.jpg             # Page images
  │   ├── 002.jpg
  │   └── ...
  ├── volume01.mokuro         # Mokuro metadata file
  ├── Volume 02/              # Another volume
  ├── volume02.mokuro
  └── ...`}
                    </div>
                </div>

                {/* Light Novel Structure */}
                <div className="space-y-2">
                    <h4 className="font-medium">
                        Light Novel Structure Requirements
                    </h4>
                    <div className="bg-secondary/50 p-4 rounded-md font-mono text-sm whitespace-pre overflow-x-auto">
                        {`ln/LightNovelTitle/
  ├── volume01.epub           # EPUB file for volume 1
  ├── volume02.epub           # EPUB file for volume 2
  └── ...`}
                    </div>
                </div>

                {/* Troubleshooting */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Troubleshooting</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>
                                <strong>
                                    Directory not found
                                </strong>{" "}
                                - Ensure the path exists on
                                the server and is accessible
                            </li>
                            <li>
                                <strong>
                                    Missing manga/ or ln/
                                    directories
                                </strong>{" "}
                                - Create these
                                subdirectories in your
                                parent folder
                            </li>
                            <li>
                                <strong>
                                    No .mokuro files found
                                </strong>{" "}
                                - For manga, ensure your
                                content has been processed
                                with Mokuro
                            </li>
                            <li>
                                <strong>
                                    No .epub files found
                                </strong>{" "}
                                - For light novels, check
                                that your files have the
                                .epub extension
                            </li>
                            <li>
                                <strong>
                                    Permission denied
                                </strong>{" "}
                                - Make sure the server has
                                read access to the directory
                            </li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
