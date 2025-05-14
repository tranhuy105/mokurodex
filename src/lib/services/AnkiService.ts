import { ankiConnect, blobToBase64 } from "@/lib/anki-connect";
import { toast } from "react-hot-toast";

/**
 * Service for handling Anki integration operations
 */
export class AnkiService {
  /**
   * Get the last created card ID
   */
  public static async getLastCardId(): Promise<number | null> {
    try {
      const notesToday = await ankiConnect("findNotes", { query: "added:1" });
      if (!notesToday || notesToday.length === 0) {
        return null;
      }

      // Ensure we're returning a number
      const lastId = notesToday.sort().at(-1);
      return typeof lastId === "number" ? lastId : parseInt(lastId, 10);
    } catch (error) {
      console.error("Error getting last card ID:", error);
      toast.error("Failed to get last card ID");
      return null;
    }
  }

  /**
   * Get card info by ID
   */
  public static async getCardInfo(id: string | number) {
    try {
      const [noteInfo] = await ankiConnect("notesInfo", { notes: [id] });
      return noteInfo;
    } catch (error) {
      console.error("Error getting card info:", error);
      toast.error("Failed to get card info");
      return null;
    }
  }

  /**
   * Get the last created card info
   */
  public static async getLastCardInfo() {
    const id = await this.getLastCardId();
    return id ? await this.getCardInfo(id) : null;
  }

  /**
   * Calculate the age of a card in minutes
   */
  public static getCardAgeInMin(id: number): number {
    return Math.floor((Date.now() - id) / 60000);
  }

