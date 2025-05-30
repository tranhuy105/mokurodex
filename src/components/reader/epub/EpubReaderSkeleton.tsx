export function EpubReaderSkeleton() {
    return (
        <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                <p className="text-gray-400">
                    Loading EPUB reader...
                </p>
            </div>
        </div>
    );
}
