"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Pixels } from "@/lib/anki-connect";
import { AnkiService, ImageService } from "@/lib/services";
import { toast } from "react-hot-toast";

interface AnkiContextValue {
  isProcessing: boolean;
  lastError: string | null;
  sendImageToAnki: (imageUrl: string) => Promise<boolean>;
  sendCroppedImageToAnki: (
    imageSrc: string,
    crop: Pixels,
    rotation?: number
  ) => Promise<boolean>;
  cleanLastCard: () => Promise<boolean>;
  addToCardQueue: (cardId: number) => void;
  processCardQueue: () => Promise<void>;
  cardQueue: number[];
  resetError: () => void;
}

// Create the context
const AnkiContext = createContext<AnkiContextValue | undefined>(undefined);

// Maximum retry attempts for Anki operations
const MAX_RETRY_ATTEMPTS = 3;

export function AnkiProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [cardQueue, setCardQueue] = useState<number[]>([]);

  // Reset error state
  const resetError = useCallback(() => {
    setLastError(null);
  }, []);

  // Add a card to the cleaning queue
  const addToCardQueue = useCallback((cardId: number) => {
    setCardQueue((prevQueue) => {
      // Avoid duplicates
      if (prevQueue.includes(cardId)) return prevQueue;
      return [...prevQueue, cardId];
    });
    toast.success(`Card ${cardId} added to cleaning queue`);
  }, []);

  // Process all cards in the queue
  const processCardQueue = useCallback(async () => {
    if (cardQueue.length === 0) {
      toast.error("No cards in queue to process");
      return;
    }

    setIsProcessing(true);
    toast.loading(`Processing ${cardQueue.length} cards...`);

    try {
      const results = await Promise.allSettled(
        cardQueue.map(async (cardId) => {
          // Attempt to clean each card with retries
          for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
              const success = await AnkiService.cleanCardContent(cardId);
              return { cardId, success };
            } catch (error) {
              if (attempt === MAX_RETRY_ATTEMPTS) {
                throw error;
              }
              // Wait a bit before retrying
              await new Promise((resolve) =>
                setTimeout(resolve, 500 * attempt)
              );
            }
          }
          return { cardId, success: false };
        })
      );

      // Process results
      const successful = results.filter(
        (r) =>
          r.status === "fulfilled" &&
          (r as PromiseFulfilledResult<{ cardId: number; success: boolean }>)
            .value?.success
      ).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`Successfully cleaned ${successful} cards`);
      }

      if (failed > 0) {
        toast.error(`Failed to clean ${failed} cards`);
      }

      // Clear the queue on success
      setCardQueue([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      toast.error(`Error processing cards: ${message}`);
    } finally {
      setIsProcessing(false);
      toast.dismiss();
    }
  }, [cardQueue]);

  // Send a full image to Anki with retry mechanism
  const sendImageToAnki = useCallback(
    async (imageUrl: string): Promise<boolean> => {
      setIsProcessing(true);
      setLastError(null);

      try {
        // Confirm with user
        const confirmed = window.confirm(
          "Add the image to the last created Anki card?"
        );
        if (!confirmed) return false;

        toast.loading("Processing image for Anki...", { duration: 3000 });

        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
          try {
            // Convert image to webp
            const webpImage = await AnkiService.imageUrlToWebp(imageUrl);
            if (!webpImage) {
              throw new Error("Failed to convert image to WebP");
            }

            // Update the last Anki card with the image
            const success = await AnkiService.updateLastCardWithImage(
              webpImage
            );
            return success;
          } catch (error) {
            if (attempt === MAX_RETRY_ATTEMPTS) {
              throw error;
            }
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }

        return false;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending image to Anki:", error);
        setLastError(message);
        toast.error(`Failed to send image to Anki: ${message}`);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Send a cropped image to Anki with retry mechanism
  const sendCroppedImageToAnki = useCallback(
    async (imageSrc: string, crop: Pixels, rotation = 0): Promise<boolean> => {
      setIsProcessing(true);
      setLastError(null);

      try {
        toast.loading("Processing cropped image for Anki...", {
          duration: 3000,
        });

        for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
          try {
            // Get cropped image
            const croppedImage = await ImageService.getCroppedImage(
              imageSrc,
              crop,
              rotation
            );
            if (!croppedImage) {
              throw new Error("Failed to crop image");
            }

            // Update the last Anki card with the cropped image
            const success = await AnkiService.updateLastCardWithImage(
              croppedImage
            );
            return success;
          } catch (error) {
            if (attempt === MAX_RETRY_ATTEMPTS) {
              throw error;
            }
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          }
        }

        return false;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Error sending cropped image to Anki:", error);
        setLastError(message);
        toast.error(`Failed to send cropped image to Anki: ${message}`);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Clean the last created card
  const cleanLastCard = useCallback(async (): Promise<boolean> => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const cardId = await AnkiService.getLastCardId();
      if (!cardId) {
        toast.error("No recent card found");
        return false;
      }

      const success = await AnkiService.cleanCardContent(cardId);
      if (success) {
        toast.success("Card cleaned successfully");
      }

      return success;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      toast.error(`Failed to clean card: ${message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Create the memoized context value
  const contextValue = useMemo(
    () => ({
      isProcessing,
      lastError,
      sendImageToAnki,
      sendCroppedImageToAnki,
      cleanLastCard,
      addToCardQueue,
      processCardQueue,
      cardQueue,
      resetError,
    }),
    [
      isProcessing,
      lastError,
      sendImageToAnki,
      sendCroppedImageToAnki,
      cleanLastCard,
      addToCardQueue,
      processCardQueue,
      cardQueue,
      resetError,
    ]
  );

  return (
    <AnkiContext.Provider value={contextValue}>{children}</AnkiContext.Provider>
  );
}

// Custom hook to use the Anki context
export function useAnkiContext() {
  const context = useContext(AnkiContext);

  if (context === undefined) {
    throw new Error("useAnkiContext must be used within an AnkiProvider");
  }

  return context;
}