  /**
   * Convert image URL to webp format
   */
  public static async imageUrlToWebp(imageUrl: string): Promise<string | null> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch image: ${response.status}`);

      const blob = await response.blob();

      // Create an image from the blob
      const image = await createImageBitmap(blob);

      // Create canvas with the same dimensions
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Failed to get canvas context");

      // Draw the image to canvas
      context.drawImage(image, 0, 0);

      // Convert to webp
      const webpBlob = await canvas.convertToBlob({ type: "image/webp" });

      // Clean up resources
      image.close();

      // Convert to base64
      return await blobToBase64(webpBlob);
    } catch (error) {
      console.error("Error converting image to webp:", error);
      return null;
    }
  }

  /**
   * Update the last created card with an image
   */
  public static async updateLastCardWithImage(
    imageData: string
  ): Promise<boolean> {
    try {
      const id = await this.getLastCardId();
      if (!id) {
        toast.error("No recent card found");
        return false;
      }

      if (this.getCardAgeInMin(id) >= 5) {
        toast.error("Card created over 5 minutes ago");
        return false;
      }

      // First, get the existing card info to preserve text fields
      const cardInfo = await this.getCardInfo(id);
      if (!cardInfo) {
        throw new Error("Card info not available");
      }

      // Convert to webp if it's not already
      let base64Data: string;

      if (imageData.startsWith("data:image/webp;base64,")) {
        // Already in webp format, just extract the base64 part
        base64Data = imageData.split(";base64,")[1];
      } else {
        // Convert to webp first
        const webpImage = await this.imageUrlToWebp(imageData);
        if (!webpImage) throw new Error("Failed to convert image to webp");
        base64Data = webpImage.split(";base64,")[1];
      }

      // Create a fields object that preserves existing text fields
      const preservedFields: Record<string, string> = {};

      // Type assertion for fields
      const fields = cardInfo.fields as Record<string, { value: string }>;

      for (const fieldName in fields) {
        // Only preserve text fields (not Picture)
        if (fieldName !== "Picture" && fields[fieldName]?.value) {
          preservedFields[fieldName] = fields[fieldName].value;
        }
      }

      // Update with both preserved fields and new picture
      await ankiConnect("updateNoteFields", {
        note: {
          id,
          fields: preservedFields,
          picture: {
            filename: `mokuro_${id}.webp`,
            data: base64Data,
            fields: ["Picture"],
          },
        },
      });

      toast.success("Card updated!");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to update card:", error);
      toast.error(message || "Failed to update card");
      return false;
    }
  }

  /**
   * Clean a card's content
   */
  public static async cleanCardContent(cardId: number): Promise<boolean> {
    try {
      // Get the card info - make sure we pass a string to getCardInfo
      const cardInfo = await this.getCardInfo(cardId);

      if (!cardInfo) {
        throw new Error("Card not found");
      }

      // Get fields that may need cleaning
      const fieldsToClean = ["Expression", "Reading", "Sentence"];
      const updatedFields: Record<string, string> = {};

      // Clean each field if it exists
      for (const field of fieldsToClean) {
        if (cardInfo.fields[field]?.value) {
          updatedFields[field] = this.cleanText(cardInfo.fields[field].value);
        }
      }

      // Update the card with cleaned fields
      if (Object.keys(updatedFields).length > 0) {
        // Preserve existing fields that we're not cleaning
        const preserveFields: Record<string, string> = {};

        // Type assertion for fields
        const fields = cardInfo.fields as Record<string, { value: string }>;

        for (const fieldName in fields) {
          if (!fieldsToClean.includes(fieldName) && fields[fieldName]?.value) {
            preserveFields[fieldName] = fields[fieldName].value;
          }
        }

        // Merge preserved fields with cleaned fields
        const allFields = { ...preserveFields, ...updatedFields };

        // Anki expects a number, not a string for note ID
        await ankiConnect("updateNoteFields", {
          note: {
            id: cardId, // Anki expects a number here
            fields: allFields,
          },
        });

        return true;
      }

      return false;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to clean card:", message);
      toast.error(`Failed to clean card ${cardId}: ${message}`);
      return false;
    }
  }

  /**
   * Clean text of OCR artifacts
   */
  private static cleanText(text: string): string {
    if (!text) return "";

    // First, handle known UI text patterns to remove them
    const withoutUIText = text
      .replace(/ol\d+/g, "")
      .replace(/SettingsReading ModeFont SizeDisplay/g, "")
      .replace(/Invert ColorsRight to LeftShow Text on Hover/g, "")
      .replace(/Anki Card Cleaning/g, "")
      .replace(/Page \d+ of \d+/g, "")
      .replace(/\d+%/g, "");

    // Japanese character range (Hiragana, Katakana, Kanji, and common punctuation)
    const japaneseRegex =
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u3000-\u303f]/;

    // Find all <b> tags so we can preserve them
    const htmlTags: Array<{ tag: string; position: number }> = [];
    let tagMatch;
    const tagRegex = /<\/?b>/g;
    while ((tagMatch = tagRegex.exec(withoutUIText)) !== null) {
      htmlTags.push({
        tag: tagMatch[0],
        position: tagMatch.index,
      });
    }

    // Create a version without tags for analysis
    const withoutHtml = withoutUIText.replace(/<\/?[^>]+(>|$)/g, "");

    // If there are no Japanese characters, return the original text with HTML tags
    if (!japaneseRegex.test(withoutHtml)) {
      return withoutUIText.trim();
    }

    // Find the first and last Japanese character
    let firstJapaneseIndex = -1;
    let lastJapaneseIndex = -1;

    for (let i = 0; i < withoutHtml.length; i++) {
      if (japaneseRegex.test(withoutHtml[i])) {
        if (firstJapaneseIndex === -1) {
          firstJapaneseIndex = i;
        }
        lastJapaneseIndex = i;
      }
    }

    // If no Japanese characters found, return the text with UI elements removed
    if (firstJapaneseIndex === -1) {
      return withoutUIText.trim();
    }

    // Look for punctuation before the first Japanese character
    if (
      firstJapaneseIndex > 0 &&
      /[.、。!?！？]/.test(withoutHtml[firstJapaneseIndex - 1])
    ) {
      firstJapaneseIndex--;
    }

    // Look for punctuation after the last Japanese character
    if (
      lastJapaneseIndex < withoutHtml.length - 1 &&
      /[.、。!?！？]/.test(withoutHtml[lastJapaneseIndex + 1])
    ) {
      lastJapaneseIndex++;
    }

    // Calculate the actual start and end positions in the original text with HTML tags
    let htmlOffset = 0;
    let finalStart = firstJapaneseIndex;
    let finalEnd = lastJapaneseIndex + 1; // +1 because substring is exclusive for end

    // Adjust the positions based on HTML tags
    for (const tag of htmlTags) {
      if (tag.position < firstJapaneseIndex + htmlOffset) {
        // HTML tag is before our start point, adjust the offset
        htmlOffset += tag.tag.length;
        finalStart += tag.tag.length;
      } else if (tag.position <= lastJapaneseIndex + htmlOffset) {
        // HTML tag is within our text, just adjust the offset
        htmlOffset += tag.tag.length;
        finalEnd += tag.tag.length;
      }
    }

    // Extract the substring with HTML tags included
    return withoutUIText.substring(finalStart, finalEnd).trim();
  }
}
