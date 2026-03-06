"use client";

import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

/**
 * ChartLightbox — wraps any chart / diagram.
 * Click to open an enlarged modal. Scroll / buttons to zoom.
 * Click outside (backdrop) or press Escape / X to close.
 */
export default function ChartLightbox({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(() => {
    setZoom(1);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  /* keyboard */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "=" || e.key === "+") setZoom((z) => Math.min(z + 0.15, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.15, 0.4));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  /* mouse wheel zoom inside modal */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setZoom((z) => {
      const next = z - e.deltaY * 0.001;
      return Math.min(3, Math.max(0.4, next));
    });
  }, []);

  return (
    <>
      {/* Inline — clickable wrapper */}
      <div
        className="group relative cursor-pointer"
        onClick={handleOpen}
      >
        {children}
        {/* hover hint */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30 rounded-lg">
          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 px-3 py-1.5 text-[11px] text-zinc-300 shadow-lg">
            <Maximize2 className="h-3 w-3" />
            Click to enlarge
          </div>
        </div>
      </div>

      {/* Modal portal */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={handleClose}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Content panel */}
            <div
              className="relative z-10 max-w-[92vw] max-h-[90vh] overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onWheel={onWheel}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                <span className="text-xs font-medium text-zinc-300 truncate max-w-[60%]">
                  {title || "Chart View"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                    title="Zoom out (−)"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500 w-10 text-center tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                    title="Zoom in (+)"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <div className="mx-1 h-4 w-px bg-zinc-800" />
                  <button
                    onClick={handleClose}
                    className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chart area */}
              <div
                ref={contentRef}
                className="p-6 flex items-center justify-center"
                style={{
                  minWidth: "70vw",
                  minHeight: "60vh",
                }}
              >
                <div
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
