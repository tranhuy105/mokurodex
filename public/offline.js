// Offline MokuroDex JavaScript - Enhanced Version
const STORES = {
    DOWNLOADS: "downloads",
    HTML: "html",
};

const DB_NAME = "mokurodex-offline";
const DB_VERSION = 4;

// State management
const state = {
    currentView: "welcome", // Default view is welcome
    currentContent: null,
    offlineContent: [],
    recentlyRead: [],
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
    welcomeView: document.getElementById("welcome-view"),
    continueReading: document.getElementById(
        "continue-reading"
    ),
    continueReadingGrid: document.getElementById(
        "continue-reading-grid"
    ),
    readerContainer: document.getElementById(
        "reader-container"
    ),
    debugInfo: document.getElementById("debug-info"),
    debugDetails: document.getElementById("debug-details"),
    debugToggle: document.getElementById("debug-toggle"),
    browseCta: document.getElementById(
        "browse-library-btn"
    ),
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

// Helper function to open IndexedDB
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

        // Toggle debug info
        setupDebugToggle();

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

        // Create a list of recently read items (sort by download date for now)
        // In a real app, you'd track actual reading history
        state.recentlyRead = [...processedDownloads]
            .sort((a, b) => b.downloadDate - a.downloadDate)
            .slice(0, 3);

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

    // Browse library CTA button on welcome screen
    if (elements.browseCta) {
        elements.browseCta.addEventListener("click", () => {
            state.currentView = "library";
            state.currentContent = null;
            updateNavButtons();
            renderView();
        });
    }

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

// Setup debug toggle
function setupDebugToggle() {
    if (elements.debugToggle) {
        elements.debugToggle.addEventListener(
            "click",
            () => {
                if (elements.debugInfo) {
                    const isVisible =
                        elements.debugInfo.style.display !==
                        "none";
                    elements.debugInfo.style.display =
                        isVisible ? "none" : "block";
                }
            }
        );
    }
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
            elements.welcomeView.style.display = "none";
            elements.contentLibrary.style.display = "none";
            elements.noContent.style.display = "none";
            elements.readerContainer.style.display =
                "block";
            renderReader();
        } else if (state.currentView === "welcome") {
            // Show welcome view
            renderWelcomeView();
        } else {
            // Show library view
            elements.welcomeView.style.display = "none";
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

// Render the welcome view
function renderWelcomeView() {
    elements.welcomeView.style.display = "block";
    elements.contentLibrary.style.display = "none";
    elements.readerContainer.style.display = "none";
    elements.noContent.style.display = "none";

    // Render "Continue Reading" section if there are items
    if (state.recentlyRead.length > 0) {
        elements.continueReading.style.display = "block";
        renderContinueReading();
    } else {
        elements.continueReading.style.display = "none";
    }
}

// Render the "Continue Reading" section
function renderContinueReading() {
    elements.continueReadingGrid.innerHTML = "";

    state.recentlyRead.forEach((item) => {
        // Create a card for each item
        const card = document.createElement("div");
        card.className = "reading-card";
        card.onclick = () => openContent(item);

        // Create cover element
        const cover = document.createElement("div");
        cover.className = "reading-cover";

        // Use the stored cover image if available
        if (item.coverImage) {
            const img = document.createElement("img");
            img.src = item.coverImage;
            img.alt =
                item.volumeTitle ||
                `Volume ${item.volumeNumber}`;
            cover.appendChild(img);
        } else {
            // Fallback to colored div
            cover.style.backgroundColor = getRandomColor(
                item.contentId
            );
            cover.textContent =
                item.contentType === "manga" ? "📚" : "📖";
            cover.style.display = "flex";
            cover.style.alignItems = "center";
            cover.style.justifyContent = "center";
            cover.style.fontSize = "2rem";
        }

        // Create info element
        const info = document.createElement("div");
        info.className = "reading-info";

        // Add title
        const title = document.createElement("h3");
        title.className = "reading-title";
        title.textContent =
            item.volumeTitle ||
            `Volume ${item.volumeNumber}`;

        // Add subtitle
        const subtitle = document.createElement("p");
        subtitle.className = "reading-subtitle";
        subtitle.textContent = item.contentTitle;

        // Add continue button
        const continueButton =
            document.createElement("button");
        continueButton.className = "continue-button";
        continueButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Continue
        `;

        // Add all elements to the card
        info.appendChild(title);
        info.appendChild(subtitle);
        info.appendChild(continueButton);

        card.appendChild(cover);
        card.appendChild(info);

        elements.continueReadingGrid.appendChild(card);
    });
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

        // Create cover element
        const coverBg = document.createElement("div");
        coverBg.className = "content-cover";

        // Use the stored cover image if available
        if (item.coverImage) {
            coverBg.style.backgroundImage = `url('${item.coverImage}')`;
            coverBg.style.backgroundSize = "cover";
            coverBg.style.backgroundPosition = "center";
            coverBg.innerHTML = ""; // Clear emoji if it was there
        } else {
            // Fallback to colored div with emoji
            coverBg.style.backgroundColor = getRandomColor(
                item.contentId
            );
            coverBg.textContent =
                item.contentType === "manga" ? "📚" : "📖";
        }

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

        // Add page count if available
        if (
            item.pageCount &&
            item.contentType === "manga"
        ) {
            const pageInfo = document.createElement("div");
            pageInfo.className = "content-pages";
            pageInfo.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                ${item.pageCount} pages
            `;
            info.appendChild(pageInfo);
        }

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
    elements.welcomeView.style.display = "none";
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
    // Use the content title if available
    const contentTitle = state.currentContent
        ? `${state.currentContent.contentTitle} - ${
              state.currentContent.volumeTitle ||
              `Volume ${state.currentContent.volumeNumber}`
          }`
        : "Content";

    elements.readerContainer.innerHTML = `
        <div class="reader-header">
            <button class="back-button" id="back-to-library">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
            </button>
            <h2>${contentTitle}</h2>
        </div>
        <div class="html-reader">
            <iframe 
                id="content-frame" 
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                style="width: 100%; height: calc(100vh - 120px); border: none; display: block; min-height: 500px; background-color: #fff;"
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
    errorElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        ${message}
    `;
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
    msgElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        ${message}
    `;
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
