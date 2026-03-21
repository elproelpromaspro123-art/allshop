"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageZoomModalProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

export function ImageZoomModal({
  src,
  alt,
  open,
  onClose,
}: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Reset zoom and position without direct setState in effect
      const resetState = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      resetState();
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 3));
      if (e.key === "-" || e.key === "_") setZoom((z) => Math.max(z - 0.5, 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || zoom === 1) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPosition({ x, y });
    },
    [zoom],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDragging.current = false;
    if (zoom === 1) {
      setPosition({ x: 50, y: 50 });
    }
  }, [zoom]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      return Math.max(1, Math.min(3, prev + delta));
    });
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imagen"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[101] flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - 0.5, 1));
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110"
          aria-label="Alejar"
        >
          <span className="text-lg font-bold">−</span>
        </button>
        <span className="text-sm font-semibold text-white min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + 0.5, 3));
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110"
          aria-label="Acercar"
        >
          <span className="text-lg font-bold">+</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPosition({ x: 50, y: 50 });
          }}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30 hover:scale-110"
          aria-label="Reset zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          "relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-lg",
          zoom > 1 && "cursor-grab active:cursor-grabbing",
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div
          className="relative transition-transform duration-100 ease-out"
          style={{
            width: "min(80vw, 800px)",
            height: "min(80vh, 600px)",
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 800px) 100vw, 800px"
            quality={75}
            style={{
              transformOrigin: `${position.x}% ${position.y}%`,
              transform: `scale(${zoom})`,
              cursor: zoom > 1 ? "grab" : "default",
            }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center text-sm text-white/60">
        <p>
          Usa la rueda del mouse para zoom • Arrastra para mover • ESC para
          cerrar
        </p>
      </div>
    </div>
  );
}
