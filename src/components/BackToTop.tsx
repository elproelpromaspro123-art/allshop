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
        // Position: LEFT side on mobile to avoid overlapping with AI button on the right
        "fixed z-[45] left-4 sm:left-auto sm:right-6 w-10 h-10 rounded-full",
        "bg-gradient-to-br from-[var(--accent-strong)] to-[var(--accent)] text-white",
        "shadow-lg shadow-[var(--accent-glow)] hover:shadow-xl hover:shadow-[var(--accent-glow)]",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 active:scale-95",
        visible
          ? "bottom-6 opacity-100 translate-y-0"
          : "bottom-6 opacity-0 translate-y-4 pointer-events-none",
      )}
    >
      <ArrowUp className="w-4.5 h-4.5" />
    </button>
  );
}
