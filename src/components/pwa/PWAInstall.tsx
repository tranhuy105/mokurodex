"use client";

import { Button } from "@/components/ui/button";
import { Download, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
}

export function PWAInstall() {
    const [installPrompt, setInstallPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if the app is already installed
        if (
            window.matchMedia("(display-mode: standalone)")
                .matches
        ) {
            setIsInstalled(true);
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };

        // Listen for online/offline status
        const handleOnlineStatus = () => {
            setIsOffline(!navigator.onLine);
            if (!navigator.onLine) {
                toast.success(
                    "App is running in offline mode"
                );
            }
        };

        // Check initial online status
        setIsOffline(!navigator.onLine);

        // Add event listeners
        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );
        window.addEventListener(
            "online",
            handleOnlineStatus
        );
        window.addEventListener(
            "offline",
            handleOnlineStatus
        );

        // Clean up event listeners
        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
            window.removeEventListener(
                "online",
                handleOnlineStatus
            );
            window.removeEventListener(
                "offline",
                handleOnlineStatus
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) {
            toast.error("Installation not available");
            return;
        }

        // Show the install prompt
        await installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await installPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            toast.success("App installed successfully!");
            setIsInstalled(true);
        } else {
            toast.error("App installation was canceled");
        }

        // Clear the saved prompt since it can't be used again
        setInstallPrompt(null);
    };

    if (isInstalled) {
        return null;
    }

    return (
        <>
            {isOffline && (
                <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 z-50">
                    <WifiOff size={16} />
                    <span>Offline Mode</span>
                </div>
            )}

            {installPrompt && (
                <Button
                    onClick={handleInstallClick}
                    variant="outline"
                    size="sm"
                    className="fixed bottom-4 left-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg z-50 flex items-center gap-2"
                >
                    <Download size={16} />
                    <span>Install App</span>
                </Button>
            )}
        </>
    );
}
