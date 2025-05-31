// Offline SPA JavaScript - Fixed Version
const STORES = {
    DOWNLOADS: "downloads",
    HTML: "html",
};

const DB_NAME = "mokurodex-offline";
const DB_VERSION = 3;

// State management
const state = {
    currentView: "library",
    currentContent: null,
    offlineContent: [],
    isLoading: true,
    isOnline: navigator.onLine,
    debugInfo: [],
};

// DOM Elements
const elements = {
    libraryButton: document.getElementById(
        "library-button"
    ),
    mangaButton: document.getElementById("manga-button"),
    novelsButton: document.getElementById("novels-button"),
    loading: document.getElementById("loading"),
    noContent: document.getElementById("no-content"),
    contentLibrary: document.getElementById(
        "content-library"
    ),
    readerContainer: document.getElementById(
        "reader-container"
    ),
    debugInfo: document.getElementById("debug-info"),
    debugDetails: document.getElementById("debug-details"),
    debugToggle: document.getElementById("debug-toggle"),
};

// Debug logging
function addDebugInfo(message) {
    console.log(message);
    state.debugInfo.push(
        `${new Date().toLocaleTimeString()}: ${message}`
    );
    updateDebugDisplay();
}

function updateDebugDisplay() {
    if (elements.debugDetails) {
        elements.debugDetails.innerHTML = state.debugInfo
            .map((info) => `<div>${info}</div>`)
            .join("");
    }
}

