"use client";

import { ReactNode } from "react";
import { ReaderProvider } from "./ReaderContext";
import { AnkiProvider } from "./AnkiContext";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Component that combines all context providers
 * This ensures proper nesting order and simplifies the app structure
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <ReaderProvider>
      <AnkiProvider>{children}</AnkiProvider>
    </ReaderProvider>
  );
}
