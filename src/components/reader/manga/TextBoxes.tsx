"use client";

import { Settings } from "@/hooks/useSettings";
import { TextBlock } from "@prisma/client";
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
    const [activeBoxIndex, setActiveBoxIndex] = useState<
        number | null
    >(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isScaled, setIsScaled] = useState(false); // Track if scaling has completed
    const scaleTimeoutRef = useRef<NodeJS.Timeout | null>(
        null
    );

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
        return () =>
            window.removeEventListener(
                "resize",
                checkIfMobile
            );
    }, []);

    // Handle click outside to close active text box
    useEffect(() => {
        if (activeBoxIndex === null) return;

        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (
                !target.closest(
                    `[data-box-id="${activeBoxIndex}"]`
                )
            ) {
                setActiveBoxIndex(null);
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            if (
                !target.closest(
                    `[data-box-id="${activeBoxIndex}"]`
                )
            ) {
                setActiveBoxIndex(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleMouseDown
        );
        document.addEventListener(
            "touchstart",
            handleTouchStart
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleMouseDown
            );
            document.removeEventListener(
                "touchstart",
                handleTouchStart
            );
        };
    }, [activeBoxIndex]);
    const sortedBlocks = blocks
        .map((block, originalIndex) => {
            // Parse the JSON string to get the lines array
            const lines = block.text
                ? typeof block.text === "string" &&
                  block.text.startsWith("[")
                    ? JSON.parse(block.text)
                    : block.text.split("\n")
                : [];
            const vertical = block.isVertical;

            const xmin = block.boxX;
            const ymin = block.boxY;
            const xmax = block.boxX + block.boxWidth;
            const ymax = block.boxY + block.boxHeight;

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
                        ? `${block.fontSize}px`
                        : `${settings.fontSize}pt`,
                writingMode: vertical
                    ? "vertical-rl"
                    : "horizontal-tb",
                lines,
                area,
                // @ts-expect-error: them zIndex vao database later
                zIndex: block.zIndex || 10, // Sử dụng zIndex từ database
                originalIndex, // Giữ lại index gốc để làm key
            };
        })
        .sort((a, b) => {
            // Sort by z-index first (higher z-index = rendered later = on top)
            if (a.zIndex !== b.zIndex) {
                return a.zIndex - b.zIndex;
            }
            // Then by area (larger area first)
            return b.area - a.area;
        });

    // Set container scale to match image size when rendered
    useEffect(() => {
        // Reset scaling state when dimensions change
        setIsScaled(false);

        // Clear any existing timeout
        if (scaleTimeoutRef.current) {
            clearTimeout(scaleTimeoutRef.current);
            scaleTimeoutRef.current = null;
        }

        // Create a mounted ref to prevent state updates after unmount
        const isMounted = { current: true };

        if (containerRef.current) {
            const container = containerRef.current;
            const parent = container.parentElement;

            if (parent) {
                // Debounce function to prevent rapid updates
                let resizeTimeout: NodeJS.Timeout | null =
                    null;

                const updateScale = () => {
                    if (
                        !isMounted.current ||
                        !containerRef.current ||
                        !parent
                    )
                        return;

                    // Get the actual rendered dimensions of the parent (the image container)
                    const parentRect =
                        parent.getBoundingClientRect();
                    const parentWidth = parentRect.width;
                    const parentHeight = parentRect.height;

                    // Bail early if parent has no width - means the element isn't fully rendered yet
                    if (
                        parentWidth <= 1 ||
                        parentHeight <= 1
                    ) {
                        // Try again in a short while
                        if (isMounted.current) {
                            scaleTimeoutRef.current =
                                setTimeout(updateScale, 50);
                        }
                        return;
                    }

                    // Check if this is a wide/double page image
                    const isWideImage =
                        imgWidth > imgHeight * 1.5;

                    // Handle mobile differently - use container width as primary reference
                    const isMobileView =
                        window.innerWidth <= 768 ||
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                            navigator.userAgent
                        );

                    // Calculate scale based on the limiting dimension
                    let scale;
                    if (isMobileView) {
                        // On mobile, prioritize fitting the width of the container
                        scale = parentWidth / imgWidth;
                    } else if (isWideImage) {
                        // For wide images, use height as reference if it's the limiting factor
                        const widthScale =
                            parentWidth / imgWidth;
                        const heightScale =
                            parentHeight / imgHeight;
                        scale = Math.min(
                            widthScale,
                            heightScale
                        );
                    } else {
                        // For normal images, width is typically the limiting factor
                        scale = parentWidth / imgWidth;
                    }

                    // Round scale to 4 decimal places to prevent micro-adjustments
                    scale =
                        Math.round(scale * 10000) / 10000;

                    // Apply transform with hardware acceleration
                    if (
                        containerRef.current &&
                        isMounted.current
                    ) {
                        container.style.transform = `scale(${scale})`;
                        container.style.transformOrigin =
                            "top left";
                        container.style.willChange =
                            "transform";

                        // Mark scaling as complete after a small delay to ensure rendering completes
                        if (scaleTimeoutRef.current) {
                            clearTimeout(
                                scaleTimeoutRef.current
                            );
                        }

                        scaleTimeoutRef.current =
                            setTimeout(() => {
                                if (isMounted.current) {
                                    setIsScaled(true);
                                }
                            }, 100);
                    }
                };

                // Debounced resize handler
                const debouncedResize = () => {
                    if (!isMounted.current) return;

                    setIsScaled(false); // Reset scaling state during resize

                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }

                    resizeTimeout = setTimeout(() => {
                        if (isMounted.current) {
                            requestAnimationFrame(
                                updateScale
                            );
                        }
                    }, 100);
                };

                // Initial update - wait a tiny bit to ensure parent has rendered
                setTimeout(() => {
                    if (isMounted.current) {
                        updateScale();
                    }
                }, 10);

                // Update on resize with debounce
                window.addEventListener(
                    "resize",
                    debouncedResize
                );

                // Use ResizeObserver to detect changes in parent size
                let resizeObserver: ResizeObserver | null =
                    null;

                if (typeof ResizeObserver !== "undefined") {
                    // Store initial parentRect dimensions for comparison
                    const initialParentRect =
                        parent.getBoundingClientRect();

                    resizeObserver = new ResizeObserver(
                        (entries) => {
                            // Only trigger resize if component is still mounted
                            if (isMounted.current) {
                                // Check if the size actually changed meaningfully
                                const entry = entries[0];
                                if (entry) {
                                    const {
                                        width,
                                        height,
                                    } = entry.contentRect;
                                    // If there's a significant change in dimensions, trigger update
                                    if (
                                        Math.abs(
                                            width -
                                                initialParentRect.width
                                        ) > 5 ||
                                        Math.abs(
                                            height -
                                                initialParentRect.height
                                        ) > 5
                                    ) {
                                        debouncedResize();
                                    }
                                } else {
                                    // Fallback if entry is not available
                                    debouncedResize();
                                }
                            }
                        }
                    );

                    try {
                        resizeObserver.observe(parent);
                    } catch (e) {
                        console.error(
                            "Failed to observe parent for resize:",
                            e
                        );
                        // Fallback to window resize only
                    }
                }

                return () => {
                    isMounted.current = false;

                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }

                    if (scaleTimeoutRef.current) {
                        clearTimeout(
                            scaleTimeoutRef.current
                        );
                    }

                    window.removeEventListener(
                        "resize",
                        debouncedResize
                    );

                    if (resizeObserver) {
                        resizeObserver.disconnect();
                    }
                };
            }
        }
    }, [imgWidth, imgHeight]);

    const handleTextBoxClick = (
        index: number,
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        setActiveBoxIndex(index);
    };

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                isScaled ? "opacity-100" : "opacity-0"
            }`}
            style={{
                width: `${imgWidth}px`,
                height: `${imgHeight}px`,
                transform: isMobile
                    ? `scale(${
                          window.innerWidth / imgWidth
                      })`
                    : undefined,
                transformOrigin: "top left",
            }}
        >
            {sortedBlocks.map(
                (
                    {
                        fontSize,
                        height,
                        left,
                        lines,
                        top,
                        width,
                        writingMode,
                        zIndex,
                        originalIndex,
                    },
                    index
                ) => {
                    const isActive =
                        activeBoxIndex === index;
                    const shouldShowText = isMobile
                        ? isActive
                        : false; // Chỉ hiện text khi active trên mobile

                    return (
                        <div
                            key={`textBox-${originalIndex}`}
                            className={`absolute cursor-pointer pointer-events-auto ${
                                isMobile
                                    ? "border border-red-500 border-opacity-30"
                                    : ""
                            }`}
                            style={{
                                width,
                                height,
                                left,
                                top,
                                fontSize,
                                fontWeight: "normal",
                                writingMode: writingMode as
                                    | "vertical-rl"
                                    | "horizontal-tb",
                                padding: 0,
                                lineHeight: "1.1em",
                                zIndex: isActive
                                    ? 999
                                    : zIndex, // Sử dụng zIndex từ data
                                border: "1px solid rgba(0, 0, 0, 0)", // Transparent border như HTML gốc
                                whiteSpace: "nowrap", // Giống HTML gốc
                            }}
                            data-text={lines.join(" ")}
                            data-box-id={index}
                            onClick={(e) =>
                                handleTextBoxClick(index, e)
                            }
                            onMouseEnter={
                                !isMobile
                                    ? () =>
                                          setActiveBoxIndex(
                                              index
                                          )
                                    : undefined
                            }
                            onMouseLeave={
                                !isMobile
                                    ? () =>
                                          setActiveBoxIndex(
                                              null
                                          )
                                    : undefined
                            }
                        >
                            {/* Background overlay khi hover/active */}
                            {(isActive ||
                                (!isMobile &&
                                    activeBoxIndex ===
                                        index)) && (
                                <div
                                    className="absolute inset-0 bg-white"
                                    style={{ zIndex: -1 }}
                                />
                            )}

                            {/* Text content - chỉ hiện khi hover/active */}
                            {(shouldShowText ||
                                (!isMobile &&
                                    activeBoxIndex ===
                                        index)) && (
                                <div className="w-full h-full">
                                    {lines.map(
                                        (
                                            line: string,
                                            i: number
                                        ) => (
                                            <p
                                                key={i}
                                                className="m-0 text-black"
                                                style={{
                                                    display:
                                                        "table", // Giống HTML gốc
                                                    whiteSpace:
                                                        "nowrap",
                                                    letterSpacing:
                                                        "0.1em", // Giống HTML gốc
                                                    lineHeight:
                                                        "1.1em",
                                                    backgroundColor:
                                                        "rgb(255, 255, 255)",
                                                    fontSize:
                                                        "inherit",
                                                }}
                                            >
                                                {line}
                                            </p>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }
            )}
        </div>
    );
}
