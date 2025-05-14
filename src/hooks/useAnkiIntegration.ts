import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { AnkiService, ImageService } from "@/lib/services";
import { Pixels } from "@/lib/anki-connect";

interface UseAnkiIntegrationReturn {
  isProcessing: boolean;
  sendImageToAnki: (imageUrl: string) => Promise<boolean>;
  sendCroppedImageToAnki: (
    imageSrc: string,
    crop: Pixels,
    rotation?: number
  ) => Promise<boolean>;
}

/**
 * Hook for Anki integration
 */
export function useAnkiIntegration(): UseAnkiIntegrationReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  // Send full image to Anki
  const sendImageToAnki = useCallback(
    async (imageUrl: string): Promise<boolean> => {
      try {
        setIsProcessing(true);

        // Confirm with user
        const confirmed = window.confirm(
          "Add the image to the last created Anki card?"
        );
        if (!confirmed) return false;

        toast.loading("Processing image for Anki...", { duration: 3000 });

        // Convert image to webp
        const webpImage = await AnkiService.imageUrlToWebp(imageUrl);
        if (!webpImage) {
          throw new Error("Failed to convert image to WebP");
        }

        // Update the last Anki card with the image
        const success = await AnkiService.updateLastCardWithImage(webpImage);

        return success;
      } catch (error) {
        console.error("Error sending image to Anki:", error);
        toast.error("Failed to send image to Anki");
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Send cropped image to Anki
  const sendCroppedImageToAnki = useCallback(
    async (imageSrc: string, crop: Pixels, rotation = 0): Promise<boolean> => {
      try {
        setIsProcessing(true);
        toast.loading("Processing cropped image for Anki...", {
          duration: 3000,
        });

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
        const success = await AnkiService.updateLastCardWithImage(croppedImage);

        return success;
      } catch (error) {
        console.error("Error sending cropped image to Anki:", error);
        toast.error("Failed to send cropped image to Anki");
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    isProcessing,
    sendImageToAnki,
    sendCroppedImageToAnki,
  };
}
