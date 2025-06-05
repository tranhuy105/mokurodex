export const readerStyles = `<style>
            /* Reader reset and base styles */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                overflow-x: hidden !important;
                font-size: 100% !important;
                -webkit-text-size-adjust: 100% !important;
                text-size-adjust: 100% !important;
                position: relative !important;
                /* Explicitly set to standard viewing mode for browsers */
                min-width: unset !important;
                zoom: 1 !important;
                -ms-text-size-adjust: 100% !important;
                /* Critical mobile viewport settings */
                -webkit-tap-highlight-color: transparent !important;
            }
            
            /* Force override any original EPUB styles */
            body * {
                max-width: 100% !important;
                box-sizing: border-box !important;
                word-wrap: break-word !important;
                /* Ensure all elements respect the container bounds */
                overflow-wrap: break-word !important;
            }
            
            /* Prevent text from becoming too small */
            body, body p, body div, body span {
                font-size: min(max(16px, 1.2rem), 5vw) !important;
            }
            
            /* Force all images to be contained */
            img, svg, canvas, video {
                max-width: 100% !important;
                height: auto !important;
                object-fit: contain !important;
            }
            
            .litera-reader {
                --primary-color: #3498db;
                --secondary-color: #2980b9;
                --background-color: #0f1117;
                --text-color: #e6e6e6;
                --border-color: #333;
                --progress-bg: rgba(255, 255, 255, 0.1);
                --progress-fill: rgba(52, 152, 219, 0.8);
                --sidebar-bg: #161a24;
                --sidebar-text: #ddd;
                --highlight-color: #e74c3c;
                --bounce-timing: cubic-bezier(0.18, 0.89, 0.32, 1.5); /* Super bouncy timing function */

                display: flex !important;
                flex-direction: column !important;
                height: 100% !important;
                width: 100% !important;
                max-width: 100% !important;
                background-color: var(--background-color) !important;
                color: var(--text-color) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif !important;
                line-height: 1.6 !important;
                overflow: hidden !important;
                position: relative !important;
                font-size: 16px !important;
                /* Ensure the container remains in mobile viewport mode */
                min-width: unset !important;
                zoom: 1 !important;
            }
            
            /* Additional rules to prevent layout shifting */
            @supports (padding: max(0px)) {
                body, html {
                    width: 100% !important;
                    width: -moz-available !important;
                    width: -webkit-fill-available !important;
                    width: stretch !important;
                }
            }
            
            /* Header */
            .reader-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                background-color: rgba(15, 17, 23, 0.95);
                backdrop-filter: blur(10px);
                z-index: 10;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                min-height: 48px;
            }
            
            .reader-header-left {
                display: flex;
                align-items: center;
                gap: 0.8rem;
                max-width: 70%;
                overflow: hidden;
            }

            .reader-title {
                font-size: 1rem;
                font-weight: 500;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 44px); /* Ensure space for back button */
            }

            .reader-controls {
                display: flex;
                align-items: center;
                min-width: 44px; /* Ensure minimum width for TOC button */
            }

            .reader-btn {
                background: none;
                border: none;
                color: var(--text-color);
                cursor: pointer;
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                min-width: 44px; /* Minimum touch target size */
                min-height: 44px;
                padding: 0;
                margin: 0;
            }

            .reader-btn:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .reader-btn:active {
                background-color: rgba(255, 255, 255, 0.2);
            }

            /* Content area */
            .reader-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0;
                position: relative;
                scroll-behavior: auto; /* Changed from smooth to auto for better position restoration */
                width: 100%;
                -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
            }

            .reader-content-inner {
                padding: 1.5rem;
                max-width: 800px;
                margin: 0 auto;
            }

            /* Progress bar - Enhanced with extra bounce */
            .reader-progress-container {
                position: absolute;
                top: 69px;
                left: 0;
                right: 0;
                height: 6px; /* Even smaller height when not active */
                background: var(--progress-bg);
                z-index: 100;
                cursor: pointer;
                transition: height 0.4s var(--bounce-timing); /* Extra bouncy animation */
            }

            .reader-progress-container:hover,
            .reader-progress-container:active,
            .reader-progress-container.dragging {
                height: 10px; /* Expand more when interacting */
            }

            .reader-progress-bar {
                height: 100%;
                width: 0%;
                background: var(--progress-fill);
                transition: width 0.3s var(--bounce-timing);
                border-radius: 4px; /* Rounded edges */
            }
            
            .reader-progress-chapters {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 100%;
                pointer-events: none;
            }
            
            .chapter-marker {
                position: absolute;
                top: 0;
                height: 100%;
                width: 4px; /* Wider markers */
                background-color: rgba(255, 255, 255, 0.7);
                transform: translateX(-50%);
                border-radius: 2px; /* Rounded markers */
                margin: 0 3px; /* Increased gap between markers */
                transition: transform 0.3s var(--bounce-timing), height 0.4s var(--bounce-timing);
            }
            
            .reader-progress-container:hover .chapter-marker,
            .reader-progress-container:active .chapter-marker,
            .reader-progress-container.dragging .chapter-marker {
                height: 100%; /* Full height when progress bar is active */
                transform: translateX(-50%) scaleY(1.2); /* Add slight vertical bounce */
            }
            
            .chapter-marker:hover::after {
                content: attr(data-title);
                position: absolute;
                bottom: 15px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10;
            }
            
            .reader-progress-handle {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 100%;
                width: 20px;
                transform: translateX(-50%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 101;
                cursor: grab;
                touch-action: none;
                transition: transform 0.3s var(--bounce-timing); /* Extra bouncy animation */
            }
            
            .reader-progress-handle:active {
                cursor: grabbing;
                transform: translateX(-50%) scale(1.2); /* More scale when grabbing */
            }
            
            .handle-circle {
                width: 10px; /* Even smaller when inactive */
                height: 10px;
                border-radius: 50%;
                background-color: white;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
                transition: transform 0.4s var(--bounce-timing), width 0.4s var(--bounce-timing), height 0.4s var(--bounce-timing), background-color 0.3s ease; /* Extra bouncy animation */
            }
            
            .reader-progress-container:hover .handle-circle,
            .reader-progress-container:active .handle-circle,
            .reader-progress-container.dragging .handle-circle {
                width: 18px; /* Larger when active */
                height: 18px;
                transform: scale(1.3);
            }
            
            .reader-progress-handle:active .handle-circle {
                transform: scale(1.5); /* Extra scale when actively dragging */
                background-color: var(--primary-color);
            }

            /* Progress tooltip */
            .progress-tooltip {
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 3px 6px;
                border-radius: 4px;
                font-size: 12px;
                white-space: nowrap;
                margin-top: 8px;
                opacity: 0;
                transition: opacity 0.2s ease, transform 0.3s var(--bounce-timing);
                pointer-events: none;
                font-weight: 500;
                z-index: 102;
            }
            
            .reader-progress-container:hover .progress-tooltip,
            .reader-progress-container:active .progress-tooltip,
            .reader-progress-container.dragging .progress-tooltip {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* Progress info - Enhanced for dual percentage display */
            .reader-progress-info {
                position: absolute;
                bottom: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 0.9rem;
                opacity: 0;
                transition: opacity 0.3s, transform 0.4s var(--bounce-timing); /* Extra bouncy animation */
                transform: translateY(15px);
                pointer-events: none;
                z-index: 100;
                display: flex;
                flex-direction: column;
                gap: 5px;
                min-width: 120px;
            }

            .reader-progress-info.active {
                opacity: 1;
                transform: translateY(0);
            }
            
            .progress-info-chapter,
            .progress-info-book {
                display: flex;
                justify-content: space-between;
                align-items: center;
                white-space: nowrap;
            }
            
            .progress-info-label {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.8rem;
                margin-right: 8px;
            }
            
            .progress-info-value {
                font-weight: 500;
            }

            /* Sidebar */
            .reader-sidebar {
                position: absolute;
                top: 0;
                left: -300px;
                width: 300px;
                height: 100%;
                background-color: var(--sidebar-bg);
                transition: left 0.3s ease;
                z-index: 1000;
                overflow-y: auto;
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
            }

            .reader-sidebar.active {
                left: 0;
            }

            .sidebar-header {
                padding: 1.25rem;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sidebar-title {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 500;
            }

            .sidebar-close {
                background: none;
                border: none;
                color: var(--text-color);
                font-size: 1.8rem;
                cursor: pointer;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                background-color: rgba(255, 255, 255, 0.05);
            }

            .sidebar-close:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .sidebar-close:active {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .toc-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .toc-item {
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                cursor: pointer;
                transition: background-color 0.2s;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                font-size: 1.1rem;
                min-height: 44px;
            }

            .toc-item:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }

            .toc-item:active {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .toc-item.active {
                background-color: rgba(52, 152, 219, 0.2);
                border-left: 3px solid var(--primary-color);
            }

            /* Overlay for sidebar */
            .sidebar-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 999;
                display: none;
            }

            .sidebar-overlay.active {
                display: block;
            }

            /* Content styling */
            .chapter {
                width: 100%;
                font-size: 1.2rem;
                line-height: 1.7;
            }

            .chapter p {
                margin-bottom: 1.2rem;
            }

            .chapter img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1rem auto;
            }

            /* Lazy loading indicators */
            .chapter-loading {
                padding: 2rem;
                text-align: center;
                color: var(--text-color);
            }

            .chapter-loading-spinner {
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                border-top-color: var(--primary-color);
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Mobile styles - Tablet */
            @media (max-width: 768px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 1.2rem;
                    max-width: 100%;
                }

                .chapter {
                    font-size: 1.2rem;
                    line-height: 1.7;
                }

                .reader-header {
                    padding: 0.75rem 1rem;
                }

                .reader-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 1.3rem;
                }

                .reader-controls {
                    gap: 0.75rem;
                }

                .reader-title {
                    max-width: calc(100% - 44px);
                    font-size: 1.1rem;
                }
                
                .reader-sidebar {
                    width: 85%;
                    left: -85%;
                }
            }

            /* Mobile styles - Phone */
            @media (max-width: 480px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 1rem;
                    max-width: 100%;
                    width: 100%;
                }
                
                .chapter {
                    font-size: 1.25rem;
                    line-height: 1.7;
                    width: 100%;
                }
                
                .chapter p {
                    margin-bottom: 1.4rem;
                    width: 100%;
                }
                
                .chapter h1 {
                    font-size: 1.8rem;
                }
                
                .chapter h2 {
                    font-size: 1.6rem;
                }
                
                .chapter h3 {
                    font-size: 1.4rem;
                }
                
                .reader-header {
                    padding: 0.8rem 1rem;
                }
                
                .reader-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 1.3rem;
                }
                
                .reader-header-left {
                    gap: 0.7rem;
                    max-width: 75%;
                }
                
                .reader-title {
                    font-size: 1.1rem;
                }
                
                .reader-sidebar {
                    width: 90%;
                    left: -90%;
                }
                
                .toc-item {
                    padding: 1.2rem 1rem;
                    font-size: 1.2rem;
                }
            }
            
            /* Extra small phones */
            @media (max-width: 360px) {
                body, html {
                    width: 100%;
                    overflow-x: hidden;
                }
                
                .litera-reader {
                    font-size: 18px;
                    width: 100%;
                    position: relative;
                }
                
                .reader-content-inner {
                    padding: 0.8rem;
                    width: 100%;
                }
                
                .chapter {
                    font-size: 1.25rem;
                    width: 100%;
                }
                
                .reader-header {
                    padding: 0.7rem 0.8rem;
                }
                
                .reader-btn {
                    width: 44px;
                    height: 44px;
                }
                
                .reader-header-left {
                    max-width: 70%;
                }
                
                .reader-title {
                    max-width: calc(100% - 44px);
                }
            }

            /* Accessibility */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }

            /* Reader content styles */
            .chapter h1, .chapter h2, .chapter h3 {
                margin-top: 1.5em;
                margin-bottom: 0.8em;
                line-height: 1.3;
            }
        </style>`;
