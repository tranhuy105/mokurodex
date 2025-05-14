import { useEffect } from "react";

interface KeyboardNavigationProps {
  onPreviousPage: () => void;
  onNextPage: () => void;
  onToggleSettings: () => void;
}

export function useKeyboardNavigation({
  onPreviousPage,
  onNextPage,
  onToggleSettings,
}: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          onPreviousPage();
          break;
        case "ArrowRight":
          onNextPage();
          break;
        case "Escape":
          onToggleSettings();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPreviousPage, onNextPage, onToggleSettings]);
}
