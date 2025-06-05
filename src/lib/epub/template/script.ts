export const getScript = (
    initialPosition: number,
    chapters: Array<{
        title: string;
        startPercentage: number;
        endPercentage: number;
    }> = []
) => {
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
                        
                        // Update progress handle
                        const progressHandle = document.getElementById('progress-handle');
                        if (progressHandle) {
                            progressHandle.style.left = '${initialPosition}%';
                        }
                        
                        // Update progress info
                        updateProgressInfo(${initialPosition});
                    }
                    
                    // Chapter data from props
                    const chaptersData = ${JSON.stringify(
                        chapters
                    )};
                    
                    // Function to create chapter markers
                    function createChapterMarkers() {
                        const progressChapters = document.getElementById('progress-chapters');
                        if (!progressChapters || chaptersData.length === 0) return;
                        
                        // Clear existing markers
                        progressChapters.innerHTML = '';
                        
                        // Create markers for each chapter boundary (except first one at 0%)
                        chaptersData.forEach((chapter, index) => {
                            if (index === 0) return; // Skip first chapter start
                            
                            const marker = document.createElement('div');
                            marker.classList.add('chapter-marker');
                            marker.style.left = chapter.startPercentage + '%';
                            marker.setAttribute('data-title', chapter.title);
                            progressChapters.appendChild(marker);
                        });
                    }
                    
                    // Function to get current chapter info based on position
                    function getCurrentChapterInfo(bookPercentage) {
                        if (chaptersData.length === 0) {
                            return { 
                                chapterPercentage: bookPercentage, 
                                chapterRemaining: Math.max(0, 100 - bookPercentage),
                                chapterTitle: 'Chapter'
                            };
                        }
                        
                        // Find current chapter
                        let currentChapter = null;
                        for (let i = 0; i < chaptersData.length; i++) {
                            const chapter = chaptersData[i];
                            if (bookPercentage >= chapter.startPercentage && bookPercentage <= chapter.endPercentage) {
                                currentChapter = chapter;
                                break;
                            }
                        }
                        
                        // If no chapter found, use the last one
                        if (!currentChapter && chaptersData.length > 0) {
                            currentChapter = chaptersData[chaptersData.length - 1];
                        }
                        
                        if (currentChapter) {
                            const chapterLength = currentChapter.endPercentage - currentChapter.startPercentage;
                            const positionInChapter = bookPercentage - currentChapter.startPercentage;
                            const chapterPercentage = Math.min(100, Math.max(0, (positionInChapter / chapterLength) * 100));
                            const chapterRemaining = Math.max(0, 100 - chapterPercentage);
                            
                            return {
                                chapterPercentage: Math.round(chapterPercentage),
                                chapterRemaining: Math.round(chapterRemaining),
                                chapterTitle: currentChapter.title
                            };
                        }
                        
                        return { 
                            chapterPercentage: Math.round(bookPercentage), 
                            chapterRemaining: Math.max(0, Math.round(100 - bookPercentage)),
                            chapterTitle: 'Chapter'
                        };
                    }
                    
                    // Function to update both chapter and book progress info
                    function updateProgressInfo(bookPercentage) {
                        const chapterProgress = document.getElementById('chapter-progress');
                        const bookProgress = document.getElementById('book-progress');
                        
                        if (chapterProgress && bookProgress) {
                            const chapterInfo = getCurrentChapterInfo(bookPercentage);
                            
                            // Update chapter progress
                            chapterProgress.textContent = chapterInfo.chapterRemaining + '% left';
                            
                            // Update book progress
                            bookProgress.textContent = Math.round(bookPercentage) + '%';
                        }
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
                        
                        // Create chapter markers
                        createChapterMarkers();
                        
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
                                const handleCircle = progressHandle.querySelector('.handle-circle');
                                if (handleCircle) {
                                    handleCircle.classList.add('pulse');
                                }
                            });
                            
                            progressContainer.addEventListener('mouseleave', function() {
                                // Remove pulse animation when mouse leaves
                                const handleCircle = progressHandle.querySelector('.handle-circle');
                                if (handleCircle) {
                                    handleCircle.classList.remove('pulse');
                                }
                            });
                        }
                        
                        // Apply the viewport lock again after a delay
                        setTimeout(lockViewport, 100);
                        
                        // Start the restoration process
                        setTimeout(() => attemptRestore(), 50);
                    });

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
