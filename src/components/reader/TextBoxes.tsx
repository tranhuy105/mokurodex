"use client";

import { Settings } from "@/hooks/useSettings";
import { TextBlock } from "@/types/manga";
import { useEffect, useRef, useState } from "react";

interface TextBoxesProps {
  blocks: TextBlock[];
  settings: Settings;
  imgWidth: number;
  imgHeight: number;
}

// Helper function to clamp values within a range
const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, value));
};

export default function TextBoxes({
  blocks,
  settings,
  imgWidth,
  imgHeight,
}: TextBoxesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if on mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(
          window.innerWidth <= 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            )
        );
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle click outside to close active text box
  useEffect(() => {
    if (activeBoxIndex === null) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-box-id="${activeBoxIndex}"]`)) {
        setActiveBoxIndex(null);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-box-id="${activeBoxIndex}"]`)) {
        setActiveBoxIndex(null);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [activeBoxIndex]);

  // Sort blocks by area (largest first)
  const sortedBlocks = blocks
    .map((block) => {
      const { box, font_size, lines, vertical } = block;

      const [xmin, ymin, xmax, ymax] = box;

      // Clamp values to ensure they're within image boundaries
      const clampedXmin = clamp(xmin, 0, imgWidth);
      const clampedYmin = clamp(ymin, 0, imgHeight);
      const clampedXmax = clamp(xmax, 0, imgWidth);
      const clampedYmax = clamp(ymax, 0, imgHeight);

      const width = clampedXmax - clampedXmin;
      const height = clampedYmax - clampedYmin;
      const area = width * height;

      return {
        left: `${clampedXmin}px`,
        top: `${clampedYmin}px`,
        width: `${width}px`,
        height: `${height}px`,
        fontSize:
          settings.fontSize === "auto"
            ? `${font_size}px`
            : `${settings.fontSize}pt`,
        writingMode: vertical ? "vertical-rl" : "horizontal-tb",
        lines,
        area,
      };
    })
    .sort((a, b) => b.area - a.area);

  // Set container scale to match image size when rendered
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const parent = container.parentElement;

      if (parent) {
        // Debounce function to prevent rapid updates
        let resizeTimeout: NodeJS.Timeout;

        const updateScale = () => {
          if (!containerRef.current || !parent) return;

          // Get the actual rendered dimensions of the parent (the image container)
          const parentRect = parent.getBoundingClientRect();
          const parentWidth = parentRect.width;
          const parentHeight = parentRect.height;

          // Check if this is a wide/double page image
          const isWideImage = imgWidth > imgHeight * 1.5;

          // Calculate scale based on the limiting dimension
          let scale;
          if (isWideImage) {
            // For wide images, use height as reference if it's the limiting factor
            const widthScale = parentWidth / imgWidth;
            const heightScale = parentHeight / imgHeight;
            scale = Math.min(widthScale, heightScale);
          } else {
            // For normal images, width is typically the limiting factor
            scale = parentWidth / imgWidth;
          }

          // Round scale to 4 decimal places to prevent micro-adjustments
          scale = Math.round(scale * 10000) / 10000;

          // Apply transform with hardware acceleration
          container.style.transform = `scale(${scale})`;
          container.style.transformOrigin = "top left";
          container.style.willChange = "transform";
        };

        // Debounced resize handler
        const debouncedResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            requestAnimationFrame(updateScale);
          }, 100);
        };

        // Initial update
        updateScale();

        // Update on resize with debounce
        window.addEventListener("resize", debouncedResize);

        // Use ResizeObserver to detect changes in parent size
        if (typeof ResizeObserver !== "undefined") {
          const resizeObserver = new ResizeObserver(debouncedResize);
          resizeObserver.observe(parent);
          return () => {
            clearTimeout(resizeTimeout);
            window.removeEventListener("resize", debouncedResize);
            resizeObserver.disconnect();
          };
        }

        return () => {
          clearTimeout(resizeTimeout);
          window.removeEventListener("resize", debouncedResize);
        };
      }
    }
  }, [imgWidth, imgHeight]);

  const handleTextBoxClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveBoxIndex(index);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: `${imgWidth}px`, height: `${imgHeight}px` }}
    >
      {sortedBlocks.map(
        ({ fontSize, height, left, lines, top, width, writingMode }, index) => {
          const isActive = activeBoxIndex === index;

          return (
            <div
              key={`textBox-${index}`}
              className={`absolute cursor-pointer pointer-events-auto ${
                isMobile ? "" : "group"
              }`}
              style={{
                width,
                height,
                left,
                top,
                fontSize,
                fontWeight: "normal",
                writingMode: writingMode as "vertical-rl" | "horizontal-tb",
                padding: 0,
                lineHeight: "1.1em",
                zIndex: isActive ? 20 : 20,
                // backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
              data-text={lines.join(" ")}
              data-box-id={index}
              onClick={(e) => handleTextBoxClick(index, e)}
            >
              <div
                className={`w-full h-full flex flex-col items-start bg-gray-900 bg-opacity-90 font-bold shadow-sm ${
                  isMobile
                    ? isActive
                      ? "opacity-100"
                      : "opacity-0"
                    : "opacity-0 group-hover:opacity-100 group-active:opacity-100"
                }`}
              >
                {lines.map((line, i) => (
                  <p
                    key={i}
                    className="m-0 whitespace-nowrap text-white bg-gray-900"
                    style={{
                      letterSpacing: "0.04em",
                      lineHeight: "1.4em",
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
