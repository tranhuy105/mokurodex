"use client";

// import { EpubReader } from "@/components/lightnovel";
import { SimpleEpubReader } from "@/components/lightnovel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";

export default function EpubReaderTest() {
    const [mangaId, setMangaId] = useState<string>("");
    const [volumeNumber, setVolumeNumber] =
        useState<string>("1");
    const [isLoading, setIsLoading] =
        useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [epubData, setEpubData] =
        useState<ArrayBuffer | null>(null);

    // Function to load the EPUB file as ArrayBuffer
    const loadEpub = async () => {
        if (!mangaId) {
            setError("Please enter a manga ID");
            return;
        }

        setIsLoading(true);
        setError(null);
        setEpubData(null);

        try {
            // Create the URL to the EPUB file
            const url = `/api/epub?mangaId=${mangaId}&volumeNumber=${volumeNumber}`;

            // Fetch the EPUB file as ArrayBuffer
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `EPUB not found or not accessible (${response.status})`
                );
            }

            // Get the ArrayBuffer from the response
            const data = await response.arrayBuffer();
            setEpubData(data);
        } catch (err) {
            console.error("Error loading EPUB:", err);
            setError(
                `Failed to load EPUB: ${
                    err instanceof Error
                        ? err.message
                        : String(err)
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="md:p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
            {!epubData ? (
                <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <p className="mb-6 text-gray-600 dark:text-gray-300">
                        This is a simplified light novel
                        reader with continuous scrolling and
                        better image support.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="manga-id"
                                className="block text-sm font-medium mb-1"
                            >
                                Manga ID
                            </label>
                            <Input
                                id="manga-id"
                                type="text"
                                placeholder="Enter manga ID"
                                value={mangaId}
                                onChange={(e) =>
                                    setMangaId(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="volume"
                                className="block text-sm font-medium mb-1"
                            >
                                Volume Number
                            </label>
                            <Input
                                id="volume"
                                type="number"
                                placeholder="Volume Number"
                                value={volumeNumber}
                                onChange={(e) =>
                                    setVolumeNumber(
                                        e.target.value
                                    )
                                }
                                min="1"
                            />
                        </div>

                        <Button
                            onClick={loadEpub}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading
                                ? "Loading..."
                                : "Read Light Novel"}
                        </Button>
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            href="/epub-test"
                            className="text-blue-500 hover:underline text-sm"
                        >
                            Back to EPUB Test Index
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="top-[120px] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    <SimpleEpubReader epubData={epubData} />
                </div>
            )}
        </div>
    );
}
