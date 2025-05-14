// "use client";

// import { useCallback, useRef, useState, useEffect } from "react";
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
// import PageView from "./PageView";
// import { Settings } from "@/hooks/useSettings";
// import { MangaPage } from "@/types/manga";
// import {
//   ArrowLeft,
//   ArrowRight,
//   ZoomIn,
//   ZoomOut,
//   RotateCcw,
// } from "lucide-react";

// interface ZoomablePageViewProps {
//   page?: MangaPage;
//   settings: Settings;
//   pageNumber: number;
//   manga: string;
//   volumeId: string;
//   onCropperStateChange?: (isOpen: boolean) => void;
//   showPageNumber?: boolean;
//   onPrevPage?: () => void;
//   onNextPage?: () => void;
// }

// export default function ZoomablePageView({
//   page,
//   settings,
//   pageNumber,
//   manga,
//   volumeId,
//   onCropperStateChange,
//   showPageNumber = false,
//   onPrevPage,
//   onNextPage,
// }: ZoomablePageViewProps) {
//   const [isCropperOpen, setIsCropperOpen] = useState(false);
//   const [controlsVisible, setControlsVisible] = useState(false);
//   const [isZoomed, setIsZoomed] = useState(false);
//   const [scale, setScale] = useState(1);
//   const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const transformRef = useRef(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Show controls when mouse moves
//   const handleMouseMove = useCallback(() => {
//     setControlsVisible(true);

//     if (controlsTimeoutRef.current) {
//       clearTimeout(controlsTimeoutRef.current);
//     }

//     controlsTimeoutRef.current = setTimeout(() => {
//       setControlsVisible(false);
//     }, 2000);
//   }, []);

//   // Clean up timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (controlsTimeoutRef.current) {
//         clearTimeout(controlsTimeoutRef.current);
//       }
//     };
//   }, []);

//   // Monitor cropper state
//   useEffect(() => {
//     if (onCropperStateChange) {
//       onCropperStateChange(isCropperOpen);
//     }
//   }, [isCropperOpen, onCropperStateChange]);

//   // Handle cropper state change
//   const handleCropperStateChange = useCallback(
//     (isOpen: boolean) => {
//       setIsCropperOpen(isOpen);
//       if (onCropperStateChange) {
//         onCropperStateChange(isOpen);
//       }
//     },
//     [onCropperStateChange]
//   );

//   // Add keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (isCropperOpen || isZoomed) return;

//       if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
//         if (onPrevPage) onPrevPage();
//       } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
//         if (onNextPage) onNextPage();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [onPrevPage, onNextPage, isCropperOpen, isZoomed]);

//   // Reset zoom when page changes
//   useEffect(() => {
//     const resetZoom = async () => {
//       // @ts-expect-error - transformRef.current might be typed incorrectly
//       if (transformRef.current && transformRef.current.resetTransform) {
//         // @ts-expect-error - Method is available but not properly typed in the library
//         transformRef.current.resetTransform();
//       }
//     };

//     resetZoom();
//   }, [pageNumber, page]);

//   // Prevent wheel scrolling on the container when zoomed
//   useEffect(() => {
//     const container = containerRef.current;

//     const preventScroll = (e: WheelEvent) => {
//       if (isZoomed) {
//         e.preventDefault();
//       }
//     };

//     if (container) {
//       container.addEventListener("wheel", preventScroll, { passive: false });
//     }

//     return () => {
//       if (container) {
//         container.removeEventListener("wheel", preventScroll);
//       }
//     };
//   }, [isZoomed]);

//   if (!page) return null;

