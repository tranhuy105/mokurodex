import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from "react";
import { useSettings } from "./useSettings";

interface UseReaderControlsReturn {
  showControls: boolean;
  showScrollTop: boolean;
  showSidebar: boolean;
  toggleControls: () => void;
  toggleSidebar: () => void;
  containerRef: MutableRefObject<HTMLDivElement | null>;
}

/**
 * Hook for managing reader UI controls visibility
 * Improved with better state management and performance optimizations
 */
export function useReaderControls(): UseReaderControlsReturn {
  const [showControls, setShowControls] = useState(true); // Start visible for better UX
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const { readingMode } = useSettings();

  // Track whether the user is interacting with the sidebar
  const isInteractingRef = useRef(false);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => {
      const newValue = !prev;
      // If showing sidebar, also show controls
      if (newValue) {
        setShowControls(true);
        isInteractingRef.current = true;
      } else {
        isInteractingRef.current = false;
      }
      return newValue;
    });
  }, []);

  // Handle mouse movement to show controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);

    // Clear existing timer
    if (controlsTimerRef.current !== null) {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }

    // Only auto-hide controls if not interacting with sidebar
    if (!isInteractingRef.current) {
      controlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
        controlsTimerRef.current = null;
      }, 3000);
    }
  }, []);

  // Handle scroll events for long strip mode
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // Show the scroll to top button when scrolled down
    const scrollThreshold = readingMode === "longStrip" ? 300 : 1000;
    setShowScrollTop(containerRef.current.scrollTop > scrollThreshold);

    // Also refresh the controls visibility on scroll
    handleMouseMove();
  }, [handleMouseMove, readingMode]);

  // Setup event listeners
  useEffect(() => {
    // Add mouse movement listener
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchstart", handleMouseMove);

    // Add scroll listener to container
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    // Initial trigger to start the auto-hide timer
    handleMouseMove();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleMouseMove);

      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }

      if (controlsTimerRef.current !== null) {
        window.clearTimeout(controlsTimerRef.current);
      }
    };
  }, [handleMouseMove, handleScroll]);

  // Ensure controls are visible when sidebar is open
  useEffect(() => {
    if (showSidebar) {
      setShowControls(true);
      isInteractingRef.current = true;
    } else {
      isInteractingRef.current = false;
      // Restart auto-hide timer when sidebar closes
      handleMouseMove();
    }
  }, [showSidebar, handleMouseMove]);

  return {
    showControls,
    showScrollTop,
    showSidebar,
    toggleControls,
    toggleSidebar,
    containerRef,
  };
}
