import { Pixels } from "@/lib/anki-connect";
import { blobToBase64 } from "@/lib/anki-connect";

/**
 * Service for handling image processing operations
 */
export class ImageService {
  /**
   * Get a cropped version of an image
   */
  public static async getCroppedImage(
    imageSrc: string,
    pixelCrop: Pixels,
    rotation = 0
  ): Promise<string | null> {
    try {
      const image = await this.createImage(imageSrc);
      const canvas = new OffscreenCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      // Set dimensions to allow safe rotation
      canvas.width = safeArea;
      canvas.height = safeArea;

      // Translate to center, rotate, then translate back
      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate(this.getRadianAngle(rotation));
      ctx.translate(-safeArea / 2, -safeArea / 2);

      // Draw rotated image
      ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
      );
      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      // Set canvas to final crop size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Paste with correct offsets
      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
      );

      // Convert to webp
      const blob = await canvas.convertToBlob({ type: "image/webp" });
      return await blobToBase64(blob);
    } catch (error) {
      console.error("Error cropping image:", error);
      return null;
    }
  }

  /**
   * Convert degrees to radians
   */
  private static getRadianAngle(degreeValue: number): number {
    return (degreeValue * Math.PI) / 180;
  }

  /**
   * Create an image element from a URL
   */
  private static createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });
  }
}
