"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface LiveVisitorsProps {
  variant?: "store" | "product";
  className?: string;
}

function getSeededInitial(variant: "store" | "product"): number {
  const now = new Date();
  const seed = now.getHours() * 60 + now.getMinutes();
  const hash = ((seed * 9301 + 49297) % 233280) / 233280;

  if (variant === "store") {
    return Math.floor(hash * (312 - 47) + 47);
  }
  return Math.floor(hash * (89 - 8) + 8);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function LiveVisitors({ variant = "store", className }: LiveVisitorsProps) {
  const [count, setCount] = useState(() => getSeededInitial(variant));
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const min = variant === "store" ? 30 : 5;
    const max = variant === "store" ? 350 : 120;

    function scheduleUpdate() {
      const delay = (Math.random() * 5 + 3) * 1000; // 3-8 seconds
      timeoutRef.current = setTimeout(() => {
        setCount((prev) => {
          const delta = Math.floor(Math.random() * 5 + 1) * (Math.random() > 0.5 ? 1 : -1);
          return clamp(prev + delta, min, max);
        });
        scheduleUpdate();
      }, delay);
    }

    scheduleUpdate();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [variant]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {variant === "store" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
            {" "}personas en la tienda ahora
          </span>
        </>
      ) : (
        <span>
          👁 <span className="font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
          {" "}personas viendo este producto
        </span>
      )}
    </div>
  );
}
