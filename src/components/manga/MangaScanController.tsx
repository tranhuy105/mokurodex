"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FolderPlus, RefreshCw, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  importAllManga,
  fetchDatabaseManga,
  removeDatabaseManga,
} from "@/actions/manga-import-api";
import { MangaEntity } from "@/lib/database/DatabaseInterface";
import { Spinner } from "../ui/spinner";
import toast from "react-hot-toast";

export function MangaScanController() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedManga, setScannedManga] = useState<MangaEntity[]>([]);
  const [showScanned, setShowScanned] = useState(false);

  const handleScanAll = async () => {
    setIsScanning(true);
    try {
      const result = await importAllManga();
      setScannedManga(result);
      setShowScanned(true);
      toast.success(`Scanned ${result.length} manga.`);
    } catch {
      toast.error("Scan Failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await removeDatabaseManga(id);
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
      const manga = await fetchDatabaseManga();
      setScannedManga(manga);
      setShowScanned(true);
    } catch {
      toast.error("Failed to Load Manga");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manga Scanner</CardTitle>
          <CardDescription>
            Scan your manga directory to import manga into the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleScanAll}
              disabled={isScanning}
              className="flex items-center"
            >
              {isScanning ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Scan All Manga
            </Button>
            <Button
              onClick={loadDbManga}
              variant="outline"
              disabled={isScanning}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Database Manga
            </Button>
          </div>
        </CardContent>
      </Card>

      {showScanned && (
        <Card>
          <CardHeader>
            <CardTitle>
              Scanned Manga{" "}
              {scannedManga.length > 0 && `(${scannedManga.length})`}
            </CardTitle>
            <CardDescription>
              Manga that have been scanned and imported into the database.
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
