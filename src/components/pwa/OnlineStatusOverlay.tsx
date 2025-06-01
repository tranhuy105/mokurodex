"use client";

import { useEffect, useState } from "react";

export default function OnlineStatusOverlay() {
    const [isOnline, setIsOnline] = useState(true);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Set initial status
        setIsOnline(navigator.onLine);

        // Add event listeners for online/offline status
        const handleOnline = () => {
            setIsOnline(true);
            setShowPrompt(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowPrompt(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Clean up
        return () => {
            window.removeEventListener(
                "online",
                handleOnline
            );
            window.removeEventListener(
                "offline",
                handleOffline
            );
        };
    }, []);

    const goToOfflinePage = () => {
        window.location.href = "/offline.html";
    };

    // Hide the prompt after showing for 5 seconds if user doesn't interact
    useEffect(() => {
        if (!showPrompt) return;

        const timer = setTimeout(() => {
            setShowPrompt(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, [showPrompt]);

    return (
        <>
            {/* Status Indicator */}
            <div className="fixed bottom-4 left-4 z-40 flex items-center">
                <div
                    className={`h-3 w-3 rounded-full mr-2 animate-pulse ${
                        isOnline
                            ? "bg-green-500"
                            : "bg-red-500"
                    }`}
                />
                <span
                    className={`text-sm font-medium ${
                        isOnline
                            ? "text-green-500"
                            : "text-red-500"
                    }`}
                >
                    {isOnline ? "" : "Offline"}
                </span>
            </div>

            {/* Offline Prompt */}
            {showPrompt && (
                <div className="fixed bottom-16 inset-x-0 mx-auto w-[90%] max-w-md z-40">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-red-300 dark:border-red-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-red-500 mr-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="font-medium">
                                    You are offline
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    setShowPrompt(false)
                                }
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Would you like to go to the
                            offline page?
                        </p>
                        <div className="mt-3 flex justify-end space-x-2">
                            <button
                                onClick={() =>
                                    setShowPrompt(false)
                                }
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={goToOfflinePage}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Go to offline page
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
