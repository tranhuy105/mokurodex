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
                        const progressTooltip = document.getElementById('progress-tooltip');
                        if (progressTooltip) {
                            progressTooltip.textContent = Math.round(${initialPosition}) + '%';
                        }
                        
                        // Update progress handle
                        const progressHandle = document.getElementById('progress-handle');
                        if (progressHandle) {
                            progressHandle.style.left = '${initialPosition}%';
                        }
                        
                        // Update progress info
                        updateProgressInfo(${initialPosition});
                    }
                    
                    // Function to update both chapter and book progress info
                    function updateProgressInfo(bookPercentage) {
                        // Get chapter progress (this is a mock - you'll need to implement actual chapter tracking)
                        // For now, we'll simulate chapter progress based on book progress and current chapter bounds
                        const chapterProgress = document.getElementById('chapter-progress');
                        const bookProgress = document.getElementById('book-progress');
                        
                        if (chapterProgress && bookProgress) {
                            // Calculate chapter percentage (mock calculation - replace with actual logic)
                            // This assumes we know the start and end percentages of the current chapter
                            const currentChapterStart = getCurrentChapterStart();
                            const currentChapterEnd = getCurrentChapterEnd();
                            
                            if (currentChapterStart !== null && currentChapterEnd !== null) {
                                const chapterLength = currentChapterEnd - currentChapterStart;
                                const positionInChapter = bookPercentage - currentChapterStart;
                                const chapterPercentage = Math.round((positionInChapter / chapterLength) * 100);
                                const chapterRemaining = Math.max(0, 100 - chapterPercentage);
                                
                                chapterProgress.textContent = chapterRemaining + '% left';
                            } else {
                                chapterProgress.textContent = 'Unknown';
                            }
                            
                            // Update book progress
                            bookProgress.textContent = Math.round(bookPercentage) + '%';
                        }
                        
                        // Make sure the progress info is shown when dragging
                        const progressInfo = document.getElementById('progress-info');
                        if (progressInfo) {
                            progressInfo.classList.add('active');
                            
                            // Keep it visible for 2 seconds after last update
                            // @ts-ignore - Add global timeout reference
                            if (window.progressInfoTimeout) {
                                // @ts-ignore
                                clearTimeout(window.progressInfoTimeout);
                            }
                            
                            // @ts-ignore
                            window.progressInfoTimeout = setTimeout(function() {
                                progressInfo.classList.remove('active');
                            }, 2000);
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
                        
                        // Add more responsive scroll position tracking
                        const readerContent = document.getElementById('reader-content');
                        const progressBar = document.getElementById('progress-bar');
                        const progressInfo = document.getElementById('progress-info');
                        const progressContainer = document.getElementById('progress-container');
                        const progressHandle = document.getElementById('progress-handle');
                        const progressTooltip = document.getElementById('progress-tooltip');
                        
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
                                
                                // Update tooltip
                                if (progressTooltip) {
                                    progressTooltip.textContent = percentage + '%';
                                }
                                
                                // Update progress info with both chapter and book percentages
                                updateProgressInfo(percentage);
                                
                                // Show progress info
                                if (progressInfo) {
                                    progressInfo.classList.add('active');
                                    
                                    // Hide progress info after 2 seconds
                                    setTimeout(function() {
                                        progressInfo.classList.remove('active');
                                    }, 2000);
                                }
                                
                                // Debounce the position change event to avoid too many updates
                                scrollTimeout = setTimeout(function() {
                                    // Dispatch position change event for parent components
                                    const event = new CustomEvent('reader-position-change', {
                                        detail: { position: percentage }
                                    });
                                    document.dispatchEvent(event);
                                }, 200); // Reduced from longer delays for more responsive updates
                            }, { passive: true }); // Use passive event for better performance
                        }
                        
                        // Setup drag functionality for progress bar with enhanced animations
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
                                
                                // Show progress info immediately
                                if (progressInfo) {
                                    progressInfo.classList.add('active');
                                }
                                
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
                                    progressHandle.style.transform = 'translateX(-50%)';
                                }, 100);
                                
                                // Re-enable text selection
                                document.body.style.userSelect = '';
                                
                                // Hide progress info after a delay
                                if (progressInfo) {
                                    setTimeout(function() {
                                        progressInfo.classList.remove('active');
                                    }, 2000);
                                }
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
                                
                                // Update tooltip
                                if (progressTooltip) {
                                    progressTooltip.textContent = Math.round(percentage) + '%';
                                }
                                
                                // Update progress info with both chapter and book percentages
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
                            document.addEventListener('touchend', endDrag);
                            document.addEventListener('touchcancel', endDrag);
                            
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
