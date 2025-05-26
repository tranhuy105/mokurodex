"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, BookOpen } from "lucide-react";

interface ScanControlsProps {
  onScan: (type: "manga" | "ln") => void;
  onLoadDatabase: () => void;
  isScanning: boolean;
  mangaDir: string | undefined;
}

// Helper component to display path information
function PathInfoHelp() {
  return (
    <div className="flex items-center text-sm text-gray-500 mt-1">
      <Info className="h-4 w-4 mr-1" />
      <span>
        Set your data directory in Settings. Scans will only run in this
        directory&apos;s manga and ln subdirectories.
      </span>
    </div>
  );
}

export function ScanControls({
  onScan,
  onLoadDatabase,
  isScanning,
  mangaDir,
}: ScanControlsProps) {
  const [activeTab, setActiveTab] = useState<"manga" | "ln">("manga");

  return (
    <Tabs
      defaultValue="manga"
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "manga" | "ln")}
      className="w-full"
    >
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="manga" className="flex items-center">
          <Book className="h-4 w-4 mr-2" />
          Manga
        </TabsTrigger>
        <TabsTrigger value="ln" className="flex items-center">
          <BookOpen className="h-4 w-4 mr-2" />
          Light Novels
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manga" className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            className="flex items-center"
            disabled={isScanning || !mangaDir}
            onClick={() => onScan("manga")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Manga Directory
          </Button>

          <Button
            onClick={onLoadDatabase}
            variant="secondary"
            disabled={isScanning}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Load Database Content
          </Button>
        </div>
        <PathInfoHelp />
      </TabsContent>

      <TabsContent value="ln" className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="default"
            className="flex items-center"
            disabled={isScanning || !mangaDir}
            onClick={() => onScan("ln")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Scan Light Novel Directory
          </Button>

          <Button
            onClick={onLoadDatabase}
            variant="secondary"
            disabled={isScanning}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Load Database Content
          </Button>
        </div>
        <PathInfoHelp />
      </TabsContent>
    </Tabs>
  );
}
