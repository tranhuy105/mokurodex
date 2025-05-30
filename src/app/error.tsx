"use client";

import CustomErrorPage from "@/components/CustomErrorPage";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="w-full h-full">
            <CustomErrorPage error={error} reset={reset} />
        </div>
    );
}
