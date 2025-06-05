"use client";

interface LoadingOverlayProps {
    isLoading: boolean;
    title?: string;
    description?: string;
}

export function LoadingOverlay({
    isLoading,
    title,
    description,
}: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-[#0f1117]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-[#3498db] border-r-transparent border-b-[#3498db] border-l-transparent"></div>
                <div className="absolute inset-1 animate-spin rounded-full border-4 border-r-[#3498db] border-t-transparent border-b-transparent border-l-[#3498db] animation-delay-150"></div>
            </div>
            <p className="mt-6 text-white text-lg font-medium">
                {title || "Loading Book..."}
            </p>
            <p className="mt-2 text-gray-400 text-sm">
                {description ||
                    "Please wait while we prepare your reading experience"}
            </p>
        </div>
    );
}
