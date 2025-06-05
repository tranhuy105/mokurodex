"use client";

interface LoadingOverlayProps {
    isLoading: boolean;
}

export function LoadingOverlay({
    isLoading,
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
        </div>
    );
}
