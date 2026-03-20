"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

/* ── Realistic Colombian name & city pools ────────────────────────── */

const FIRST_NAMES = [
  "Carlos", "Andrés", "Juan", "Diego", "Mateo", "Santiago",
  "María", "Camila", "Valentina", "Paola", "Laura", "Daniela",
  "Luis", "Jorge", "Javier", "Diana", "Carolina", "Natalia",
  "Felipe", "Sebastián", "Isabella", "Mariana", "Alejandro",
  "Sofía", "Nicolás", "Gabriela", "Ricardo", "Óscar", "Juliana",
  "Esteban", "Andrea", "Sara", "Manuel", "Tatiana", "David",
];

const CITIES = [
  "Medellín", "Bogotá", "Cali", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Santa Marta",
  "Villavicencio", "Ibagué", "Pasto", "Cúcuta", "Montería",
  "Neiva", "Armenia", "Popayán", "Sincelejo", "Tunja",
  "Valledupar", "Florencia", "Riohacha", "Yopal", "Sogamoso",
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function seededRandom(seed: number): number {
  return ((seed * 48271) % 2147483647) / 2147483647;
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed) % pool.length];
}

/**
 * Returns a realistic "minutes ago" value.  We avoid <5 min so it
 * doesn't feel suspiciously instant, and cap at 180 min so it stays
 * plausible.
 */
function realisticMinutesAgo(seed: number): number {
  const r = seededRandom(seed);
  // Weighted toward 10-90 min range
  if (r < 0.3) return Math.floor(r * 30 + 5);      // 5-14 min
  if (r < 0.7) return Math.floor(r * 80 + 10);      // 10-66 min
  return Math.floor(r * 120 + 60);                   // 60-180 min
}

/**
 * Computes delays that vary between 8-14 minutes (480-840 s).
 * The first toast appears after 90-180 s so it's not immediate.
 */
function nextDelay(isFirst: boolean): number {
  if (isFirst) {
    return Math.floor(Math.random() * 90_000) + 90_000; // 90-180 s
  }
  return Math.floor(Math.random() * 360_000) + 480_000;  // 8-14 min
}

export function RecentPurchaseToast() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{
    name: string;
    city: string;
    time: number;
  } | null>(null);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();

  const generateData = useCallback(() => {
    const now = Date.now();
    const seed = now ^ (now >>> 16);
    return {
      name: pickFromPool(FIRST_NAMES, seed),
      city: pickFromPool(CITIES, seed ^ 0x5bd1e995),
      time: realisticMinutesAgo(seed ^ 0x1b873593),
    };
  }, []);

  useEffect(() => {
    let outerTimeout: number | undefined;
    let innerTimeout: number | undefined;
    let isFirstToast = true;

    const scheduleNext = () => {
      setShow(false);

      const delayMs = nextDelay(isFirstToast);
      isFirstToast = false;

      outerTimeout = window.setTimeout(() => {
        setData(generateData());
        setShow(true);

        // Show for 5 seconds then fade out
        innerTimeout = window.setTimeout(() => {
          setShow(false);
          scheduleNext();
        }, 5000);
      }, delayMs);
    };

    scheduleNext();

    return () => {
      if (outerTimeout) clearTimeout(outerTimeout);
      if (innerTimeout) clearTimeout(innerTimeout);
    };
  }, [generateData]);

  if (!data) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed z-[60] left-4 sm:left-6 max-w-xs sm:max-w-sm right-4 sm:right-auto transition-all duration-500 ease-out pointer-events-none",
        isCheckout ? "bottom-40 sm:bottom-6" : "bottom-24 sm:bottom-6",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none",
      )}
    >
      <div className="bg-white/98 backdrop-blur-xl border border-[var(--border-subtle)] shadow-2xl shadow-black/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 overflow-hidden relative">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent pointer-events-none" />

        {/* Icon with premium styling */}
        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center shrink-0 shadow-md border border-emerald-200/50 z-10">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-tight">
              <strong className="text-[var(--foreground)] font-semibold">
                {data.name}
              </strong>{" "}
              {t("recentPurchase.messageSuffix", { city: data.city })}
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-[var(--muted-faint)] mt-0.5">
            {t("recentPurchase.timeAgo", { minutes: data.time })}
          </p>
        </div>
      </div>
    </div>
  );
}
