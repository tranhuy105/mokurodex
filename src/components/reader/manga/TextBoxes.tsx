"use client";

import { Settings } from "@/hooks/useSettings";
import { TextBlock } from "@prisma/client";
import { useEffect, useState } from "react";
import "./textboxes.css";

interface TextBoxesProps {
    blocks: TextBlock[];
    settings: Settings;
    imgWidth: number;
    imgHeight: number;
}

export default function TextBoxes({
    blocks,
    settings,
    imgWidth,
    imgHeight,
}: TextBoxesProps) {
    const [hoveredBox, setHoveredBox] = useState<
        number | null
    >(null);
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
        return () =>
            window.removeEventListener(
                "resize",
                checkIfMobile
            );
    }, []);

    // Handle click outside to close active text box
    useEffect(() => {
        if (hoveredBox === null) return;

        const handleClickOutside = (
            e: MouseEvent | TouchEvent
        ) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".textBox")) {
                setHoveredBox(null);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        document.addEventListener(
            "touchstart",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
            document.removeEventListener(
                "touchstart",
                handleClickOutside
            );
        };
    }, [hoveredBox]);

    // Handle text box click
    const handleTextBoxClick = (
        index: number,
        e: React.MouseEvent | React.TouchEvent
    ) => {
        e.stopPropagation();

        // Always toggle the hovered box state, similar to the original HTML
        setHoveredBox(index === hoveredBox ? null : index);
    };

    return (
        <div
            className="pageContainer absolute inset-0 pointer-events-none"
            style={{
                width: `${imgWidth}px`,
                height: `${imgHeight}px`,
            }}
        >
            {blocks.map((block, index) => {
                // Parse the text content
                const lines = block.text
                    ? typeof block.text === "string" &&
                      block.text.startsWith("[")
                        ? JSON.parse(block.text)
                        : block.text.split("\n")
                    : [];

                // Get box dimensions
                const left = block.boxX;
                const top = block.boxY;
                const width = block.boxWidth;
                const height = block.boxHeight;

                // Get font size
                const fontSize =
                    settings.fontSize === "auto"
                        ? `${block.fontSize}px`
                        : `${settings.fontSize}pt`;

                // Is this box hovered/active?
                const isHovered = hoveredBox === index;

                // Extract zIndex from the block if available (from custom data)
                // This matches the original HTML behavior where each textBox has a zIndex
                const blockZIndex = parseInt(
                    block.text?.match(
                        /z-index:(\d+)/
                    )?.[1] || "10"
                );

                return (
                    <div
                        key={index}
                        className={`textBox absolute cursor-pointer pointer-events-auto ${
                            isHovered ? "hovered" : ""
                        } ${
                            isMobile && !isHovered
                                ? "mobile-hidden"
                                : ""
                        }`}
                        style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            fontSize: fontSize,
                            zIndex: isHovered
                                ? 999
                                : blockZIndex,
                            writingMode: block.isVertical
                                ? "vertical-rl"
                                : "horizontal-tb",
                        }}
                        onClick={(e) =>
                            handleTextBoxClick(index, e)
                        }
                        onTouchStart={(e) =>
                            isMobile &&
                            handleTextBoxClick(index, e)
                        }
                    >
                        {lines.map(
                            (line: string, i: number) => (
                                <p key={i}>{line}</p>
                            )
                        )}
                    </div>
                );
            })}
        </div>
    );
}
