export const readerUIfromContent = (content: string) => {
    return `
    <div class="litera-reader">
    <div class="reader-header">
        <div class="reader-header-left">
            <button class="reader-btn" id="back-button" aria-label="Go Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <h1 class="reader-title" id="reader-book-title">Loading Book...</h1>
        </div>
        <div class="reader-controls">
            <button class="reader-btn font-size-btn" id="font-size-btn" aria-label="Font Size">
                <span>Aa</span>
            </button>
            <button class="reader-btn" id="fullscreen-btn" aria-label="Toggle Fullscreen">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3H3V7M21 3H17V7M17 21H21V17M3 17V21H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <button class="reader-btn" id="toggle-toc" aria-label="Table of Contents">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 5H21M3 12H21M3 19H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    </div>
    <div class="reader-progress-container" id="progress-container">
        <div class="reader-progress-bar" id="progress-bar"></div>
        <div class="reader-progress-chapters" id="progress-chapters"></div>
        <div class="reader-progress-handle" id="progress-handle">
            <div class="handle-circle"></div>
            <div class="progress-tooltip" id="progress-tooltip">
                <div class="tooltip-position" id="tooltip-position">0%</div>
                <div class="tooltip-chapter" id="chapter-progress">0% of chapter left</div>
            </div>
        </div>
    </div>
    <div class="reader-content" id="reader-content">
        <div class="reader-content-inner">
            ${content}
            <div id="chapter-loading" class="chapter-loading" style="display: none;">
                <div class="chapter-loading-spinner"></div>
                <div class="chapter-loading-text">Loading next chapter...</div>
            </div>
        </div>
    </div>
    
    <div class="font-size-menu" id="font-size-menu">
        <button class="font-size-option" data-size="small">Small</button>
        <button class="font-size-option" data-size="medium">Medium</button>
        <button class="font-size-option" data-size="large">Large</button>
        <button class="font-size-option" data-size="x-large">X-Large</button>
    </div>
    
    <div class="reader-sidebar" id="reader-sidebar">
        <div class="sidebar-header">
            <h2 class="sidebar-title">Table of Contents</h2>
            <button class="sidebar-close" id="sidebar-close">×</button>
        </div>
        <ul class="toc-list" id="toc-list"></ul>
    </div>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
</div>`;
};
