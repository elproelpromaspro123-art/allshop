"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface LiveVisitorsProps {
  variant?: "store" | "product";
  className?: string;
}

/**
 * Derives a deterministic-looking visitor count based on the current
 * date/time so the value feels organic but remains stable across
 * short page loads (same minute → same seed).
 */
function deriveBaseCount(variant: "store" | "product"): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const hourFactors = [
    0.08, 0.05, 0.04, 0.03, 0.04, 0.06,
    0.18, 0.35, 0.52, 0.68, 0.82, 0.90,
    0.88, 0.78, 0.72, 0.75, 0.80, 0.85,
    0.92, 0.95, 0.88, 0.70, 0.45, 0.22,
  ];

  const weekendDamping = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1;
  const factor = (hourFactors[hour] ?? 0.5) * weekendDamping;

  const minuteSeed = now.getFullYear() * 527 + (now.getMonth() + 1) * 389
    + now.getDate() * 197 + hour * 67 + now.getMinutes() * 13;
  const hash = ((minuteSeed * 48271) % 2147483647) / 2147483647;

  if (variant === "store") {
    const min = Math.max(1, Math.round(2 * factor));
    const max = Math.max(min + 1, Math.round(9 * factor));
    return Math.round(hash * (max - min) + min);
  }

  const min = 1;
  const max = Math.max(2, Math.round(5 * factor));
  return Math.round(hash * (max - min) + min);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Generate or retrieve a session ID for this browser tab */
function getSessionId(): string {
  const key = "vortixy_visitor_sid";
  try {
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return crypto.randomUUID();
  }
}

export function LiveVisitors({
  variant = "store",
  className,
}: LiveVisitorsProps) {
  const [fakeCount, setFakeCount] = useState<number | null>(null);
  const [realCount, setRealCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertReportedRef = useRef(false);
  const { t } = useLanguage();

  // Initialize fake base count on mount
  useEffect(() => {
    setFakeCount(deriveBaseCount(variant));
  }, [variant]);

  // Heartbeat: ping the API every 30s to register this visitor
  useEffect(() => {
    const sessionId = getSessionId();
    let pingCount = 0;

    const ping = async () => {
      pingCount++;
      try {
        const res = await fetch("/api/internal/live-visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") {
          setRealCount(data.count);
        }
        
        // Report to visitor alert endpoint on 2nd ping (after ~30s = human behavior)
        if (pingCount >= 2 && !alertReportedRef.current) {
          alertReportedRef.current = true;
          await fetch("/api/internal/visitor-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              path: window.location.pathname,
              referrer: document.referrer || null,
            }),
          }).catch(() => {});
        }
      } catch {
        // Silent fail - fake count still shows
      }
    };

    void ping();
    heartbeatRef.current = setInterval(ping, 30_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  // Drift the fake count every 25-50s
  const drift = useCallback(() => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const hourFactors = [
      0.08, 0.05, 0.04, 0.03, 0.04, 0.06,
      0.18, 0.35, 0.52, 0.68, 0.82, 0.90,
      0.88, 0.78, 0.72, 0.75, 0.80, 0.85,
      0.92, 0.95, 0.88, 0.70, 0.45, 0.22,
    ];
    const weekendDamping = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1;
    const factor = (hourFactors[hour] ?? 0.5) * weekendDamping;

    const floor = variant === "store"
      ? Math.max(1, Math.round(2 * factor))
      : 1;
    const ceil = variant === "store"
      ? Math.max(floor + 1, Math.round(9 * factor))
      : Math.max(2, Math.round(5 * factor));

    setFakeCount((prev) => {
      if (prev === null) return prev;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const step = Math.random() > 0.7 ? 2 : 1;
      return clamp(prev + direction * step, floor, ceil);
    });
  }, [variant]);

  useEffect(() => {
    if (fakeCount === null) return;

    const delay = (Math.random() * 25 + 25) * 1000;
    intervalRef.current = setInterval(() => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => drift());
      } else {
        drift();
      }
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fakeCount]);

  if (fakeCount === null) return null;

  // Total = fake base + real visitors
  const displayCount = fakeCount + realCount;

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]",
        className,
      )}
    >
      {variant === "store" ? (
        <>
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 animate-pulse" />
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400/30 animate-ping" />
          </span>
          <span className="text-[var(--muted-strong)]">
            <span className="font-semibold tabular-nums text-[var(--foreground)]">
              {displayCount}
            </span>{" "}
            {t("liveVisitors.storeLabel")}
          </span>
        </>
      ) : (
        <span className="text-[var(--muted-strong)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400/40 animate-ping" />
            </span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">
              {displayCount}
            </span>
          </span>{" "}
          {t("liveVisitors.productLabel")}
        </span>
      )}
    </div>
  );
}
