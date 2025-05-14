import { useEffect } from "react";
import { useAnkiIntegration } from "@/hooks";

interface ContextMenuProps {
  x: number;
  y: number;
  image: string;
  onCrop: () => void;
  onClose: () => void;
}

/**
 * Context menu component for Anki operations
 */
export default function ContextMenu({
  x,
  y,
  image,
  onCrop,
  onClose,
}: ContextMenuProps) {
  const { isProcessing, sendImageToAnki } = useAnkiIntegration();

  // Handle sending full image to Anki
  const handleSendFullImage = async () => {
    await sendImageToAnki(image);
    onClose();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".anki-context-menu")) {
        onClose();
      }
    };

    // Add click listener with slight delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-gray-800 rounded-lg shadow-xl text-white overflow-hidden border border-gray-700 anki-context-menu"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        minWidth: "200px",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
      <div className="px-4 py-2 bg-gray-700 font-medium border-b border-gray-600">
        Anki Options
      </div>
      <button
        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
        onClick={onCrop}
        disabled={isProcessing}
      >
        <span className="mr-2 text-blue-400">✂️</span>
        <span>Crop & Send to Anki</span>
      </button>
      <button
        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors"
        onClick={handleSendFullImage}
        disabled={isProcessing}
      >
        <span className="mr-2 text-green-400">🖼️</span>
        <span>
          {isProcessing ? "Processing..." : "Send Full Image to Anki"}
        </span>
      </button>
    </div>
  );
}
