"use client";

import { useState } from "react";
import { ShieldCheck, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative z-[60] bg-[var(--accent-strong)] text-white",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-x-5 gap-y-1 py-2 text-[11px] sm:text-xs font-medium flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Pago contra entrega
        </span>
        <span
          className="hidden sm:inline-block w-px h-3 bg-white/30"
          aria-hidden
        />
        <span className="inline-flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          Envío en 2-7 días hábiles
        </span>
        <span
          className="hidden md:inline-block w-px h-3 bg-white/30"
          aria-hidden
        />
        <span className="inline-flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
          ✅ Envíos a toda Colombia
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Cerrar anuncio"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
