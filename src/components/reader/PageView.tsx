"use client";

import { useState, memo, useEffect, useRef } from "react";
import { Settings } from "@/hooks/useSettings";
import TextBoxes from "./TextBoxes";
import ImageCropper from "./ImageCropper";
import { updateLastCard, urlToWebp } from "@/lib/anki-connect";
import { toast } from "react-hot-toast";
import { createMangaImageUrl } from "@/lib/path-utils";
import { MangaPage } from "@/types/manga";
import { AlertCircle } from "lucide-react";

interface PageViewProps {
  page: MangaPage;
  settings: Settings;
  pageNumber: number;
  showPageNumber?: boolean;
  priority?: boolean;
  manga?: string;
  volumeId?: string;
  onCropperStateChange?: (isOpen: boolean) => void;
  mode?: "single" | "longStrip";
}

// Context menu component
interface ContextMenuProps {
  x: number;
  y: number;
  image: string;
  onCrop: () => void;
  onClose: () => void;
}

const ContextMenu = ({ x, y, image, onCrop, onClose }: ContextMenuProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle sending full image to Anki
  const handleSendFullImage = async () => {
    try {
      setIsLoading(true);
      const confirmed = window.confirm(
        "Add the full image to the last created Anki card?"
      );
      if (confirmed) {
        toast.loading("Converting and sending image to Anki...", {
          duration: 5000,
        });
        const webpImage = await urlToWebp(image);
        if (webpImage) {
          await updateLastCard(webpImage);
        } else {
          throw new Error("Failed to convert image to WebP");
        }
      }
    } catch (error) {
      console.error("Error sending image to Anki:", error);
      toast.error(
        "Failed to send image to Anki: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".anki-context-menu")) {
        onClose();
      }
    };

    // Add click listener with slight delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-gray-800 rounded-lg shadow-xl text-white overflow-hidden border border-gray-700 anki-context-menu"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        minWidth: "200px",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
      <div className="px-4 py-2 bg-gray-700 font-medium border-b border-gray-600">
        Anki Options
      </div>
      <button
        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
        onClick={onCrop}
        disabled={isLoading}
      >
        <span className="mr-2 text-orange-400">✂️</span>
        <span>Crop & Send to Anki</span>
      </button>
      <button
        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
        onClick={handleSendFullImage}
        disabled={isLoading}
      >
        <span className="mr-2 text-green-400">🖼️</span>
        <span>{isLoading ? "Processing..." : "Send Full Image to Anki"}</span>
      </button>
    </div>
  );
};

// Memoize the PageView component to prevent unnecessary re-renders
const PageView = memo(function PageView({
  page,
  settings,
  pageNumber,
  manga,
  volumeId,
  onCropperStateChange,
}: PageViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(page.image);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
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
    if (manga && volumeId && page.img_path) {
      try {
        // Extract the image path components
        const pathParts = page.img_path.split("/");
        if (pathParts.length >= 3) {
          // We only need volumeName and imageName, first element (mangaName) is ignored
          const [, volumeName, ...imageParts] = pathParts;
          const imageName = imageParts.join("/");

          // Create URL to the image
          const url = createMangaImageUrl(manga, volumeName, imageName);

          // Check if this is a webp file
          const isWebP = url.toLowerCase().endsWith(".webp");

          // Log information about the image being loaded
          console.log(`Loading image: ${url}, WebP: ${isWebP}`);

          // Test if browser supports webp
          if (isWebP) {
            const testWebP = (callback: (supported: boolean) => void) => {
              const webP = new Image();
              webP.onload = () => callback(true);
              webP.onerror = () => callback(false);
              webP.src =
                "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
            };

            testWebP((supported) => {
              console.log(`WebP support: ${supported}`);
              // Even if not supported, we'll try loading anyway as the browser may have polyfills
            });
          }

          setImageUrl(url);
        }
      } catch (error) {
        console.error("Error constructing image URL:", error);
        setImageError(true);
        setIsLoading(false);
      }
    } else if (page.image) {
      // If no manga/volumeId provided, use the default image URL from the page object
      setImageUrl(page.image);
    }
  }, [manga, volumeId, page.img_path, page.image]);

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

  // Handle context menu for the Anki actions
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default context menu
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCrop = async (croppedImage: string) => {
    console.log("Cropping image and updating Anki card...");
    await updateLastCard(croppedImage);
    console.log("Image cropped and card updated successfully");
    setIsCropperOpen(false);
    if (onCropperStateChange) {
      onCropperStateChange(false);
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Open cropper from context menu
  const openCropper = () => {
    setIsCropperOpen(true);
    if (onCropperStateChange) {
      onCropperStateChange(true);
    }
    closeContextMenu();
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
    const isWideImage = page.img_width > page.img_height * 1.5;

    // Get actual viewport dimensions only once
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.85 : 800;

    if (isMobile) {
      // Mobile: always use full width
      return {
        width: "100%",
        height: `calc(100vw * ${page.img_height / page.img_width})`,
        maxWidth: "100%",
      };
    } else {
      // Desktop: fit to container while keeping aspect ratio
      if (isWideImage) {
        // For wide images (spreads), calculate dimensions based on viewport constraints
        const maxWidth = Math.min(page.img_width, viewportWidth * 0.95);
        const scaleFactor = maxWidth / page.img_width;
        const scaledHeight = page.img_height * scaleFactor;

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
        const maxWidth = Math.min(page.img_width, viewportWidth * 0.95);
        const scaleFactor = maxWidth / page.img_width;
        const scaledHeight = page.img_height * scaleFactor;

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
              aspectRatio: `${page.img_width} / ${page.img_height}`,
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
                aspectRatio: `${page.img_width} / ${page.img_height}`,
                backgroundColor: settings.darkMode ? "#000" : "#fff",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                userSelect: "none",
                WebkitUserSelect: "none",
                minHeight: isMobile ? "50px" : "auto", // Ensure a minimum height on mobile
              }}
              onContextMenu={handleContextMenu}
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
                blocks={page.blocks || []}
                settings={settings}
                imgWidth={page.img_width}
                imgHeight={page.img_height}
              />
            )}
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div
            className="flex items-center justify-center bg-gray-800 w-full"
            style={{
              aspectRatio: `${page.img_width} / ${page.img_height}`,
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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          image={imageUrl}
          onCrop={openCropper}
          onClose={closeContextMenu}
        />
      )}

      {isCropperOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      )}

      <ImageCropper
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false);
          if (onCropperStateChange) {
            onCropperStateChange(false);
          }
        }}
        image={imageUrl}
        onCrop={handleCrop}
      />
    </div>
  );
});

export default PageView;
