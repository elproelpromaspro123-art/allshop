"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface LiveVisitorsProps {
  variant?: "store" | "product";
  className?: string;
}

function getTrafficConstraints(variant: "store" | "product"): { min: number, max: number } {
  const hour = new Date().getHours();

  let multiplier = 1;
  if (hour >= 0 && hour < 6) {
    multiplier = 0.15;
  } else if (hour >= 6 && hour < 10) {
    multiplier = 0.5;
  } else if (hour >= 10 && hour < 22) {
    multiplier = 1.0;
  } else {
    multiplier = 0.4;
  }

  if (variant === "store") {
    return {
      min: Math.max(1, Math.floor(2 * multiplier)),
      max: Math.max(2, Math.floor(7 * multiplier)),
    };
  } else {
    return {
      min: 1,
      max: Math.max(1, Math.floor(4 * multiplier)),
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
  const { t } = useLanguage();

  useEffect(() => {
    setCount(getSeededInitial(variant));
  }, [variant]);

  const updateCount = useCallback(() => {
    const { min, max } = getTrafficConstraints(variant);

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        setCount((prev) => {
          if (prev === null) return prev;
          const delta = Math.floor(Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
          return clamp(prev + delta, min, max);
        });
      });
    } else {
      setCount((prev) => {
        if (prev === null) return prev;
        const delta = Math.floor(Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
        return clamp(prev + delta, min, max);
      });
    }
  }, [variant]);

  useEffect(() => {
    if (count === null) return;
    intervalRef.current = setInterval(updateCount, (Math.random() * 10 + 20) * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [count, updateCount]);

  if (count === null) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] shadow-sm",
        className
      )}
    >
      {variant === "store" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 animate-pulse" />
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400/30 animate-ping" />
          </span>
          <span className="text-[var(--muted-strong)]">
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
            {" "}{t("liveVisitors.storeLabel")}
          </span>
        </>
      ) : (
        <span className="text-[var(--muted-strong)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">👁</span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
          </span>
          {" "}{t("liveVisitors.productLabel")}
        </span>
      )}
    </div>
  );
}
