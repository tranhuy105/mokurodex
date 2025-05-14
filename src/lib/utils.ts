import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display with various options
 */
export function formatDate(
  date: Date | string | undefined,
  options?: {
    relative?: boolean; // Show relative dates like "Today", "Yesterday", etc.
    format?: Intl.DateTimeFormatOptions; // Custom date format
  }
): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Default format if none provided
    const defaultFormat: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    // Show relative dates if requested
    if (options?.relative) {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Today
      if (diffDays === 0) {
        return "Today";
      }

      // Yesterday
      if (diffDays === 1) {
        return "Yesterday";
      }

      // Within last 7 days
      if (diffDays < 7) {
        return `${diffDays} days ago`;
      }

      // Within last 30 days
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
      }
    }

    // Use provided format or default
    return dateObj.toLocaleDateString(
      undefined,
      options?.format || defaultFormat
    );
  } catch {
    return "";
  }
}
