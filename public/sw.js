// public/sw.js - Mobile-Optimized Service Worker
const CACHE_NAME = "mokurodex-cache-v4"; // Increment version
const OFFLINE_URL = "/offline.html";

// Reduced static assets for mobile optimization
const STATIC_ASSETS = [
    OFFLINE_URL,
    "/offline.css",
    "/offline.js",
    "/favicon-32x32.png", // Keep only essential icons
    "/apple-touch-icon.png",
    "/android-chrome-192x192.png",
    "/site.webmanifest",
    "/logo.png",
];

// Enhanced logging for mobile debugging
function log(message, ...args) {
    console.log(`[SW] ${message}`, ...args);
}

function logError(message, error) {
    console.error(`[SW] ${message}`, error);
}

// Install event with better error handling
self.addEventListener("install", (event) => {
    log("Installing service worker...");

    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                log(`Opened cache: ${CACHE_NAME}`);

                // Cache assets one by one with individual error handling
                const cachePromises = STATIC_ASSETS.map(
                    async (url) => {
                        try {
                            log(
                                `Attempting to cache: ${url}`
                            );

                            const response = await fetch(
                                url,
                                {
                                    cache: "no-store",
                                    credentials:
                                        "same-origin",
                                    // Add timeout for mobile networks
                                    signal: AbortSignal.timeout
                                        ? AbortSignal.timeout(
                                              10000
                                          )
                                        : undefined,
                                }
                            );

                            if (!response.ok) {
                                throw new Error(
                                    `HTTP ${response.status}: ${response.statusText}`
                                );
                            }

                            await cache.put(url, response);
                            log(
                                `Successfully cached: ${url}`
                            );
                        } catch (error) {
                            logError(
                                `Failed to cache ${url}:`,
                                error
                            );
                            // Don't fail the entire installation for one asset
                        }
                    }
                );

                await Promise.allSettled(cachePromises);
                log("Installation completed");

                // Force immediate activation
                return self.skipWaiting();
            } catch (error) {
                logError("Installation failed:", error);
                throw error;
            }
        })()
    );
});

// Activate event with enhanced cleanup
self.addEventListener("activate", (event) => {
    log("Activating service worker...");

    event.waitUntil(
        (async () => {
            try {
                // Take control immediately
                await self.clients.claim();
                log("Claimed all clients");

                // Clean up old caches
                const cacheKeys = await caches.keys();
                log("Existing caches:", cacheKeys);

                const deletionPromises = cacheKeys
                    .filter((key) => key !== CACHE_NAME)
                    .map(async (key) => {
                        log(`Deleting old cache: ${key}`);
                        return caches.delete(key);
                    });

                await Promise.all(deletionPromises);
                log("Activation completed");
            } catch (error) {
                logError("Activation failed:", error);
            }
        })()
    );
});

// Simplified network-first strategy with mobile optimizations
async function networkFirst(request) {
    const url = new URL(request.url);
    log(`Network-first request: ${url.pathname}`);

    try {
        // Shorter timeout for mobile networks
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            5000
        );

        const networkResponse = await fetch(request, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (
            networkResponse.ok &&
            networkResponse.status !== 206
        ) {
            // Cache successful responses
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(
                    request,
                    networkResponse.clone()
                );
                log(`Cached response for: ${url.pathname}`);
            } catch (cacheError) {
                logError(
                    `Failed to cache ${url.pathname}:`,
                    cacheError
                );
            }
        }

        return networkResponse;
    } catch (networkError) {
        log(
            `Network failed for ${url.pathname}, trying cache...`
        );

        // Try cache fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            log(`Serving from cache: ${url.pathname}`);
            return cachedResponse;
        }

        // Final fallback
        if (request.mode === "navigate") {
            log(
                "Serving offline page for navigation request"
            );
            return (
                caches.match(OFFLINE_URL) ||
                new Response("Offline", { status: 503 })
            );
        }

        throw networkError;
    }
}

// Simplified cache-first strategy
async function cacheFirst(request) {
    const url = new URL(request.url);
    log(`Cache-first request: ${url.pathname}`);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        log(`Served from cache: ${url.pathname}`);
        return cachedResponse;
    }

    log(
        `Cache miss for ${url.pathname}, trying network...`
    );
    return networkFirst(request);
}

// Simplified exclusion check
function shouldExcludeFromCache(url) {
    const excludePatterns = [
        "/_next/static/chunks/",
        "/_next/image",
        "/_next/data/",
        "/uploads/",
        "/api/",
    ];

    return excludePatterns.some((pattern) =>
        url.pathname.includes(pattern)
    );
}

// Main fetch handler with simplified logic
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and excluded URLs
    if (
        event.request.method !== "GET" ||
        url.origin !== self.location.origin ||
        shouldExcludeFromCache(url)
    ) {
        return;
    }

    log(`Handling fetch: ${url.pathname}`);

    // Handle different request types
    if (
        STATIC_ASSETS.includes(url.pathname) ||
        url.pathname === "/" ||
        url.pathname.match(
            /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/
        )
    ) {
        // Static assets: cache-first
        event.respondWith(cacheFirst(event.request));
    } else if (event.request.mode === "navigate") {
        // Navigation: network-first
        event.respondWith(networkFirst(event.request));
    } else {
        // Other requests: network-first
        event.respondWith(networkFirst(event.request));
    }
});

// Enhanced message handling
self.addEventListener("message", (event) => {
    log("Received message:", event.data);

    if (
        event.data === "SKIP_WAITING" ||
        event.data?.type === "SKIP_WAITING"
    ) {
        log("Skipping waiting...");
        self.skipWaiting();
    }
});

// Error handling
self.addEventListener("error", (event) => {
    logError("Service Worker Error:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
    logError("Unhandled Promise Rejection:", event.reason);
});

log("Service Worker script loaded");
