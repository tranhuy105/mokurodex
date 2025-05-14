import { toast } from "react-hot-toast";
import { config } from "../config";
export type Pixels = { width: number; height: number; x: number; y: number };

interface AnkiConnectParams {
  [key: string]: unknown;
}

// Kiểm tra nếu đang trên thiết bị di động
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Lấy URL thích hợp cho AnkiConnect dựa vào thiết bị
function getAnkiConnectUrl() {
  // Nếu là mobile, sử dụng proxy server (chạy trên PC trong mạng LAN, port 8888)
  if (isMobileDevice()) {
    // Lấy hostname hiện tại (PC host trong mạng LAN)
    const host = window.location.hostname;
    return `http://${host}:8765`;
  }

  // Nếu là PC, sử dụng AnkiConnect URL local từ config
  return config.ankiConnectUrl || "http://localhost:8765";
}

/**
 * Sends a request to AnkiConnect
 * @param action The action to perform (see AnkiConnect documentation)
 * @param params Parameters for the action
 * @param version The AnkiConnect API version to use
 * @returns The result of the action
 */
export async function ankiConnect(
  action: string,
  params: AnkiConnectParams = {},
  version: number = 6
) {
  const ankiConnectUrl = getAnkiConnectUrl();

  try {
    console.log(`Making AnkiConnect request to ${ankiConnectUrl}`);
    console.log(`Action: ${action}, Version: ${version}`);
    console.log(`Params:`, params);

    // Try with a different Origin header that might work better with your AnkiConnect setup
    // Some AnkiConnect installations may be more strict about which Origins they accept
    const response = await fetch(ankiConnectUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Try without the Origin header first, or use window.location.origin if available
        ...(typeof window !== "undefined" && {
          Origin: window.location.origin,
        }),
      },
      body: JSON.stringify({
        action,
        version,
        params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AnkiConnect HTTP error: ${response.status} ${errorText}`);
      throw new Error(`AnkiConnect HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AnkiConnect response:", data);

    // AnkiConnect API v6+ returns an object with error and result fields
    if (version >= 6) {
      if (data.error) {
        console.error(`AnkiConnect error: ${data.error}`);
        throw new Error(`AnkiConnect: ${data.error}`);
      }
      return data.result;
    }
    // Version 4 or lower just returns the result
    else {
      return data;
    }
  } catch (error) {
    console.error("AnkiConnect error:", error);

    const message =
      error instanceof Error
        ? error.message
        : `Error connecting to AnkiConnect: ${error}`;

    toast.error(`Error: ${message}`);

    // Rethrow to allow components to handle the error
    throw error;
  }
}

export async function getLastCardId() {
  const notesToday = await ankiConnect("findNotes", { query: "added:1" });
  if (!notesToday || notesToday.length === 0) {
    return null;
  }

  // Ensure we're returning a number
  const lastId = notesToday.sort().at(-1);
  return typeof lastId === "number" ? lastId : parseInt(lastId, 10);
}

export async function getCardInfo(id: string | number) {
  const [noteInfo] = await ankiConnect("notesInfo", { notes: [id] });
  return noteInfo;
}

export async function getLastCardInfo() {
  const id = await getLastCardId();
  return id ? await getCardInfo(id) : null;
}

export function getCardAgeInMin(id: number) {
  return Math.floor((Date.now() - id) / 60000);
}

export async function blobToBase64(blob: Blob) {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// Convert image URL to webp format
export async function urlToWebp(imageUrl: string) {
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
    throw error;
  }
}

// Convert data URL to webp format
export async function dataUrlToWebp(dataUrl: string) {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
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
    console.error("Error converting data URL to webp:", error);
    throw error;
  }
}

// Clean text of OCR artifacts
export function cleanText(text: string): string {
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
  const htmlTags = [];
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

// Clean a specific card's content
export async function cleanCardContent(cardId: number) {
  try {
    // Get the card info - make sure we pass a string to getCardInfo
    const cardInfo = await getCardInfo(cardId);

    if (!cardInfo) {
      throw new Error("Card not found");
    }

    // Get fields that may need cleaning
    const fieldsToClean = ["Expression", "Reading", "Sentence"];
    const updatedFields: Record<string, string> = {};

    // Clean each field if it exists
    for (const field of fieldsToClean) {
      if (cardInfo.fields[field]?.value) {
        updatedFields[field] = cleanText(cardInfo.fields[field].value);
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

// Clean a batch of cards
export async function cleanCards(cardIds: number[]) {
  if (!cardIds.length) {
    toast.error("No cards to clean");
    return [];
  }

  toast.loading(`Cleaning ${cardIds.length} cards...`, { duration: 10000 });

  const successfulIds: number[] = [];

  // Process cards one by one
  for (const id of cardIds) {
    try {
      console.log(`Cleaning card: ${id} (type: ${typeof id})`);
      const success = await cleanCardContent(id);
      if (success) {
        successfulIds.push(id);
      }
    } catch (error) {
      console.error(`Error cleaning card ${id}:`, error);
    }
  }

  const successCount = successfulIds.length;

  if (successCount > 0) {
    toast.success(`Successfully cleaned ${successCount} cards`);
  }

  if (successCount < cardIds.length) {
    toast.error(`Failed to clean ${cardIds.length - successCount} cards`);
  }

  toast.dismiss();
  return successfulIds;
}

export async function updateLastCard(imageData: string | null | undefined) {
  const id = await getLastCardId();
  if (!id) {
    toast.error("No recent card found");
    return;
  }

  if (getCardAgeInMin(id) >= 5) {
    toast.error("Card created over 5 minutes ago");
    return;
  }

  try {
    // First, get the existing card info to preserve text fields
    const cardInfo = await getCardInfo(id);
    if (!cardInfo) {
      throw new Error("Card info not available");
    }

    // Create a fields object that preserves and cleans existing text fields
    const updatedFields: Record<string, string> = {};

    // Type assertion for fields
    const fields = cardInfo.fields as Record<string, { value: string }>;

    // Get fields that need cleaning
    const fieldsToClean = ["Expression", "Sentence"];

    for (const fieldName in fields) {
      // Skip Picture field as it will be handled separately
      if (fieldName !== "Picture" && fields[fieldName]?.value) {
        // Clean text fields that need cleaning, preserve others
        if (fieldsToClean.includes(fieldName)) {
          updatedFields[fieldName] = cleanText(fields[fieldName].value);
        } else {
          updatedFields[fieldName] = fields[fieldName].value;
        }
      }
    }

    if (imageData) {
      // Convert to webp if it's not already
      let base64Data: string;

      if (imageData.startsWith("data:image/webp;base64,")) {
        // Already in webp format, just extract the base64 part
        base64Data = imageData.split(";base64,")[1];
      } else {
        // Convert to webp first
        const webpImage = await dataUrlToWebp(imageData);
        if (!webpImage) throw new Error("Failed to convert image to webp");
        base64Data = webpImage.split(";base64,")[1];
      }

      // Update with both cleaned fields and new picture
      await ankiConnect("updateNoteFields", {
        note: {
          id,
          fields: updatedFields,
          picture: {
            filename: `mokuro_${id}.webp`,
            data: base64Data,
            fields: ["Picture"],
          },
        },
      });
      toast.success("Card updated with cleaned fields and image!");
    } else {
      // If no image but we're still cleaning text
      await ankiConnect("updateNoteFields", {
        note: {
          id,
          fields: updatedFields,
        },
      });
      toast.success("Card text fields cleaned!");
    }

    return id;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to update card:", error);
    toast.error(message || "Failed to update card");
    return null;
  }
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Pixels,
  rotation = 0
) {
  const image = await createImage(imageSrc);
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  const blob = await canvas.convertToBlob({ type: "image/webp" });
  return await blobToBase64(blob);
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}
