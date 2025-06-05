"use client";

import { cn } from "@/lib/utils";
import { RefObject } from "react";
import { ContentRendererProps } from "./types";

export function ContentRenderer({
    content,
    isLoading,
    error,
    containerRef,
}: ContentRendererProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                <p className="text-sm text-gray-300 mt-4">
                    Loading EPUB content...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500 p-4">{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef as RefObject<HTMLDivElement>}
            className="flex-1 overflow-auto light-novel-reader p-4 md:p-8 pt-16"
            style={{
                willChange: "scroll-position",
                contain: "layout style paint",
            }}
        >
            <div className="max-w-3xl mx-auto">
                <div
                    className={cn(
                        "light-novel-content text-white"
                    )}
                    dangerouslySetInnerHTML={{
                        __html: content,
                    }}
                />
            </div>
        </div>
    );
}
