"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={cn(
        // Position: LEFT/BOTTOM always (separate from WhatsApp z-[55] on right)
        // Mobile: left-4 bottom-20 (y-20 avoids WhatsApp z-[55] bottom-4)
        // Desktop: left-6 bottom-6 (well-spaced from WhatsApp on right)
        "fixed z-[60] left-4 sm:left-6 w-11 h-11 rounded-full",
        "bg-gradient-to-br from-emerald-700 to-emerald-500 text-white",
        "shadow-lg shadow-emerald-300 hover:shadow-xl hover:shadow-emerald-300",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 active:scale-95",
        "bottom-20 sm:bottom-6",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <ArrowUp className="w-4.5 h-4.5" />
    </button>
  );
}