//   return (
//     <div
//       ref={containerRef}
//       className="relative w-full h-full flex items-center justify-center overflow-hidden"
//       onMouseMove={handleMouseMove}
//     >
//       <TransformWrapper
//         initialScale={1}
//         minScale={0.5}
//         maxScale={5}
//         centerOnInit={true}
//         limitToBounds={true}
//         wheel={{
//           step: 0.1,
//           wheelDisabled: false,
//           touchPadDisabled: false,
//         }}
//         centerZoomedOut={true}
//         doubleClick={{ disabled: false, mode: "toggle" }}
//         onTransformed={(ref) => {
//           // Check if zoomed in (scale > 1)
//           setIsZoomed(ref.state.scale > 1.01);
//           setScale(ref.state.scale);
//         }}
//         ref={transformRef}
//         alignmentAnimation={{ sizeX: 0, sizeY: 0 }}
//         panning={{
//           velocityDisabled: false,
//           excluded: !isZoomed ? ["button"] : undefined,
//         }}
//         velocityAnimation={{
//           sensitivity: 1,
//           animationTime: 200,
//         }}
//         smooth={true}
//       >
//         {({ zoomIn, zoomOut, resetTransform }) => (
//           <>
//             <TransformComponent
//               wrapperStyle={{
//                 width: "100%",
//                 height: "100%",
//                 overflow: "hidden",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//               contentStyle={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 cursor: isZoomed ? "grab" : "default",
//                 willChange: "transform",
//                 transform: isZoomed ? "translateZ(0)" : undefined,
//                 transition: "cursor 0.2s ease",
//               }}
//             >
//               <div className="max-w-full max-h-full">
//                 <PageView
//                   page={page}
//                   settings={settings}
//                   pageNumber={pageNumber}
//                   manga={manga}
//                   volumeId={volumeId}
//                   onCropperStateChange={handleCropperStateChange}
//                   showPageNumber={showPageNumber}
//                 />
//               </div>
//             </TransformComponent>

//             {/* Zoom controls */}
//             <div
//               className={`fixed bottom-4 right-4 flex gap-2 transition-opacity duration-300 z-50 ${
//                 controlsVisible ? "opacity-100" : "opacity-0"
//               }`}
//             >
//               <button
//                 onClick={() => zoomIn(0.2)}
//                 className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
//                 aria-label="Zoom in"
//               >
//                 <ZoomIn size={16} />
//               </button>
//               <button
//                 onClick={() => zoomOut(0.2)}
//                 className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
//                 aria-label="Zoom out"
//               >
//                 <ZoomOut size={16} />
//               </button>
//               <button
//                 onClick={() => resetTransform()}
//                 className="h-8 w-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
//                 aria-label="Reset zoom"
//               >
//                 <RotateCcw size={16} />
//               </button>
//             </div>
//           </>
//         )}
//       </TransformWrapper>

//       {/* Navigation buttons - Fixed position on container */}
//       {(onPrevPage || onNextPage) && (
//         <div
//           className={`fixed inset-x-0 top-1/2 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-50 -translate-y-1/2 ${
//             controlsVisible ? "opacity-100" : "opacity-0"
//           }`}
//         >
//           {onPrevPage && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 if (!isZoomed && !isCropperOpen) onPrevPage();
//               }}
//               className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto ml-4 transition-transform hover:scale-110"
//               disabled={isCropperOpen || isZoomed}
//               style={{ opacity: isZoomed ? 0.3 : 1 }}
//               aria-label="Previous page"
//             >
//               <ArrowLeft size={20} />
//             </button>
//           )}
//           {onNextPage && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 if (!isZoomed && !isCropperOpen) onNextPage();
//               }}
//               className="h-12 w-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white pointer-events-auto mr-4 transition-transform hover:scale-110"
//               disabled={isCropperOpen || isZoomed}
//               style={{ opacity: isZoomed ? 0.3 : 1 }}
//               aria-label="Next page"
//             >
//               <ArrowRight size={20} />
//             </button>
//           )}
//         </div>
//       )}

//       {/* Zoom indicator */}
//       {isZoomed && (
//         <div className="fixed bottom-4 left-4 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded z-50">
//           {Math.round(scale * 100)}%
//         </div>
//       )}
//     </div>
//   );
// }
