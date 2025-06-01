"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        // Early return checks with detailed logging
        if (typeof window === "undefined") {
            console.log(
                "[SW] Window is undefined - running on server"
            );
            return;
        }

        if (!("serviceWorker" in navigator)) {
            console.log(
                "[SW] Service Worker not supported in this browser"
            );
            console.log(
                "[SW] User Agent:",
                (navigator as Navigator).userAgent
            );
            return;
        }

        console.log("[SW] Service Worker is supported");
        console.log(
            "[SW] User Agent:",
            (navigator as Navigator).userAgent
        );
        console.log("[SW] Location:", window.location.href);

        const registerSW = async () => {
            try {
                console.log(
                    "[SW] Attempting to register service worker..."
                );

                // Check if we're on HTTPS or localhost
                const isSecure =
                    location.protocol === "https:" ||
                    location.hostname === "localhost" ||
                    location.hostname === "127.0.0.1";

                if (!isSecure) {
                    console.error(
                        "[SW] Service Workers require HTTPS or localhost"
                    );
                    return;
                }

                // Attempt registration with more detailed error handling
                const registration =
                    await navigator.serviceWorker.register(
                        "/sw.js",
                        {
                            scope: "/",
                            updateViaCache: "none", // Ensure fresh SW checks
                        }
                    );

                console.log(
                    "[SW] Registration successful!"
                );
                console.log(
                    "[SW] Scope:",
                    registration.scope
                );
                console.log(
                    "[SW] Installing:",
                    registration.installing
                );
                console.log(
                    "[SW] Waiting:",
                    registration.waiting
                );
                console.log(
                    "[SW] Active:",
                    registration.active
                );

                // Check for immediate updates
                await registration.update();
                console.log("[SW] Update check completed");

                // Enhanced update detection
                registration.addEventListener(
                    "updatefound",
                    () => {
                        console.log("[SW] Update found!");
                        const installingWorker =
                            registration.installing;

                        if (!installingWorker) {
                            console.log(
                                "[SW] No installing worker found"
                            );
                            return;
                        }

                        console.log(
                            "[SW] Installing worker state:",
                            installingWorker.state
                        );

                        installingWorker.addEventListener(
                            "statechange",
                            () => {
                                console.log(
                                    "[SW] Installing worker state changed to:",
                                    installingWorker.state
                                );

                                if (
                                    installingWorker.state ===
                                    "installed"
                                ) {
                                    if (
                                        navigator
                                            .serviceWorker
                                            .controller
                                    ) {
                                        console.log(
                                            "[SW] New content is available; please refresh."
                                        );
                                        window.dispatchEvent(
                                            new CustomEvent(
                                                "swUpdate",
                                                {
                                                    detail: registration,
                                                }
                                            )
                                        );
                                    } else {
                                        console.log(
                                            "[SW] Content is cached for offline use."
                                        );
                                    }
                                }
                            }
                        );
                    }
                );

                // Handle controller changes
                let refreshing = false;
                navigator.serviceWorker.addEventListener(
                    "controllerchange",
                    () => {
                        console.log(
                            "[SW] Controller changed"
                        );
                        if (!refreshing) {
                            console.log(
                                "[SW] Reloading page due to controller change"
                            );
                            refreshing = true;
                            window.location.reload();
                        }
                    }
                );

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener(
                    "message",
                    (event) => {
                        console.log(
                            "[SW] Message from service worker:",
                            event.data
                        );
                    }
                );

                // Check current service worker state
                if (registration.active) {
                    console.log(
                        "[SW] Active service worker found"
                    );
                    console.log(
                        "[SW] Active worker script URL:",
                        registration.active.scriptURL
                    );
                } else {
                    console.log(
                        "[SW] No active service worker"
                    );
                }
            } catch (error) {
                console.error(
                    "[SW] Registration failed:",
                    error
                );
                console.error(
                    "[SW] Error name:",
                    (error as Error).name
                );
                console.error(
                    "[SW] Error message:",
                    (error as Error).message
                );

                // Additional debugging for mobile
                if (
                    (error as Error).name ===
                    "SecurityError"
                ) {
                    console.error(
                        "[SW] Security Error - check HTTPS and domain"
                    );
                } else if (
                    (error as Error).name === "TypeError"
                ) {
                    console.error(
                        "[SW] Type Error - check service worker file exists"
                    );
                }
            }
        };

        // Register immediately and on load
        registerSW();

        const handleLoad = () => {
            console.log(
                "[SW] Window loaded, registering service worker"
            );
            registerSW();
        };

        window.addEventListener("load", handleLoad);

        // Additional mobile-specific debugging
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log(
                    "[SW] Page became visible, checking service worker"
                );
                if (
                    "serviceWorker" in navigator &&
                    navigator.serviceWorker.controller
                ) {
                    console.log(
                        "[SW] Service worker is active"
                    );
                } else {
                    console.log(
                        "[SW] No active service worker, attempting registration"
                    );
                    registerSW();
                }
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {
            window.removeEventListener("load", handleLoad);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    return null;
}
