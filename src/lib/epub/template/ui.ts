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
    
    <div class="reader-progress-info" id="progress-info">
        <div class="progress-info-chapter">
            <span class="progress-info-label">Chapter:</span>
            <span class="progress-info-value" id="chapter-progress">62% left</span>
        </div>
        <div class="progress-info-book">
            <span class="progress-info-label">Book:</span>
            <span class="progress-info-value" id="book-progress">79%</span>
        </div>
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
