// public/sw.js
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("offline-cache").then((cache) => {
            return cache.addAll(["/offline.html", "/"]);
        })
    );
});

self.addEventListener("fetch", (event) => {
    // Only handle navigation requests (page loads)
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails, serve offline page
                return caches.match("/offline.html");
            })
        );
    }
});
