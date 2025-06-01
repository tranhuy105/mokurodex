"use client";

import { ankiConnect } from "@/lib/anki-connect";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface LogEntry {
    message: string;
    type: "info" | "success" | "warning" | "error";
    timestamp: string;
}

interface ProxyConfig {
    name: string;
    url: string;
}

export default function AnkiConnectDebugOverlay() {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [ankiStatus, setAnkiStatus] = useState({
        connected: false,
        version: null as number | null,
        error: null as string | null,
    });
    const [deckList, setDeckList] = useState<string[]>([]);
    const [modelList, setModelList] = useState<string[]>(
        []
    );
    const [proxyStatus, setProxyStatus] = useState({
        enabled: false,
        url: "",
    });
    const [customUrl, setCustomUrl] = useState("");
    const [isTestingCustomUrl, setIsTestingCustomUrl] =
        useState(false);

    // Add log function
    const addLog = (
        message: string,
        type:
            | "info"
            | "success"
            | "warning"
            | "error" = "info"
    ) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [
            ...prev.slice(-20), // Keep only last 20 logs
            {
                message,
                type,
                timestamp,
            },
        ]);
    };

    // Check Anki Connect Status
    const checkAnkiConnectStatus = async () => {
        try {
            addLog(
                "Checking AnkiConnect status...",
                "info"
            );
            const version = await ankiConnect(
                "version",
                {}
            );
            setAnkiStatus({
                connected: true,
                version,
                error: null,
            });
            addLog(
                `AnkiConnect connected (v${version})`,
                "success"
            );
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);
            setAnkiStatus({
                connected: false,
                version: null,
                error: errorMessage,
            });
            addLog(
                `AnkiConnect error: ${errorMessage}`,
                "error"
            );
            return false;
        }
    };

    // Get decks list
    const getDecks = async () => {
        try {
            addLog("Fetching deck list...", "info");
            const decks = await ankiConnect(
                "deckNames",
                {}
            );
            setDeckList(decks || []);
            addLog(
                `Found ${decks.length} decks`,
                "success"
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);
            addLog(
                `Failed to fetch decks: ${errorMessage}`,
                "error"
            );
        }
    };

    // Get note types list
    const getModels = async () => {
        try {
            addLog("Fetching note types...", "info");
            const models = await ankiConnect(
                "modelNames",
                {}
            );
            setModelList(models || []);
            addLog(
                `Found ${models.length} note types`,
                "success"
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);
            addLog(
                `Failed to fetch note types: ${errorMessage}`,
                "error"
            );
        }
    };

    // Check proxy status
    const checkProxyStatus = () => {
        // Check if we're on mobile
        const isMobile =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            );

        // Get the current AnkiConnect URL
        const ankiUrl = `https://${window.location.hostname}:8877`;

        setProxyStatus({
            enabled: isMobile,
            url: ankiUrl,
        });

        addLog(
            `Proxy ${
                isMobile ? "enabled" : "disabled"
            }: ${ankiUrl}`,
            isMobile ? "warning" : "info"
        );
    };

    // Test creating a simple card
    const testCreateCard = async () => {
        try {
            if (deckList.length === 0) {
                addLog("No decks available", "error");
                return;
            }

            addLog("Testing card creation...", "info");

            const result = await ankiConnect("addNote", {
                note: {
                    deckName: deckList[0],
                    modelName: "Basic",
                    fields: {
                        Front: "AnkiConnect Test Card",
                        Back: `Test from ${
                            window.location.hostname
                        } at ${new Date().toLocaleString()}`,
                    },
                    options: {
                        allowDuplicate: true,
                    },
                    tags: ["ankiconnect_test"],
                },
            });

            addLog(
                `Test card created! ID: ${result}`,
                "success"
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);
            addLog(
                `Card creation failed: ${errorMessage}`,
                "error"
            );
        }
    };

    // Test custom AnkiConnect URL
    const testCustomUrl = async () => {
        if (!customUrl) {
            toast.error("Please enter a custom URL");
            return;
        }

        setIsTestingCustomUrl(true);
        addLog(`Testing custom URL: ${customUrl}`, "info");

        try {
            // Direct fetch to test connection
            const response = await fetch(customUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(typeof window !== "undefined" && {
                        Origin: window.location.origin,
                    }),
                },
                body: JSON.stringify({
                    action: "version",
                    version: 6,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `HTTP ${response.status}: ${errorText}`
                );
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            addLog(
                `Connection successful! Version: ${data.result}`,
                "success"
            );
            toast.success(
                "Custom URL connection successful!"
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : String(error);

            console.log(error);
            addLog(
                `Connection failed: ${errorMessage}`,
                "error"
            );
            toast.error(
                `Connection failed: ${errorMessage}`
            );
        } finally {
            setIsTestingCustomUrl(false);
        }
    };

    // Test different proxy configurations
    const testProxyConfigurations = async () => {
        addLog(
            "Testing different proxy configurations...",
            "info"
        );

        const configs: ProxyConfig[] = [
            {
                name: "Default localhost",
                url: "http://localhost:8765",
            },
            {
                name: "IP address",
                url: "http://127.0.0.1:8765",
            },
            {
                name: "Current hostname",
                url: `http://${window.location.hostname}:8765`,
            },
            {
                name: "No protocol",
                url: "//localhost:8765",
            },
        ];

        let successfulConfig: ProxyConfig | null = null;

        for (const config of configs) {
            addLog(
                `Testing ${config.name}: ${config.url}`,
                "info"
            );

            try {
                const response = await fetch(config.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Origin: window.location.origin,
                    },
                    body: JSON.stringify({
                        action: "version",
                        version: 6,
                    }),
                });

                if (!response.ok) {
                    addLog(
                        `${config.name} failed: HTTP ${response.status}`,
                        "error"
                    );
                    continue;
                }

                const data = await response.json();

                if (data.error) {
                    addLog(
                        `${config.name} failed: ${data.error}`,
                        "error"
                    );
                    continue;
                }

                addLog(
                    `${config.name} successful! Version: ${data.result}`,
                    "success"
                );
                successfulConfig = config;
                break;
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : String(error);
                addLog(
                    `${config.name} failed: ${errorMessage}`,
                    "error"
                );
            }
        }

        if (successfulConfig) {
            toast.success(
                `Found working configuration: ${successfulConfig.name}`
            );
            if (
                confirm(
                    `Would you like to save "${successfulConfig.url}" as your AnkiConnect URL?`
                )
            ) {
                localStorage.setItem(
                    "ankiConnectCustomUrl",
                    successfulConfig.url
                );
                setCustomUrl(successfulConfig.url);
                toast.success("URL saved!");
            }
        } else {
            toast.error("No working configuration found");
        }
    };

    // Initial checks
    useEffect(() => {
        if (isVisible) {
            checkProxyStatus();
            checkAnkiConnectStatus().then((connected) => {
                if (connected) {
                    getDecks();
                    getModels();
                }
            });

            // Check if we have a saved custom URL
            const savedUrl = localStorage.getItem(
                "ankiConnectCustomUrl"
            );
            if (savedUrl) {
                setCustomUrl(savedUrl);
                addLog(
                    `Found saved AnkiConnect URL: ${savedUrl}`,
                    "info"
                );
            }
        }
    }, [isVisible]);

    const getStatusColor = (
        type: "info" | "success" | "warning" | "error"
    ) => {
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
                className="fixed bottom-4 left-4 z-50 bg-yellow-600 text-white p-3 rounded-full shadow-lg text-sm font-bold"
                style={{ fontSize: "12px" }}
            >
                🃏
            </button>

            {/* Debug Overlay */}
            {isVisible && (
                <div className="bg-black fixed inset-0 bg-opacity-80 z-50 no-scrollbar">
                    <div className="bg-white text-black m-2 rounded-lg p-4 max-h-screen overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">
                                AnkiConnect Debug
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
                                onClick={
                                    checkAnkiConnectStatus
                                }
                                className="bg-blue-500 text-white p-2 rounded text-sm"
                            >
                                Check Connection
                            </button>
                            <button
                                onClick={getDecks}
                                className="bg-green-500 text-white p-2 rounded text-sm"
                                disabled={
                                    !ankiStatus.connected
                                }
                            >
                                Get Decks
                            </button>
                            <button
                                onClick={getModels}
                                className="bg-purple-500 text-white p-2 rounded text-sm"
                                disabled={
                                    !ankiStatus.connected
                                }
                            >
                                Get Note Types
                            </button>
                            <button
                                onClick={testCreateCard}
                                className="bg-yellow-500 text-white p-2 rounded text-sm"
                                disabled={
                                    !ankiStatus.connected ||
                                    deckList.length === 0
                                }
                            >
                                Test Card
                            </button>
                        </div>

                        {/* AnkiConnect Status */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                AnkiConnect Status
                            </h3>
                            <div className="text-sm space-y-1">
                                <div>
                                    Connected:{" "}
                                    {ankiStatus.connected
                                        ? "✅"
                                        : "❌"}
                                </div>
                                {ankiStatus.version && (
                                    <div>
                                        Version:{" "}
                                        {ankiStatus.version}
                                    </div>
                                )}
                                {ankiStatus.error && (
                                    <div className="text-red-600">
                                        Error:{" "}
                                        {ankiStatus.error}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proxy Status */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Proxy Configuration
                            </h3>
                            <div className="text-sm space-y-1">
                                <div>
                                    Mobile Device:{" "}
                                    {proxyStatus.enabled
                                        ? "Yes"
                                        : "No"}
                                </div>
                                <div>
                                    AnkiConnect URL:{" "}
                                    {proxyStatus.url}
                                </div>
                                {proxyStatus.enabled && (
                                    <div className="text-yellow-600">
                                        Using proxy mode -
                                        ensure your PC is
                                        running a proxy
                                        server on port 8765
                                    </div>
                                )}
                                <button
                                    onClick={
                                        testProxyConfigurations
                                    }
                                    className="mt-2 bg-orange-500 text-white p-2 rounded text-sm w-full"
                                >
                                    Test All Proxy
                                    Configurations
                                </button>
                            </div>
                        </div>

                        {/* Custom URL Test */}
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">
                                Test Custom AnkiConnect URL
                            </h3>
                            <div className="text-sm space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={customUrl}
                                        onChange={(e) =>
                                            setCustomUrl(
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder="https://192.168.0.50:8877"
                                        className="flex-1 p-2 border rounded text-sm"
                                    />
                                    <button
                                        onClick={
                                            testCustomUrl
                                        }
                                        disabled={
                                            isTestingCustomUrl ||
                                            !customUrl
                                        }
                                        className="bg-blue-500 text-white p-2 rounded text-sm whitespace-nowrap"
                                    >
                                        {isTestingCustomUrl
                                            ? "Testing..."
                                            : "Test URL"}
                                    </button>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Enter your PC&apos;s IP
                                    address with port 8765
                                    (e.g.,
                                    http://192.168.1.100:8765)
                                </div>
                            </div>
                        </div>

                        {/* Deck List */}
                        {deckList.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-100 rounded">
                                <h3 className="font-bold mb-2">
                                    Available Decks (
                                    {deckList.length})
                                </h3>
                                <div className="text-xs space-y-1 max-h-20 overflow-auto">
                                    {deckList.map(
                                        (deck, index) => (
                                            <div
                                                key={index}
                                            >
                                                {deck}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Note Types */}
                        {modelList.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-100 rounded">
                                <h3 className="font-bold mb-2">
                                    Note Types (
                                    {modelList.length})
                                </h3>
                                <div className="text-xs space-y-1 max-h-20 overflow-auto">
                                    {modelList.map(
                                        (model, index) => (
                                            <div
                                                key={index}
                                            >
                                                {model}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

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
