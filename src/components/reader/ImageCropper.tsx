"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImg, urlToWebp, type Pixels } from "@/lib/anki-connect";
import { toast } from "react-hot-toast";
import { Scissors, Info, ChevronLeft, ChevronRight } from "lucide-react";

// Define types for double page mode
type DoublePageData = {
  left: string | null;
  right: string | null;
  currentPage: number;
};

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  onCrop: (croppedImage: string) => void;
  doublePage?: boolean;
  currentPages?: DoublePageData | null;
  onChangePage?: (page: string) => void;
}

export default function ImageCropper({
  isOpen,
  onClose,
  image,
  onCrop,
  doublePage = false,
  currentPages = null,
  onChangePage,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Pixels | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      console.log("ImageCropper mounted with image:", image);
    }
  }, [isOpen, image]);

  const onCropComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixels: Pixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) {
      toast.error("No crop area selected");
      return;
    }

    setIsLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        const confirmed = window.confirm(
          "Add this cropped image to the last created Anki card?"
        );
        if (confirmed) {
          onCrop(croppedImage);
        }
      } else {
        toast.error("Failed to crop image");
      }
    } catch (e) {
      console.error("Error during cropping:", e);
      toast.error("Failed to crop image");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending the whole image
  const handleSendFullImage = async () => {
    setIsLoading(true);
    try {
      const confirmed = window.confirm(
        "Add the full image to the last created Anki card?"
      );
      if (confirmed) {
        toast.loading("Converting and sending image to Anki...", {
          duration: 5000,
        });
        const webpImage = await urlToWebp(image);
        if (webpImage) {
          onCrop(webpImage);
        } else {
          throw new Error("Failed to convert image to WebP");
        }
      }
    } catch (e) {
      console.error("Error sending full image:", e);
      toast.error("Failed to send image to Anki");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page navigation in double page mode
  const handleChangePage = (newImage: string) => {
    // Reset crop and zoom when changing pages
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    if (onChangePage) {
      onChangePage(newImage);
    }
  };

  // Stop propagation of events to prevent page navigation
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] md:max-w-[85vw] lg:max-w-3xl bg-[#2a2a2a] border-[#3a3a3a] p-3 md:p-4 shadow-xl"
        onClick={handleDialogClick}
      >
        <DialogHeader className="mb-2">
          <DialogTitle className="text-[#fa9c34] text-lg md:text-xl flex items-center gap-2 font-medium">
            <Scissors className="h-5 w-5" />
            Crop Image for Anki
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Double page selector */}
          {doublePage &&
            currentPages &&
            (currentPages.left || currentPages.right) && (
              <div className="flex justify-center items-center gap-2 bg-[#222] p-2 rounded border border-[#3a3a3a]">
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-3 ${
                    currentPages.left && image === currentPages.left
                      ? "bg-[#fa9c34] text-white border-[#fa9c34]"
                      : "bg-[#3a3a3a] border-[#4a4a4a] text-gray-300"
                  } ${
                    !currentPages.left
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#4a4a4a]"
                  }`}
                  onClick={() =>
                    currentPages.left && handleChangePage(currentPages.left)
                  }
                  disabled={!currentPages.left}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Left Page
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-3 ${
                    currentPages.right && image === currentPages.right
                      ? "bg-[#fa9c34] text-white border-[#fa9c34]"
                      : "bg-[#3a3a3a] border-[#4a4a4a] text-gray-300"
                  } ${
                    !currentPages.right
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#4a4a4a]"
                  }`}
                  onClick={() =>
                    currentPages.right && handleChangePage(currentPages.right)
                  }
                  disabled={!currentPages.right}
                >
                  Right Page
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

          {/* Instructions - collapsible on mobile */}
          <div
            className={`${
              isMobile ? "collapse-panel" : ""
            } text-sm text-gray-300 bg-[#222] p-2 md:p-3 rounded border border-[#3a3a3a]`}
          >
            <details className={isMobile ? "" : "open"}>
              <summary className="flex items-center text-[#fa9c34] font-medium cursor-pointer">
                <Info className="mr-2 h-4 w-4" />
                Instructions
              </summary>
              <div className="mt-2 space-y-1 text-xs md:text-sm">
                <p className="ml-6">• Drag the crop area to position it</p>
                <p className="ml-6">• Use mouse wheel or pinch to zoom</p>
                <p className="ml-6">• Press ESC or click X to exit</p>
              </div>
            </details>
          </div>

          {/* Cropper container - responsive height */}
          <div
            className="relative w-full border border-[#3a3a3a] rounded overflow-hidden bg-[#222]"
            style={{
              height: isMobile ? "calc(70vh - 160px)" : "calc(80vh - 180px)",
              minHeight: "200px",
            }}
          >
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={undefined}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              maxZoom={10}
              zoomSpeed={0.5}
              showGrid={true}
              objectFit="contain"
              classes={{
                containerClassName: "rounded",
                cropAreaClassName: "border-2 border-[#fa9c34]",
              }}
              style={{
                containerStyle: {
                  backgroundColor: "#111",
                },
                cropAreaStyle: {
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
                },
              }}
            />
          </div>

          {/* Zoom controls for mobile */}
          {isMobile && (
            <div className="flex justify-center items-center gap-4 my-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-[#3a3a3a] border-[#4a4a4a] text-white"
                onClick={() => setZoom(Math.max(1, zoom - 0.2))}
              >
                -
              </Button>
              <span className="text-sm text-gray-300">
                Zoom: {zoom.toFixed(1)}x
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-[#3a3a3a] border-[#4a4a4a] text-white"
                onClick={() => setZoom(Math.min(10, zoom + 0.2))}
              >
                +
              </Button>
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 mt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#4a4a4a]"
              size={isMobile ? "sm" : "default"}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendFullImage}
              disabled={isLoading}
              className="h-9 bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#4a4a4a]"
              size={isMobile ? "sm" : "default"}
            >
              {isLoading ? "Processing..." : "Send Full Image"}
            </Button>
            <Button
              onClick={handleCrop}
              disabled={isLoading}
              className="h-9 bg-[#fa9c34] text-white hover:bg-[#e08b2d] border-none"
              size={isMobile ? "sm" : "default"}
            >
              {isLoading ? "Processing..." : "Crop & Add to Anki"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
