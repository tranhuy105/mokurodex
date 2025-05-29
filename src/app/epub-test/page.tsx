import Link from "next/link";

export default function EpubTestIndex() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">EPUB Reader Test Pages</h1>

      <p className="mb-6">
        These test pages demonstrate different approaches for reading EPUB
        files:
      </p>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-2">
            Approach 1: Direct EPUB File
          </h2>
          <p className="mb-4 text-gray-600">
            This approach serves the entire EPUB file to the client for
            download. The advantage is simplicity and compatibility with
            external EPUB readers.
          </p>
          <Link
            href="/epub-test/direct"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Direct EPUB Approach
          </Link>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold mb-2">
            Approach 2: In-Browser EPUB Reader
          </h2>
          <p className="mb-4 text-gray-600">
            This approach uses epubjs to render the EPUB directly in the
            browser. It provides a complete reading experience with navigation
            controls.
          </p>
          <Link
            href="/epub-test/reader"
            className="inline-block bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            Test EPUB Reader
          </Link>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">How to Use These Tests:</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            First, make sure you have imported at least one EPUB file using the
            import functionality.
          </li>
          <li>
            Get the manga ID from the database or from the manga list page.
          </li>
          <li>Enter the manga ID and volume number in the test page.</li>
          <li>Click the load button to test reading the EPUB content.</li>
        </ol>
      </div>
    </div>
  );
}
