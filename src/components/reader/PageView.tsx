"use client";

import { useState, memo, useEffect, useRef } from "react";
import { Settings } from "@/hooks/useSettings";
import TextBoxes from "./TextBoxes";
import { AlertCircle } from "lucide-react";
import { Page, TextBlock as PrismaTextBlock } from "@prisma/client";

interface PageViewProps {
  page: Page & {
    textBlocks?: PrismaTextBlock[];
  };
  settings: Settings;
  pageNumber: number;
  showPageNumber?: boolean;
  priority?: boolean;
  onCropperStateChange?: (isOpen: boolean) => void;
  mode?: "single" | "longStrip";
}

// Memoize the PageView component to prevent unnecessary re-renders
const PageView = memo(function PageView({
  page,
  settings,
  pageNumber,
}: PageViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  console.log(page);
  const [imageUrl, setImageUrl] = useState<string>(page.imagePath);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const [lastWidth, setLastWidth] = useState(0);
  const [lastHeight, setLastHeight] = useState(0);

  // Component lifecycle
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Reset loading state when page changes
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
    setRetryCount(0);

    // Set a timeout for loading - if image isn't loaded in 5 seconds, retry or mark as error
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        if (retryCount < 2) {
          // Auto-retry
          retryLoadImage();
        } else {
          setImageError(true);
          setIsLoading(false);
        }
      }
    }, 5000);
  }, [page, pageNumber]);

  // Detect if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Update image URL if manga and volumeId are provided
  useEffect(() => {
    // Simply use the imagePath directly as it's already correct
    setImageUrl(page.imagePath);
  }, [page.imagePath]);

  console.log(imageUrl);

  // Function to retry loading image on error
  const retryLoadImage = () => {
    if (retryCount < 3 && mountedRef.current) {
      setIsLoading(true);
      setImageError(false);
      setRetryCount((prev) => prev + 1);

      // Force the browser to reload the image by appending a timestamp
      if (imageRef.current) {
        const timestamp = new Date().getTime();
        const newUrl = `${imageUrl}?t=${timestamp}`;
        imageRef.current.style.backgroundImage = `url(${newUrl})`;

        // Create a temporary image element to track loading
        const img = new Image();
        img.onload = () => {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          if (mountedRef.current) {
            setIsLoading(false);
            setImageError(true);
          }
        };
        img.src = newUrl;
      }
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    if (mountedRef.current) {
      setIsLoading(false);
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    }
  };

  // Calculate proper dimensions to avoid black bars for wide/double page spreads
  const getOptimalDimensions = () => {
    // Check if this is a wide/double page image
    const isWideImage = page.width > page.height * 1.5;

    // Get actual viewport dimensions only once
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.85 : 800;

    if (isMobile) {
      // Mobile: always use full width
      return {
        width: "100%",
        height: `calc(100vw * ${page.height / page.width})`,
        maxWidth: "100%",
      };
    } else {
      // Desktop: fit to container while keeping aspect ratio
      if (isWideImage) {
        // For wide images (spreads), calculate dimensions based on viewport constraints
        const maxWidth = Math.min(page.width, viewportWidth * 0.95);
        const scaleFactor = maxWidth / page.width;
        const scaledHeight = page.height * scaleFactor;

        // If scaled height exceeds viewport, scale down further
        if (scaledHeight > viewportHeight) {
          const heightScaleFactor = viewportHeight / scaledHeight;
          return {
            width: `${maxWidth * heightScaleFactor}px`,
            height: `${viewportHeight}px`,
            maxWidth: "95vw",
            maxHeight: `${viewportHeight}px`,
          };
        }

        return {
          width: `${maxWidth}px`,
          height: `${scaledHeight}px`,
          maxWidth: "95vw",
          maxHeight: `${viewportHeight}px`,
        };
      } else {
        // For normal images, use original dimensions with maxWidth constraint
        const maxWidth = Math.min(page.width, viewportWidth * 0.95);
        const scaleFactor = maxWidth / page.width;
        const scaledHeight = page.height * scaleFactor;

        return {
          width: `${maxWidth}px`,
          height: `${scaledHeight}px`,
          maxWidth: "95vw",
        };
      }
    }
  };

  // Enhanced error handling for image loading
  // Preload the image
  useEffect(() => {
    // Cancel existing timeout if there is one
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const img = new Image();
    img.onload = handleImageLoad;

    // Add a timestamp to bypass browser cache if this is a retry
    const url = retryCount > 0 ? `${imageUrl}?t=${Date.now()}` : imageUrl;
    img.src = url;

    // Set a timeout to display error if image doesn't load
    loadTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.log(`Image load timeout for page ${pageNumber}`);
        setIsLoading(false);
        setImageError(true);
      }
    }, 8000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      // Cancel image load if component unmounts
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl, retryCount, pageNumber, isLoading]);

  // Handle image dimensions changes to update TextBoxes position
  useEffect(() => {
    const handleResize = () => {
      // Force a re-render when window size changes to update TextBoxes
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        // Only update if dimensions changed significantly (increase threshold)
        if (
          Math.abs(rect.width - lastWidth) > 20 ||
          Math.abs(rect.height - lastHeight) > 20
        ) {
          // Use requestAnimationFrame to avoid rapid state changes
          requestAnimationFrame(() => {
            // Check if component is still mounted and refs are valid
            if (imageRef.current && mountedRef.current) {
              setLastWidth(rect.width);
              setLastHeight(rect.height);
            }
          });
        }
      }
    };

    // Debounce resize handler to prevent rapid updates
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    // Use a single ResizeObserver with proper cleanup
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && imageRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Only process if component is still mounted
        if (mountedRef.current) {
          debouncedResize();
        }
      });

      resizeObserver.observe(imageRef.current);
    }

    window.addEventListener("resize", debouncedResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [lastWidth, lastHeight]);

  if (!page) return null;

  return (
    <div className="relative w-full">
      <div ref={containerRef} className="relative flex justify-center w-full">
        {/* Loading indicator */}
        {isLoading && (
          <div
            className="flex items-center justify-center bg-gray-800 w-full"
            style={{
              aspectRatio: `${page.width} / ${page.height}`,
            }}
          >
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 border-4 border-t-orange-500 border-gray-800 rounded-full animate-spin"></div>
              <p className="mt-3 text-gray-400 text-sm">
                Loading page {pageNumber}...
              </p>
            </div>
          </div>
        )}

        {/* Main content with image as background and TextBoxes overlay */}
        {!isLoading && !imageError && (
          <div
            className="relative"
            style={{
              width: isMobile ? "100%" : "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              ref={imageRef}
              className="select-none transition-opacity duration-300 relative"
              style={{
                ...getOptimalDimensions(),
                aspectRatio: `${page.width} / ${page.height}`,
                backgroundColor: settings.darkMode ? "#000" : "#fff",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                userSelect: "none",
                WebkitUserSelect: "none",
                minHeight: isMobile ? "50px" : "auto", // Ensure a minimum height on mobile
              }}
            >
              {/* Use img element instead of background-image for better format support */}
              <img
                src={imageUrl}
                alt={`Page ${pageNumber}`}
                className="w-full h-full object-contain"
                style={{
                  filter: settings.invertColors ? "invert(1)" : "none",
                  transform: "translateZ(0)", // Hardware acceleration
                  willChange: "transform", // Hint for browser to optimize
                  imageRendering: "auto", // Improve image quality
                  transformStyle: "preserve-3d", // Prevent flickering
                }}
                onLoad={handleImageLoad}
                onError={() => {
                  console.error(`Image failed to load: ${imageUrl}`);
                  // This will trigger the image error effect which has fallback handling
                }}
              />
            </div>

            {/* TextBoxes overlay */}
            {settings.showTooltips !== false && (
              <TextBoxes
                blocks={page.textBlocks || []}
                settings={settings}
                imgWidth={page.width}
                imgHeight={page.height}
              />
            )}
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div
            className="flex items-center justify-center bg-gray-800 w-full"
            style={{
              aspectRatio: `${page.width} / ${page.height}`,
            }}
          >
            <div className="text-center p-4">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
              <p className="text-red-500 font-medium">Failed to load image</p>
              <p className="text-gray-400 text-sm my-2">Page {pageNumber}</p>
              {retryCount < 3 && (
                <button
                  onClick={retryLoadImage}
                  className="mt-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default PageView;
