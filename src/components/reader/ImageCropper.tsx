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
import { getCroppedImg, type Pixels } from "@/lib/anki-connect";
import { toast } from "react-hot-toast";
import { Scissors } from "lucide-react";

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  onCrop: (croppedImage: string) => void;
}

export default function ImageCropper({
  isOpen,
  onClose,
  image,
  onCrop,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Pixels | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

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

  const handleClose = () => {
    onClose();
  };

  // Stop propagation of events to prevent page navigation
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl bg-gray-900 border-gray-700"
        onClick={handleDialogClick}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Scissors className="text-orange-400" size={20} />
            Crop Image for Anki
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-md border border-gray-700">
            <div className="flex items-center text-orange-400 font-medium mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Instructions
            </div>
            <p className="ml-6 mb-1">• Drag the crop area to position it</p>
            <p className="ml-6 mb-1">• Use mouse wheel or pinch to zoom</p>
            <p className="ml-6">• Press ESC or click Cancel to exit</p>
          </div>
          <div className="relative h-[60vh] w-full border border-gray-700 rounded-md overflow-hidden">
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
                containerClassName: "rounded-md",
              }}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              disabled={isLoading}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isLoading ? "Processing..." : "Crop & Add to Anki"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
