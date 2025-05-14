import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from "react";

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
 */
export function useReaderControls(): UseReaderControlsReturn {
  const [showControls, setShowControls] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  // Auto-hide controls after a period of inactivity
  useEffect(() => {
    if (showControls) {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }

      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds of inactivity
    }

    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, [showControls]);

  // Handle mouse movement to show controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Add scroll event listener to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setShowScrollTop(containerRef.current.scrollTop > 300);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return {
    showControls,
    showScrollTop,
    showSidebar,
    toggleControls,
    toggleSidebar,
    containerRef,
  };
}
