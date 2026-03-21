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
        // Position: LEFT/BOTTOM on mobile (z-[60] above WhatsApp z-[55]), RIGHT/BOTTOM on desktop
        // Mobile: bottom-20 to avoid WhatsApp button bottom-4, left-4
        // Desktop: bottom-6, right-6 as before
        "fixed z-[60] left-4 sm:left-auto sm:right-6 w-11 h-11 rounded-full",
        "bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] text-white",
        "shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl hover:shadow-[var(--accent-glow)]",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 active:scale-95",
        "sm:bottom-6 bottom-20",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <ArrowUp className="w-4.5 h-4.5" />
    </button>
  );
}
