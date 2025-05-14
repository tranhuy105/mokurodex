"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { Settings } from "@/hooks/useSettings";
import { useSettings, useReaderControls } from "@/hooks";

// Define the context value type
interface ReaderContextValue {
  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;

  // UI Controls
  showControls: boolean;
  showScrollTop: boolean;
  showSidebar: boolean;
  toggleControls: () => void;
  toggleSidebar: () => void;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}

// Create the context with a default value
const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

// Provider component
export function ReaderProvider({ children }: { children: ReactNode }) {
  // Use our existing hooks
  const settings = useSettings();
  const {
    showControls,
    showScrollTop,
    showSidebar,
    toggleControls,
    toggleSidebar,
    containerRef,
  } = useReaderControls();

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      // Settings
      settings: settings as unknown as Settings,
      updateSettings: settings.updateSettings,

      // UI Controls
      showControls,
      showScrollTop,
      showSidebar,
      toggleControls,
      toggleSidebar,
      containerRef,
    }),
    [
      settings,
      showControls,
      showScrollTop,
      showSidebar,
      toggleControls,
      toggleSidebar,
    ]
  );

  return (
    <ReaderContext.Provider value={contextValue}>
      {children}
    </ReaderContext.Provider>
  );
}

// Custom hook to use the reader context
export function useReaderContext() {
  const context = useContext(ReaderContext);

  if (context === undefined) {
    throw new Error("useReaderContext must be used within a ReaderProvider");
  }

  return context;
}
