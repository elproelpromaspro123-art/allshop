"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

interface LiveVisitorsProps {
  variant?: "store" | "product";
  className?: string;
}

function deriveBaseCount(variant: "store" | "product"): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  const hourFactors = [
    0.08, 0.05, 0.04, 0.03, 0.04, 0.06, 0.18, 0.35, 0.52, 0.68, 0.82, 0.9,
    0.88, 0.78, 0.72, 0.75, 0.8, 0.85, 0.92, 0.95, 0.88, 0.7, 0.45, 0.22,
  ];

  const weekendDamping = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1;
  const factor = (hourFactors[hour] ?? 0.5) * weekendDamping;

  const minuteSeed =
    now.getFullYear() * 527 +
    (now.getMonth() + 1) * 389 +
    now.getDate() * 197 +
    hour * 67 +
    now.getMinutes() * 13;
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
  const [fakeCount, setFakeCount] = useState(0);
  const [realCount, setRealCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertReportedRef = useRef(false);
  const { t } = useLanguage();

  useEffect(() => {
    setFakeCount(deriveBaseCount(variant));
  }, [variant]);

  useEffect(() => {
    const sessionId = getSessionId();
    let pingCount = 0;

    const ping = async () => {
      pingCount += 1;
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
        // Silent fail - the signal should never block the page.
      }
    };

    void ping();
    heartbeatRef.current = setInterval(ping, 30_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  const drift = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const hourFactors = [
      0.08, 0.05, 0.04, 0.03, 0.04, 0.06, 0.18, 0.35, 0.52, 0.68, 0.82, 0.9,
      0.88, 0.78, 0.72, 0.75, 0.8, 0.85, 0.92, 0.95, 0.88, 0.7, 0.45, 0.22,
    ];
    const weekendDamping = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1;
    const factor = (hourFactors[hour] ?? 0.5) * weekendDamping;

    const floor =
      variant === "store" ? Math.max(1, Math.round(2 * factor)) : 1;
    const ceil =
      variant === "store"
        ? Math.max(floor + 1, Math.round(9 * factor))
        : Math.max(2, Math.round(5 * factor));

    setFakeCount((prev) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      const step = Math.random() > 0.7 ? 2 : 1;
      return clamp(prev + direction * step, floor, ceil);
    });
  }, [variant]);

  useEffect(() => {
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
  }, [drift]);

  const displayCount = fakeCount + realCount;

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-sm shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur",
        className,
      )}
    >
      {variant === "store" ? (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500" />
            <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400/30 animate-ping" />
          </span>
          <span className="text-slate-600">
            <span className="font-semibold tabular-nums text-slate-950">
              {displayCount}
            </span>{" "}
            {t("liveVisitors.storeLabel")}
          </span>
        </>
      ) : (
        <span className="text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400/40 animate-ping" />
            </span>
            <span className="font-semibold tabular-nums text-slate-950">
              {displayCount}
            </span>
          </span>{" "}
          {t("liveVisitors.productLabel")}
        </span>
      )}
    </div>
  );
}