// Helper function to open IndexedDB - Fixed version
function openOfflineDB() {
    return new Promise((resolve, reject) => {
        addDebugInfo("Attempting to open IndexedDB");

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            const error = `IndexedDB error: ${event.target.error}`;
            addDebugInfo(error);
            reject(new Error(error));
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            addDebugInfo(
                `IndexedDB opened successfully. Stores: ${Array.from(
                    db.objectStoreNames
                ).join(", ")}`
            );

            // Create a simpler wrapper that directly uses the native IDB API
            const dbWrapper = {
                db: db,
                objectStoreNames: db.objectStoreNames,

                async get(storeName, key) {
                    return new Promise(
                        (resolve, reject) => {
                            try {
                                const tx = db.transaction(
                                    storeName,
                                    "readonly"
                                );
                                const store =
                                    tx.objectStore(
                                        storeName
                                    );
                                const request =
                                    store.get(key);

                                request.onsuccess = () =>
                                    resolve(request.result);
                                request.onerror = () =>
                                    reject(request.error);
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                },

                async getAll(storeName) {
                    return new Promise(
                        (resolve, reject) => {
                            try {
                                const tx = db.transaction(
                                    storeName,
                                    "readonly"
                                );
                                const store =
                                    tx.objectStore(
                                        storeName
                                    );
                                const request =
                                    store.getAll();

                                request.onsuccess = () => {
                                    addDebugInfo(
                                        `getAll from ${storeName}: found ${request.result.length} items`
                                    );
                                    resolve(request.result);
                                };
                                request.onerror = () => {
                                    addDebugInfo(
                                        `getAll error from ${storeName}: ${request.error}`
                                    );
                                    reject(request.error);
                                };
                            } catch (error) {
                                addDebugInfo(
                                    `getAll exception from ${storeName}: ${error.message}`
                                );
                                reject(error);
                            }
                        }
                    );
                },

                close() {
                    db.close();
                },
            };

            resolve(dbWrapper);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            addDebugInfo(
                "Database upgrade needed, creating stores"
            );

            // Create object stores if they don't exist
            if (
                !db.objectStoreNames.contains(
                    STORES.DOWNLOADS
                )
            ) {
                db.createObjectStore(STORES.DOWNLOADS, {
                    keyPath: "id",
                });
                addDebugInfo("Created downloads store");
            }

            if (
                !db.objectStoreNames.contains(STORES.HTML)
            ) {
                db.createObjectStore(STORES.HTML, {
                    keyPath: "id",
                });
                addDebugInfo("Created html store");
            }
        };

        request.onblocked = () => {
            addDebugInfo(
                "IndexedDB blocked - another connection is preventing upgrade"
            );
        };
    });
}

// Initialize the app
async function initApp() {
    try {
        addDebugInfo("Initializing app");

        // Open IndexedDB
        const db = await openOfflineDB();
        addDebugInfo("Database opened successfully");

        // Load offline content
        await loadOfflineContent(db);

        // Setup event listeners
        setupEventListeners();

        // Render the initial view
        renderView();

        addDebugInfo("App initialization complete");
    } catch (error) {
        const errorMsg = `Failed to initialize offline app: ${error.message}`;
        addDebugInfo(errorMsg);
        console.error(errorMsg, error);
        showError(
            "Failed to load offline content. Please try refreshing the page."
        );
    }
}

// Load offline content from IndexedDB
async function loadOfflineContent(db) {
    try {
        addDebugInfo("Loading offline content");

        // Check if the downloads store exists
        if (
            !db.objectStoreNames.contains(STORES.DOWNLOADS)
        ) {
            addDebugInfo("Downloads store not found");
            state.offlineContent = [];
            state.isLoading = false;
            return;
        }

        // Get all downloads
        const allDownloads = await db.getAll(
            STORES.DOWNLOADS
        );
        addDebugInfo(
            `Found ${allDownloads.length} downloads`
        );

        // Convert dates from strings to Date objects and log each item
        const processedDownloads = allDownloads.map(
            (download, index) => {
                addDebugInfo(
                    `Download ${index + 1}: ${
                        download.contentTitle
                    } - ${download.volumeTitle}`
                );
                return {
                    ...download,
                    downloadDate: new Date(
                        download.downloadDate
                    ),
                };
            }
        );

        state.offlineContent = processedDownloads;
        state.isLoading = false;

        addDebugInfo(
            `Loaded ${processedDownloads.length} offline content items`
        );
    } catch (error) {
        const errorMsg = `Error loading offline content: ${error.message}`;
        addDebugInfo(errorMsg);
        console.error(errorMsg, error);
        state.isLoading = false;
        state.offlineContent = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    elements.libraryButton.addEventListener("click", () => {
        state.currentView = "library";
        state.currentContent = null;
        updateNavButtons();
        renderView();
    });

    elements.mangaButton.addEventListener("click", () => {
        state.currentView = "manga";
        state.currentContent = null;
        updateNavButtons();
        renderView();
    });

    elements.novelsButton.addEventListener("click", () => {
        state.currentView = "novels";
        state.currentContent = null;
        updateNavButtons();
        renderView();
    });

    // Check connection button
    const checkConnectionBtn = document.getElementById(
        "check-connection"
    );
    if (checkConnectionBtn) {
        checkConnectionBtn.addEventListener(
            "click",
            checkConnection
        );
    }

    // Online/offline status changes
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
}

// Update navigation button states
function updateNavButtons() {
    elements.libraryButton.classList.toggle(
        "active",
        state.currentView === "library"
    );
    elements.mangaButton.classList.toggle(
        "active",
        state.currentView === "manga"
    );
    elements.novelsButton.classList.toggle(
        "active",
        state.currentView === "novels"
    );
}

// Render the current view
function renderView() {
    addDebugInfo(
        `Rendering view: ${state.currentView}, loading: ${state.isLoading}, content count: ${state.offlineContent.length}`
    );

    // Show/hide elements based on state
    elements.loading.style.display = state.isLoading
        ? "flex"
        : "none";

    if (!state.isLoading) {
        if (state.currentContent) {
            // Show reader view
            elements.contentLibrary.style.display = "none";
            elements.noContent.style.display = "none";
            elements.readerContainer.style.display =
                "block";
            renderReader();
        } else {
            // Show library view
            elements.readerContainer.style.display = "none";
            elements.contentLibrary.style.display = "grid";

            if (state.offlineContent.length === 0) {
                elements.noContent.style.display = "flex";
                elements.contentLibrary.style.display =
                    "none";
                addDebugInfo("Showing no content message");
            } else {
                elements.noContent.style.display = "none";
                renderContentLibrary();
            }
        }
    }
}

// Render content library
function renderContentLibrary() {
    const filteredContent =
        state.currentView === "library"
            ? state.offlineContent
            : state.offlineContent.filter(
                  (item) =>
                      item.contentType ===
                      (state.currentView === "manga"
                          ? "manga"
                          : "lightnovel")
              );

    addDebugInfo(
        `Rendering library with ${filteredContent.length} filtered items`
    );

    elements.contentLibrary.innerHTML = "";

    if (filteredContent.length === 0) {
        elements.noContent.style.display = "flex";
        elements.contentLibrary.style.display = "none";
        return;
    }

    filteredContent.forEach((item) => {
        const card = document.createElement("div");
        card.className = "content-card";
        card.onclick = () => openContent(item);

        // Create placeholder cover
        const coverBg = document.createElement("div");
        coverBg.className = "content-cover";
        coverBg.style.backgroundColor = getRandomColor(
            item.contentId
        );
        coverBg.textContent =
            item.contentType === "manga" ? "📚" : "📖";

        // Add content info
        const info = document.createElement("div");
        info.className = "content-info";

        const title = document.createElement("h3");
        title.className = "content-title";
        title.textContent =
            item.volumeTitle ||
            `Volume ${item.volumeNumber}`;

        const subtitle = document.createElement("p");
        subtitle.className = "content-subtitle";
        subtitle.textContent = item.contentTitle;

        const type = document.createElement("span");
        type.className = "content-type";
        type.textContent =
            item.contentType === "manga"
                ? "Manga"
                : "Light Novel";

        info.appendChild(title);
        info.appendChild(subtitle);
        info.appendChild(type);

        card.appendChild(coverBg);
        card.appendChild(info);
        elements.contentLibrary.appendChild(card);
    });
}

// Generate a random pastel color based on content ID
function getRandomColor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
}

// Open content for reading
async function openContent(content) {
    state.currentContent = content;
    addDebugInfo(
        `Opening content: ${content.contentTitle}`
    );

    // Show loading state
    elements.loading.style.display = "flex";
    elements.contentLibrary.style.display = "none";
    elements.noContent.style.display = "none";
    elements.readerContainer.style.display = "none";

    try {
        // Try to get the HTML content
        const db = await openOfflineDB();
        if (db.objectStoreNames.contains(STORES.HTML)) {
            try {
                const htmlContent = await db.get(
                    STORES.HTML,
                    content.volumeId
                );
                if (htmlContent && htmlContent.html) {
                    // We have HTML content, render it
                    await renderHTMLContent(
                        htmlContent.html
                    );
                    return;
                }
            } catch (error) {
                addDebugInfo(
                    `Error loading HTML content: ${error.message}`
                );
            }
        }

        // No HTML content available
        addDebugInfo(
            "No HTML content available for this volume"
        );
        showError("Content is not available offline");

        // Reset to library view
        state.currentContent = null;
        renderView();
    } catch (error) {
        addDebugInfo(
            `Error opening content: ${error.message}`
        );
        console.error("Error opening content:", error);
        showError(
            "Failed to open content. Please try again."
        );

        // Reset to library view
        state.currentContent = null;
        renderView();
    }
}

// Render pre-processed HTML content
async function renderHTMLContent(html) {
    elements.readerContainer.innerHTML = `
        <button class="back-button" id="back-to-library">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Library
        </button>
        <div class="html-reader" style="width: 100%; height: 100%; margin-bottom: 100px;">
            <iframe 
                id="content-frame" 
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                style="width: 100%; height: calc(100vh - 60px); border: none; display: block; min-height: 500px;"
                frameborder="0">
            </iframe>
        </div>`;

    // Add event listener to back button
    document
        .getElementById("back-to-library")
        .addEventListener("click", () => {
            state.currentContent = null;
            renderView();
        });

    // Get the iframe and write the HTML to it
    const iframe = document.getElementById("content-frame");
    const iframeDoc =
        iframe.contentDocument ||
        iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Hide loading and show reader
    elements.loading.style.display = "none";
    elements.readerContainer.style.display = "block";
}

// Show error message
function showError(message) {
    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = message;
    document.body.appendChild(errorElement);

    setTimeout(() => {
        errorElement.style.opacity = "0";
        errorElement.style.transition = "opacity 0.3s";
        setTimeout(
            () => document.body.removeChild(errorElement),
            300
        );
    }, 5000);
}

// Check network connection
function checkConnection() {
    updateOnlineStatus();
    const settingsLink =
        document.getElementById("settings-link");

    if (state.isOnline) {
        showMessage(
            "Internet connection detected! You can now access the main app."
        );
        if (settingsLink) {
            settingsLink.style.display = "inline-block";
        }
    } else {
        showMessage(
            "Still offline. Please check your internet connection."
        );
        if (settingsLink) {
            settingsLink.style.display = "none";
        }
    }
}

// Update online/offline status
function updateOnlineStatus() {
    state.isOnline = navigator.onLine;
    addDebugInfo(
        `Connection status: ${
            state.isOnline ? "Online" : "Offline"
        }`
    );
}

// Show message
function showMessage(message) {
    const msgElement = document.createElement("div");
    msgElement.className = "message-toast";
    msgElement.textContent = message;
    msgElement.style.backgroundColor = state.isOnline
        ? "#059669"
        : "#3b82f6";
    document.body.appendChild(msgElement);

    setTimeout(() => {
        msgElement.style.opacity = "0";
        msgElement.style.transition = "opacity 0.3s";
        setTimeout(
            () => document.body.removeChild(msgElement),
            300
        );
    }, 3000);
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", initApp);
