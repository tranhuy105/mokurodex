export const getScript = (initialPosition: number) => {
    return `<script>
                // Function to restore position
                function restorePosition(position) {
                        const readerContent = document.getElementById('reader-content');
                        if (!readerContent) return;
                        
                        // Calculate scroll position
                        const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                        const targetPosition = (${initialPosition} / 100) * scrollHeight;
                        
                        console.log('Setting initial position to ${initialPosition}%, scrollHeight:', scrollHeight, 'targetPosition:', targetPosition);
                        
                        // Force scroll to position - use both methods for compatibility
                        readerContent.scrollTo(0, targetPosition);
                        readerContent.scrollTop = targetPosition;
                        
                        // Update progress bar
                        const progressBar = document.getElementById('progress-bar');
                        if (progressBar) {
                            progressBar.style.width = '${initialPosition}%';
                        }
                        
                        // Update progress tooltip
                        const tooltipPosition = document.getElementById('tooltip-position');
                        if (tooltipPosition) {
                            tooltipPosition.textContent = Math.round(${initialPosition}) + '%';
                        }
                        
                        // Update progress handle
                        const progressHandle = document.getElementById('progress-handle');
                        if (progressHandle) {
                            progressHandle.style.left = '${initialPosition}%';
                        }
                        
                        // Update progress info
                        updateProgressInfo(${initialPosition});
                    }
                    
                    // Function to update chapter progress info in tooltip
                    function updateProgressInfo(bookPercentage) {
                        // Get chapter progress (this is a mock - you'll need to implement actual chapter tracking)
                        const chapterProgress = document.getElementById('chapter-progress');
                        
                        if (chapterProgress) {
                            const currentChapterStart = getCurrentChapterStart();
                            const currentChapterEnd = getCurrentChapterEnd();
                            
                            if (currentChapterStart !== null && currentChapterEnd !== null) {
                                const chapterLength = currentChapterEnd - currentChapterStart;
                                const positionInChapter = bookPercentage - currentChapterStart;
                                const chapterPercentage = Math.round((positionInChapter / chapterLength) * 100);
                                const chapterRemaining = Math.max(0, 100 - chapterPercentage);
                                
                                chapterProgress.textContent = chapterRemaining + '% of chapter left';
                            } else {
                                chapterProgress.textContent = 'Chapter progress unknown';
                            }
                        }
                    }
                    
                    // Function to get current chapter start percentage based on TOC
                    function getCurrentChapterStart() {
                        // Try to get chapter information from TOC data and current position
                        try {
                            const tocDataMeta = document.querySelector('meta[name="toc-data"]');
                            if (tocDataMeta && tocDataMeta.getAttribute('content')) {
                                const tocItems = JSON.parse(tocDataMeta.getAttribute('content') || '[]');
                                if (!tocItems || tocItems.length === 0) return 0;
                                
                                // Get current position
                                const progressBar = document.getElementById('progress-bar');
                                const currentPosition = progressBar ? 
                                    parseFloat(progressBar.style.width) || 0 : 0;
                                
                                // Filter to top-level items and sort by position
                                const chapters = tocItems
                                    .filter(item => item.level === 0)
                                    .sort((a, b) => a.position - b.position);
                                
                                // Find current chapter (the last chapter whose position is <= current position)
                                let currentChapter = chapters[0];
                                for (let i = 0; i < chapters.length; i++) {
                                    if (chapters[i].position <= currentPosition) {
                                        currentChapter = chapters[i];
                                    } else {
                                        break;
                                    }
                                }
                                
                                return currentChapter.position;
                            }
                        } catch (err) {
                            console.error('Error getting chapter start:', err);
                        }
                        
                        // Fallback to mock value
                        return 60;
                    }
                    
                    // Function to get current chapter end percentage based on TOC
                    function getCurrentChapterEnd() {
                        // Try to get chapter information from TOC data and current position
                        try {
                            const tocDataMeta = document.querySelector('meta[name="toc-data"]');
                            if (tocDataMeta && tocDataMeta.getAttribute('content')) {
                                const tocItems = JSON.parse(tocDataMeta.getAttribute('content') || '[]');
                                if (!tocItems || tocItems.length === 0) return 100;
                                
                                // Get current position
                                const progressBar = document.getElementById('progress-bar');
                                const currentPosition = progressBar ? 
                                    parseFloat(progressBar.style.width) || 0 : 0;
                                
                                // Filter to top-level items and sort by position
                                const chapters = tocItems
                                    .filter(item => item.level === 0)
                                    .sort((a, b) => a.position - b.position);
                                
                                // Find current chapter (the last chapter whose position is <= current position)
                                let currentChapterIndex = 0;
                                for (let i = 0; i < chapters.length; i++) {
                                    if (chapters[i].position <= currentPosition) {
                                        currentChapterIndex = i;
                                    } else {
                                        break;
                                    }
                                }
                                
                                // Get the end position (either next chapter or 100%)
                                if (currentChapterIndex < chapters.length - 1) {
                                    return chapters[currentChapterIndex + 1].position;
                                } else {
                                    return 100;
                                }
                            }
                        } catch (err) {
                            console.error('Error getting chapter end:', err);
                        }
                        
                        // Fallback to mock value
                        return 85;
                    }
                    
                    // Try multiple times with increasing delays to ensure content is fully loaded
                    function attemptRestore(attempts = 0) {
                        if (attempts > 10) return; // Give up after 10 attempts
                        
                        const readerContent = document.getElementById('reader-content');
                        if (!readerContent) return setTimeout(() => attemptRestore(attempts + 1), 100);
                        
                        // Check if content has height
                        if (readerContent.scrollHeight <= readerContent.clientHeight) {
                            // Content not fully loaded yet, try again
                            console.log('Content not fully loaded yet, trying again...');
                            setTimeout(() => attemptRestore(attempts + 1), 200 * (attempts + 1));
                            return;
                        }
                        
                        // Content has height, restore position
                        restorePosition(${initialPosition});
                        
                        // Double-check position after a short delay
                        setTimeout(() => {
                            const currentPos = readerContent.scrollTop;
                            if (currentPos < 10 && ${initialPosition} > 10) {
                                console.log('Position restoration failed, trying again...');
                                restorePosition(${initialPosition});
                            }
                        }, 500);
                    }
                    
                    // Initialize font size controls
                    function initializeFontSizeControls() {
                        const fontSizeBtn = document.getElementById('font-size-btn');
                        const fontSizeMenu = document.getElementById('font-size-menu');
                        const fontSizeOptions = document.querySelectorAll('.font-size-option');
                        const readerContainer = document.querySelector('.litera-reader');
                        
                        if (!fontSizeBtn || !fontSizeMenu || !readerContainer) return;
                        
                        // Set default font size or restore from localStorage
                        const savedFontSize = localStorage.getItem('reader-font-size') || 'medium';
                        readerContainer.classList.add('font-size-' + savedFontSize);
                        
                        // Mark the active option
                        fontSizeOptions.forEach(option => {
                            if (option.getAttribute('data-size') === savedFontSize) {
                                option.classList.add('active');
                            }
                        });
                        
                        // Toggle menu on button click
                        fontSizeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            fontSizeMenu.classList.toggle('active');
                        });
                        
                        // Handle font size selection
                        fontSizeOptions.forEach(option => {
                            option.addEventListener('click', () => {
                                const size = option.getAttribute('data-size');
                                
                                // Remove all font size classes
                                readerContainer.classList.remove(
                                    'font-size-small', 
                                    'font-size-medium', 
                                    'font-size-large', 
                                    'font-size-x-large'
                                );
                                
                                // Add selected class
                                if (size) {
                                    readerContainer.classList.add('font-size-' + size);
                                    localStorage.setItem('reader-font-size', size);
                                    
                                    // Update active state
                                    fontSizeOptions.forEach(opt => opt.classList.remove('active'));
                                    option.classList.add('active');
                                }
                                
                                // Close menu
                                fontSizeMenu.classList.remove('active');
                                
                                // Wait for reflow, then update progress
                                setTimeout(() => {
                                    // Recalculate progress after font size change
                                    const readerContent = document.getElementById('reader-content');
                                    if (readerContent) {
                                        const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                        const scrollPosition = readerContent.scrollTop;
                                        const percentage = Math.round((scrollPosition / scrollHeight) * 100);
                                        
                                        // Update progress bar and info
                                        const progressBar = document.getElementById('progress-bar');
                                        if (progressBar) {
                                            progressBar.style.width = percentage + '%';
                                        }
                                        
                                        const progressHandle = document.getElementById('progress-handle');
                                        if (progressHandle) {
                                            progressHandle.style.left = percentage + '%';
                                        }
                                        
                                        updateProgressInfo(percentage);
                                    }
                                }, 100);
                            });
                        });
                        
                        // Close menu when clicking outside
                        document.addEventListener('click', (e) => {
                            if (e.target !== fontSizeBtn && !fontSizeMenu.contains(e.target as Node)) {
                                fontSizeMenu.classList.remove('active');
                            }
                        });
                    }
                    
                    // Initialize fullscreen functionality
                    function initializeFullscreen() {
                        const fullscreenBtn = document.getElementById('fullscreen-btn');
                        const readerContainer = document.querySelector('.litera-reader');
                        
                        if (!fullscreenBtn || !readerContainer) return;
                        
                        fullscreenBtn.addEventListener('click', () => {
                            if (!document.fullscreenElement) {
                                // Enter fullscreen
                                if (readerContainer.requestFullscreen) {
                                    readerContainer.requestFullscreen();
                                } else if ((readerContainer as any).webkitRequestFullscreen) {
                                    (readerContainer as any).webkitRequestFullscreen();
                                } else if ((readerContainer as any).msRequestFullscreen) {
                                    (readerContainer as any).msRequestFullscreen();
                                }
                                
                                readerContainer.classList.add('fullscreen');
                            } else {
                                // Exit fullscreen
                                if (document.exitFullscreen) {
                                    document.exitFullscreen();
                                } else if ((document as any).webkitExitFullscreen) {
                                    (document as any).webkitExitFullscreen();
                                } else if ((document as any).msExitFullscreen) {
                                    (document as any).msExitFullscreen();
                                }
                                
                                readerContainer.classList.remove('fullscreen');
                            }
                        });
                        
                        // Update button when fullscreen state changes
                        document.addEventListener('fullscreenchange', () => {
                            if (document.fullscreenElement) {
                                readerContainer.classList.add('fullscreen');
                            } else {
                                readerContainer.classList.remove('fullscreen');
                            }
                        });
                    }
                    
                    // Ensure viewport stays fixed for mobile devices
                    function lockViewport() {
                        // Force the viewport to stay at the right scale for mobile
                        const viewportMeta = document.querySelector('meta[name="viewport"]');
                        if (viewportMeta) {
                            // Set a stronger viewport setting to prevent auto-scaling
                            viewportMeta.setAttribute('content', 
                                'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, shrink-to-fit=no, viewport-fit=cover');
                        } else {
                            // Create one if it doesn't exist
                            const meta = document.createElement('meta');
                            meta.name = 'viewport';
                            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, shrink-to-fit=no, viewport-fit=cover';
                            document.head.appendChild(meta);
                        }
                        
                        // Prevent any "View in desktop mode" switches by locking the scale
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.overflow = 'hidden';
                        document.documentElement.style.maxWidth = '100vw';
                        document.body.style.maxWidth = '100vw';
                        
                        // Prevent zoom and scale changes
                        document.addEventListener('touchmove', function(event) {
                            if (event.scale !== 1) {
                                event.preventDefault();
                            }
                        }, { passive: false });
                        
                        // Reapply the lock after any potential reflows
                        setTimeout(lockViewport, 500);
                    }
                    
                    // Start attempting to restore position
                    document.addEventListener('DOMContentLoaded', function() {
                        // Lock the viewport immediately and repeatedly to ensure mobile rendering
                        lockViewport();
                        
                        // Initialize font size controls
                        initializeFontSizeControls();
                        
                        // Initialize fullscreen functionality
                        initializeFullscreen();
                        
                        // Add more responsive scroll position tracking
                        const readerContent = document.getElementById('reader-content');
                        const progressBar = document.getElementById('progress-bar');
                        const progressContainer = document.getElementById('progress-container');
                        const progressHandle = document.getElementById('progress-handle');
                        const tooltipPosition = document.getElementById('tooltip-position');
                        
                        if (readerContent) {
                            let scrollTimeout;
                            
                            readerContent.addEventListener('scroll', function() {
                                // Clear previous timeout to implement debouncing
                                if (scrollTimeout) {
                                    clearTimeout(scrollTimeout);
                                }
                                
                                // Calculate current position
                                const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                const scrollPosition = readerContent.scrollTop;
                                const percentage = Math.round((scrollPosition / scrollHeight) * 100);
                                
                                // Update progress bar immediately for better visual feedback
                                if (progressBar) {
                                    progressBar.style.width = percentage + '%';
                                }
                                
                                // Update handle position
                                if (progressHandle) {
                                    progressHandle.style.left = percentage + '%';
                                }
                                
                                // Update tooltip position value
                                if (tooltipPosition) {
                                    tooltipPosition.textContent = percentage + '%';
                                }
                                
                                // Update chapter and book progress in tooltip
                                updateProgressInfo(percentage);
                                
                                // Debounce the position change event to avoid too many updates
                                scrollTimeout = setTimeout(function() {
                                    // Dispatch position change event for parent components
                                    const event = new CustomEvent('reader-position-change', {
                                        detail: { position: percentage }
                                    });
                                    document.dispatchEvent(event);
                                }, 200);
                            }, { passive: true }); 
                        }
                        
                        // Setup drag functionality for progress bar
                        if (progressContainer && progressHandle) {
                            let isDragging = false;
                            let animationFrame;
                            
                            // Function to handle drag start
                            const startDrag = function(e) {
                                isDragging = true;
                                progressContainer.classList.add('dragging');
                                
                                // Apply a subtle scale effect to the handle for feedback
                                progressHandle.style.transform = 'translateX(-50%) scale(1.2)';
                                
                                // Cancel any existing animation
                                if (animationFrame) {
                                    cancelAnimationFrame(animationFrame);
                                }
                                
                                // Use requestAnimationFrame for smoother updates
                                function animateDrag() {
                                    updateProgressFromEvent(e);
                                    if (isDragging) {
                                        animationFrame = requestAnimationFrame(animateDrag);
                                    }
                                }
                                animationFrame = requestAnimationFrame(animateDrag);
                                
                                // Prevent text selection during drag
                                document.body.style.userSelect = 'none';
                                
                                e.preventDefault();
                            };
                            
                            // Function to handle drag move
                            const moveDrag = function(e) {
                                if (!isDragging) return;
                                e.preventDefault();
                                // Actual update is handled by the animation frame
                            };
                            
                            // Function to handle drag end
                            const endDrag = function() {
                                if (!isDragging) return;
                                isDragging = false;
                                progressContainer.classList.remove('dragging');
                                
                                // Cancel the animation frame
                                if (animationFrame) {
                                    cancelAnimationFrame(animationFrame);
                                    animationFrame = null;
                                }
                                
                                // Reset handle transform with a slight delay for bounce effect
                                setTimeout(() => {
                                    if (progressHandle) {
                                        progressHandle.style.transform = 'translateX(-50%)';
                                    }
                                }, 100);
                                
                                // Re-enable text selection
                                document.body.style.userSelect = '';
                            };
                            
                            // Function to update progress from mouse/touch event
                            const updateProgressFromEvent = function(e) {
                                const rect = progressContainer.getBoundingClientRect();
                                let clientX;
                                
                                // Handle both mouse and touch events
                                if (e.touches && e.touches[0]) {
                                    clientX = e.touches[0].clientX;
                                } else {
                                    clientX = e.clientX;
                                }
                                
                                // Calculate percentage
                                let percentage = ((clientX - rect.left) / rect.width) * 100;
                                percentage = Math.max(0, Math.min(100, percentage)); // Clamp between 0-100
                                
                                // Update progress bar
                                if (progressBar) {
                                    progressBar.style.width = percentage + '%';
                                }
                                
                                // Update handle position with a slight bounce effect
                                if (progressHandle) {
                                    progressHandle.style.left = percentage + '%';
                                }
                                
                                // Update tooltip position
                                if (tooltipPosition) {
                                    tooltipPosition.textContent = Math.round(percentage) + '%';
                                }
                                
                                // Update chapter and book progress in tooltip
                                updateProgressInfo(percentage);
                                
                                // Scroll to position
                                if (readerContent) {
                                    const scrollHeight = readerContent.scrollHeight - readerContent.clientHeight;
                                    const targetPosition = (percentage / 100) * scrollHeight;
                                    readerContent.scrollTop = targetPosition;
                                }
                                
                                // Dispatch position change event
                                const event = new CustomEvent('reader-position-change', {
                                    detail: { position: Math.round(percentage) }
                                });
                                document.dispatchEvent(event);
                            };
                            
                            // Add event listeners for mouse events
                            progressContainer.addEventListener('mousedown', startDrag);
                            document.addEventListener('mousemove', moveDrag);
                            document.addEventListener('mouseup', endDrag);
                            
                            // Add event listeners for touch events
                            progressContainer.addEventListener('touchstart', startDrag, { passive: false });
                            document.addEventListener('touchmove', moveDrag, { passive: false });
                            document.addEventListener('touchend', endDrag, { passive: true });
                            document.addEventListener('touchcancel', endDrag, { passive: true });
                            
                            // Add additional safety - ensure drag state is reset when user leaves the page or switches apps
                            window.addEventListener('blur', endDrag, { passive: true });
                            window.addEventListener('visibilitychange', () => {
                                if (document.visibilityState !== 'visible') {
                                    endDrag();
                                }
                            }, { passive: true });
                            
                            // Add hover effect for progress bar
                            progressContainer.addEventListener('mouseenter', function() {
                                // Add a slight pulse animation to the handle when hovering
                                progressHandle.querySelector('.handle-circle').classList.add('pulse');
                            });
                            
                            progressContainer.addEventListener('mouseleave', function() {
                                // Remove pulse animation when mouse leaves
                                progressHandle.querySelector('.handle-circle').classList.remove('pulse');
                            });
                        }
                        
                        // Initialize chapter markers based on actual chapter lengths from TOC
                        initializeChapterMarkers();
                        
                        // Apply the viewport lock again after a delay
                        setTimeout(lockViewport, 100);
                        
                        // Start the restoration process
                        setTimeout(() => attemptRestore(), 50);
                    });

                    // Initialize chapter markers based on actual chapter lengths from TOC
                    function initializeChapterMarkers() {
                        const progressChapters = document.getElementById('progress-chapters');
                        if (!progressChapters) return;
                        
                        // Clear existing markers
                        progressChapters.innerHTML = '';
                        
                        // Try to get TOC data from meta tag
                        const tocDataMeta = document.querySelector('meta[name="toc-data"]');
                        
                        if (tocDataMeta && tocDataMeta.getAttribute('content')) {
                            try {
                                const tocItems = JSON.parse(tocDataMeta.getAttribute('content') || '[]');
                                
                                // Only use top-level items for markers to avoid clutter
                                const topLevelItems = tocItems.filter(item => item.level === 0);
                                
                                if (topLevelItems.length > 0) {
                                    // Add chapter markers based on their actual positions
                                    topLevelItems.forEach((item, index) => {
                                        const marker = document.createElement('div');
                                        marker.className = 'chapter-marker';
                                        
                                        // Position marker based on chapter's actual position in the book
                                        marker.style.left = item.position + '%';
                                        
                                        // Add title as data attribute for hover tooltip
                                        marker.setAttribute('data-title', item.title || 'Chapter ' + (index + 1));
                                        
                                        progressChapters.appendChild(marker);
                                    });
                                    
                                    console.log('Added ' + topLevelItems.length + ' chapter markers based on TOC data');
                                    return;
                                }
                            } catch (err) {
                                console.error('Failed to parse TOC data for chapter markers:', err);
                            }
                        }
                        
                        // Fallback: find chapters in the document and estimate their positions
                        const chapters = document.querySelectorAll('.chapter');
                        if (chapters.length > 0) {
                            const readerContent = document.getElementById('reader-content');
                            if (!readerContent) return;
                            
                            const totalHeight = readerContent.scrollHeight;
                            
                            // Create array to hold chapter position data
                            const chapterPositions = [];
                            
                            // Calculate each chapter's position based on its offset in the document
                            Array.from(chapters).forEach((chapter, index) => {
                                const rect = chapter.getBoundingClientRect();
                                const chapterOffset = rect.top + readerContent.scrollTop;
                                const percentage = (chapterOffset / totalHeight) * 100;
                                
                                // Get chapter title from heading or use default
                                const heading = chapter.querySelector('h1, h2, h3, h4') || {};
                                const title = heading.textContent || 'Chapter ' + (index + 1);
                                
                                chapterPositions.push({
                                    position: percentage,
                                    title: title
                                });
                            });
                            
                            // Add markers for each chapter
                            chapterPositions.forEach(chapter => {
                                const marker = document.createElement('div');
                                marker.className = 'chapter-marker';
                                marker.style.left = chapter.position + '%';
                                marker.setAttribute('data-title', chapter.title);
                                progressChapters.appendChild(marker);
                            });
                            
                            console.log('Added ' + chapterPositions.length + ' chapter markers based on document structure');
                        }
                    }

                    // Also lock viewport immediately on load to prevent flickering
                    (function() {
                        // Initial lock without waiting for DOMContentLoaded
                        const viewportMeta = document.querySelector('meta[name="viewport"]');
                        if (viewportMeta) {
                            viewportMeta.setAttribute('content', 
                                'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, shrink-to-fit=no, viewport-fit=cover');
                        }
                        
                        // Apply mobile-specific force styles
                        const style = document.createElement('style');
                        style.textContent = '@-ms-viewport { width: device-width; } @viewport { width: device-width; } html, body { max-width: 100vw !important; } @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } } .pulse { animation: pulse 1s infinite; }';
                        document.head.appendChild(style);
                    })();
                </script>`;
};
