"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface LiveVisitorsProps {
  variant?: "store" | "product";
  className?: string;
}

function getTrafficConstraints(variant: "store" | "product"): { min: number, max: number } {
  const hour = new Date().getHours();

  let multiplier = 1;
  if (hour >= 0 && hour < 6) {
    multiplier = 0.15; // Madrugada (muy poca gente)
  } else if (hour >= 6 && hour < 10) {
    multiplier = 0.5; // Mañana (tráfico medio)
  } else if (hour >= 10 && hour < 22) {
    multiplier = 1.0; // Día/Tarde (hora pico)
  } else {
    multiplier = 0.4; // Noche (tráfico bajo)
  }

  if (variant === "store") {
    // Para la tienda (números más altos)
    return {
      min: Math.max(2, Math.floor(12 * multiplier)),
      max: Math.max(5, Math.floor(65 * multiplier)),
    };
  } else {
    // Para ver producto (números más bajos)
    return {
      min: Math.max(1, Math.floor(3 * multiplier)),
      max: Math.max(2, Math.floor(28 * multiplier)),
    };
  }
}

function getSeededInitial(variant: "store" | "product"): number {
  const now = new Date();
  const seed = now.getHours() * 60 + now.getMinutes();
  const hash = ((seed * 9301 + 49297) % 233280) / 233280;

  const { min, max } = getTrafficConstraints(variant);
  return Math.floor(hash * (max - min) + min);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function LiveVisitors({ variant = "store", className }: LiveVisitorsProps) {
  const [count, setCount] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setCount(getSeededInitial(variant));
      initialized.current = true;
    }
  }, [variant]);

  const updateCount = useCallback(() => {
    const { min, max } = getTrafficConstraints(variant);

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        setCount((prev) => {
          if (prev === null) return prev;
          const delta = Math.floor(Math.random() * 4 + 1) * (Math.random() > 0.5 ? 1 : -1);
          return clamp(prev + delta, min, max);
        });
      });
    } else {
      setCount((prev) => {
        if (prev === null) return prev;
        const delta = Math.floor(Math.random() * 4 + 1) * (Math.random() > 0.5 ? 1 : -1);
        return clamp(prev + delta, min, max);
      });
    }
  }, [variant]);

  useEffect(() => {
    if (count === null) return;
    // Update every 10-18 seconds (slower to reduce main thread work for INP)
    intervalRef.current = setInterval(updateCount, (Math.random() * 8 + 10) * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count !== null, updateCount]);

  if (count === null) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-[var(--muted)]",
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

