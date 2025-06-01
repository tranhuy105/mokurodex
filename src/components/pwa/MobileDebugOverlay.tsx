"use client";

import { useEffect, useState } from "react";

export default function MobileDebugOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState([]);
    const [swStatus, setSWStatus] = useState({});
    const [cacheStatus, setCacheStatus] = useState({});
    const [networkInfo, setNetworkInfo] = useState({});

    // Add log function
    const addLog = (message: string, type = "info") => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [
            ...prev.slice(-20),
            {
                // Keep only last 20 logs
                message,
                type,
                timestamp,
            },
        ]);
    };

    // Check Service Worker Status
    const checkSWStatus = async () => {
        try {
            if (!("serviceWorker" in navigator)) {
                setSWStatus({ supported: false });
                addLog(
                    "Service Worker not supported",
                    "error"
                );
                return;
            }

            const registration =
                await navigator.serviceWorker.getRegistration();
            const controller =
                navigator.serviceWorker.controller;

            setSWStatus({
                supported: true,
                registered: !!registration,
                active: !!registration?.active,
                waiting: !!registration?.waiting,
                installing: !!registration?.installing,
                controller: !!controller,
                scope:
                    registration?.scope || "Not registered",
                updateViaCache:
                    registration?.updateViaCache ||
                    "Not available",
            });

            addLog(
                `SW Status: ${
                    registration
                        ? "Registered"
                        : "Not registered"
                }`,
                registration ? "success" : "error"
            );
        } catch (error) {
            addLog(
                `SW Check Error: ${error.message}`,
                "error"
            );
            setSWStatus({ error: error.message });
        }
    };

    // Check Cache Status
    const checkCacheStatus = async () => {
        try {
            if (!("caches" in window)) {
                setCacheStatus({ supported: false });
                addLog("Cache API not supported", "error");
                return;
            }

            const cacheNames = await caches.keys();
            const cacheDetails = {};

            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                cacheDetails[cacheName] = keys.length;
            }

            setCacheStatus({
                supported: true,
                caches: cacheNames,
                details: cacheDetails,
                totalCaches: cacheNames.length,
            });

            addLog(
                `Found ${cacheNames.length} cache(s)`,
                "success"
            );
        } catch (error) {
            addLog(
                `Cache Check Error: ${error.message}`,
                "error"
            );
            setCacheStatus({ error: error.message });
        }
    };

    // Check Network Info
    const checkNetworkInfo = () => {
        const info = {
            online: navigator.onLine,
            userAgent:
                navigator.userAgent.substring(0, 50) +
                "...",
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port || "default",
        };

        // Check connection API if available
        if ("connection" in navigator) {
            info.connection = {
                effectiveType:
                    navigator.connection.effectiveType ||
                    "unknown",
                downlink:
                    navigator.connection.downlink ||
                    "unknown",
                rtt: navigator.connection.rtt || "unknown",
            };
        }

        setNetworkInfo(info);
        addLog(
            `Network: ${
                info.online ? "Online" : "Offline"
            }`,
            info.online ? "success" : "error"
        );
    };

    // Test Service Worker Registration
    const testSWRegistration = async () => {
        addLog("Testing SW registration...", "info");

        try {
            const registration =
                await navigator.serviceWorker.register(
                    "/sw.js",
                    {
                        scope: "/",
                        updateViaCache: "none",
                    }
                );

            addLog(
                "SW registration successful!",
                "success"
            );
            await checkSWStatus();
        } catch (error) {
            addLog(
                `SW registration failed: ${error.message}`,
                "error"
            );
        }
    };

    // Clear all caches
    const clearAllCaches = async () => {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((name) =>
                    caches.delete(name)
                )
            );
            addLog(
                `Cleared ${cacheNames.length} cache(s)`,
                "success"
            );
            await checkCacheStatus();
        } catch (error) {
            addLog(
                `Clear cache error: ${error.message}`,
                "error"
            );
        }
    };

    // Force SW update
    const forceSWUpdate = async () => {
        try {
            const registration =
                await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
                addLog("SW update triggered", "success");
                await checkSWStatus();
            } else {
                addLog("No SW registration found", "error");
            }
        } catch (error) {
            addLog(
                `SW update error: ${error.message}`,
                "error"
            );
        }
    };

    // Initial checks
    useEffect(() => {
        checkSWStatus();
        checkCacheStatus();
        checkNetworkInfo();
    }, []);

    // Auto-refresh every 5 seconds when visible
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            checkSWStatus();
            checkCacheStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [isVisible]);

    const getStatusColor = (type) => {
        switch (type) {
            case "success":
                return "text-green-600";
            case "error":
                return "text-red-600";
            case "warning":
                return "text-yellow-600";
            default:
                return "text-blue-600";
        }
    };

    return (
        <>
            {/* Debug Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg text-sm font-bold"
                style={{ fontSize: "12px" }}
            >
                🔧
            </button>

            {/* Debug Overlay */}
            {isVisible && (
                <div className="bg-black fixed inset-0 bg-opacity-80 z-50 no-scrollbar">
                    <div className="bg-white text-black m-2 rounded-lg p-4 max-h-screen overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">
                                Mobile SW Debug
                            </h2>
                            <button
                                onClick={() =>
                                    setIsVisible(false)
                                }
                                className="text-red-600 font-bold text-xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={testSWRegistration}
                                className="bg-blue-500 text-white p-2 rounded text-sm"
                            >
                                Register SW
                            </button>
                            <button
                                onClick={forceSWUpdate}
                                className="bg-green-500 text-white p-2 rounded text-sm"
                            >
                                Update SW
                            </button>
                            <button
                                onClick={clearAllCaches}
                                className="bg-red-500 text-white p-2 rounded text-sm"
                            >
                                Clear Cache
                            </button>
                            <button
                                onClick={() => {
                                    checkSWStatus();
                                    checkCacheStatus();
                                    checkNetworkInfo();
                                }}
                                className="bg-gray-500 text-white p-2 rounded text-sm"
                            >
                                Refresh All
                            </button>
                        </div>

                        {/* Service Worker Status */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Service Worker Status
                            </h3>
                            <div className="text-sm space-y-1">
                                <div>
                                    Supported:{" "}
                                    {swStatus.supported
                                        ? "✅"
                                        : "❌"}
                                </div>
                                <div>
                                    Registered:{" "}
                                    {swStatus.registered
                                        ? "✅"
                                        : "❌"}
                                </div>
                                <div>
                                    Active:{" "}
                                    {swStatus.active
                                        ? "✅"
                                        : "❌"}
                                </div>
                                <div>
                                    Controller:{" "}
                                    {swStatus.controller
                                        ? "✅"
                                        : "❌"}
                                </div>
                                {swStatus.scope && (
                                    <div>
                                        Scope:{" "}
                                        {swStatus.scope}
                                    </div>
                                )}
                                {swStatus.error && (
                                    <div className="text-red-600">
                                        Error:{" "}
                                        {swStatus.error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cache Status */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Cache Status
                            </h3>
                            <div className="text-sm space-y-1">
                                <div>
                                    Supported:{" "}
                                    {cacheStatus.supported
                                        ? "✅"
                                        : "❌"}
                                </div>
                                <div>
                                    Total Caches:{" "}
                                    {cacheStatus.totalCaches ||
                                        0}
                                </div>
                                {cacheStatus.caches && (
                                    <div>
                                        {cacheStatus.caches.map(
                                            (name) => (
                                                <div
                                                    key={
                                                        name
                                                    }
                                                    className="ml-2"
                                                >
                                                    {name}:{" "}
                                                    {cacheStatus
                                                        .details?.[
                                                        name
                                                    ] ||
                                                        0}{" "}
                                                    items
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                                {cacheStatus.error && (
                                    <div className="text-red-600">
                                        Error:{" "}
                                        {cacheStatus.error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Network Info */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Network Info
                            </h3>
                            <div className="text-sm space-y-1">
                                <div>
                                    Online:{" "}
                                    {networkInfo.online
                                        ? "✅"
                                        : "❌"}
                                </div>
                                <div>
                                    Protocol:{" "}
                                    {networkInfo.protocol}
                                </div>
                                <div>
                                    Host:{" "}
                                    {networkInfo.hostname}
                                </div>
                                {networkInfo.connection && (
                                    <>
                                        <div>
                                            Connection:{" "}
                                            {
                                                networkInfo
                                                    .connection
                                                    .effectiveType
                                            }
                                        </div>
                                        <div>
                                            Speed:{" "}
                                            {
                                                networkInfo
                                                    .connection
                                                    .downlink
                                            }
                                            Mbps
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Logs */}
                        <div className="p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Debug Logs
                            </h3>
                            <div className="text-xs space-y-1 max-h-40 overflow-auto">
                                {logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className={getStatusColor(
                                            log.type
                                        )}
                                    >
                                        <span className="text-gray-500">
                                            {log.timestamp}
                                        </span>{" "}
                                        - {log.message}
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-gray-500">
                                        No logs yet...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
