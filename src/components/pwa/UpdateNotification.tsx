"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function UpdateNotification() {
    const [
        showUpdateNotification,
        setShowUpdateNotification,
    ] = useState(false);
    const [waitingWorker, setWaitingWorker] =
        useState<ServiceWorker | null>(null);

    useEffect(() => {
        const handleSwUpdate = (event: Event) => {
            const { detail } =
                event as CustomEvent<ServiceWorkerRegistration>;
            if (detail?.waiting) {
                // A new service worker is waiting to activate
                setWaitingWorker(detail.waiting);
                setShowUpdateNotification(true);
            }
        };

        // Listen for the custom event dispatched when a new service worker is waiting
        window.addEventListener("swUpdate", handleSwUpdate);

        return () => {
            window.removeEventListener(
                "swUpdate",
                handleSwUpdate
            );
        };
    }, []);

    const updateApp = () => {
        if (!waitingWorker) return;

        // Send a message to the waiting service worker to skip waiting
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
        setShowUpdateNotification(false);
    };

    if (!showUpdateNotification) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                    Update Available
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                        setShowUpdateNotification(false)
                    }
                    className="h-8 w-8 p-0"
                >
                    <span className="sr-only">Close</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line
                            x1="18"
                            y1="6"
                            x2="6"
                            y2="18"
                        ></line>
                        <line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                        ></line>
                    </svg>
                </Button>
            </div>
            <p className="text-sm">
                A new version of the app is available.
                Update now for the latest features and
                improvements.
            </p>
            <div className="flex justify-end gap-2 mt-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setShowUpdateNotification(false)
                    }
                >
                    Later
                </Button>
                <Button size="sm" onClick={updateApp}>
                    Update Now
                </Button>
            </div>
        </div>
    );
}
