"use client";

import { Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface ProgressIndicatorProps {
  isScanning: boolean;
  showProgressBar: boolean;
  progressPercentage: number;
  currentItem: string;
  current: number;
  total: number;
}

export function ProgressIndicator({
  isScanning,
  showProgressBar,
  progressPercentage,
  currentItem,
  current,
  total,
}: ProgressIndicatorProps) {
  if (!isScanning) return null;

  if (showProgressBar) {
    return (
      <div className="mt-4 p-4 border rounded-md bg-secondary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Scanning {current} of {total}
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
        {currentItem && (
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            <span className="truncate">{currentItem}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-center p-6 border rounded-md bg-secondary/10">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8 mb-3" />
        <p className="text-sm font-medium">Loading content data...</p>
        <p className="text-xs text-muted-foreground mt-1">
          This may take a moment
        </p>
      </div>
    </div>
  );
}
