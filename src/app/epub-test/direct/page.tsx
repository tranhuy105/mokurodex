"use client";

import { useState } from "react";

export default function DirectEpubTest() {
  const [mangaId, setMangaId] = useState<string>("");
  const [volumeNumber, setVolumeNumber] = useState<string>("1");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [epubUrl, setEpubUrl] = useState<string | null>(null);

  // Function to generate the EPUB URL
  const loadEpub = async () => {
    if (!mangaId) {
      setError("Please enter a manga ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEpubUrl(null);

    try {
      // Create the URL to the EPUB file
      const url = `/api/epub?mangaId=${mangaId}&volumeNumber=${volumeNumber}`;

      // First check if the EPUB exists by making a HEAD request
      const checkResponse = await fetch(url, { method: "HEAD" });

      if (!checkResponse.ok) {
        throw new Error(
          `EPUB not found or not accessible (${checkResponse.status})`
        );
      }

      // Set the URL for the iframe to use
      setEpubUrl(url);
    } catch (err) {
      console.error("Error loading EPUB:", err);
      setError(
        `Failed to load EPUB: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Direct EPUB File Test</h1>
      <p className="mb-4">
        This page tests loading an EPUB file directly from the API.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Manga ID"
          value={mangaId}
          onChange={(e) => setMangaId(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Volume Number"
          value={volumeNumber}
          onChange={(e) => setVolumeNumber(e.target.value)}
          className="border p-2 rounded w-32"
          min="1"
        />
        <button
          onClick={loadEpub}
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isLoading ? "Loading..." : "Load EPUB"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {epubUrl && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">EPUB File:</h2>
          <p className="mb-4">
            EPUB file loaded successfully. You can download it using the link
            below:
          </p>
          <div className="flex flex-col gap-4">
            <a
              href={epubUrl}
              download
              className="bg-green-500 text-white px-4 py-2 rounded text-center hover:bg-green-600"
            >
              Download EPUB File
            </a>

            <div className="mt-4">
              <p className="font-semibold mb-2">
                To view in browser with an EPUB reader:
              </p>
              <ol className="list-decimal pl-6">
                <li className="mb-1">
                  Download the EPUB file using the button above
                </li>
                <li className="mb-1">
                  Use an EPUB reader extension or application
                </li>
                <li className="mb-1">
                  Or upload to a service like{" "}
                  <a
                    href="https://www.epubread.com/en/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    epubread.com
                  </a>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
