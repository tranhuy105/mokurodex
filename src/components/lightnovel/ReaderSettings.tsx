"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface ReaderSettingsProps {
    onClose: () => void;
    onFontSizeChange: (size: string) => void;
    currentFontSize: string;
}

export function ReaderSettings({
    onClose,
    onFontSizeChange,
    currentFontSize,
}: ReaderSettingsProps) {
    const [fontSize, setFontSize] =
        useState(currentFontSize);

    const handleFontSizeChange = (newSize: string) => {
        setFontSize(newSize);
        onFontSizeChange(newSize);
    };

    return (
        <div className="fixed top-0 right-0 h-full z-[1000] w-64 bg-gray-800 shadow-lg border-l border-gray-700">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="font-medium text-white">
                    Reader Settings
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-700 text-white"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-4 space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-200">
                        Font Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            className={`p-2 rounded text-center text-sm ${
                                fontSize === "small"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-700 text-gray-200"
                            }`}
                            onClick={() =>
                                handleFontSizeChange(
                                    "small"
                                )
                            }
                        >
                            Small
                        </button>
                        <button
                            className={`p-2 rounded text-center text-sm ${
                                fontSize === "medium"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-700 text-gray-200"
                            }`}
                            onClick={() =>
                                handleFontSizeChange(
                                    "medium"
                                )
                            }
                        >
                            Medium
                        </button>
                        <button
                            className={`p-2 rounded text-center text-sm ${
                                fontSize === "large"
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-700 text-gray-200"
                            }`}
                            onClick={() =>
                                handleFontSizeChange(
                                    "large"
                                )
                            }
                        >
                            Large
                        </button>
                    </div>
                </div>

                <div className="pt-2 text-xs text-gray-400">
                    More settings coming soon...
                </div>
            </div>
        </div>
    );
}
