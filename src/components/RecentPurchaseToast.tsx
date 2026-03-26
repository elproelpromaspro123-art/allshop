"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { MarketingBadgePill } from "@/components/marketing/MarketingPrimitives";

const FIRST_NAMES = [
  "Carlos",
  "Andrés",
  "Juan",
  "Diego",
  "Mateo",
  "Santiago",
  "María",
  "Camila",
  "Valentina",
  "Paola",
  "Laura",
  "Daniela",
  "Luis",
  "Jorge",
  "Javier",
  "Diana",
  "Carolina",
  "Natalia",
  "Felipe",
  "Sebastián",
  "Isabella",
  "Mariana",
  "Alejandro",
  "Sofía",
  "Nicolás",
  "Gabriela",
  "Ricardo",
  "Óscar",
  "Juliana",
  "Esteban",
  "Andrea",
  "Sara",
  "Manuel",
  "Tatiana",
  "David",
];

const CITIES = [
  "Medellín",
  "Bogotá",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Manizales",
  "Santa Marta",
  "Villavicencio",
  "Ibagué",
  "Pasto",
  "Cúcuta",
  "Montería",
  "Neiva",
  "Armenia",
  "Popayán",
  "Sincelejo",
  "Tunja",
  "Valledupar",
  "Florencia",
  "Riohacha",
  "Yopal",
  "Sogamoso",
];

function seededRandom(seed: number): number {
  return ((seed * 48271) % 2147483647) / 2147483647;
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed) % pool.length];
}

function realisticMinutesAgo(seed: number): number {
  const r = seededRandom(seed);
  if (r < 0.3) return Math.floor(r * 30 + 5);
  if (r < 0.7) return Math.floor(r * 80 + 10);
  return Math.floor(r * 120 + 60);
}

function nextDelay(isFirst: boolean): number {
  if (isFirst) {
    return Math.floor(Math.random() * 90_000) + 90_000;
  }
  return Math.floor(Math.random() * 360_000) + 480_000;
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
        "fixed left-4 right-4 z-[60] max-w-xs transition-all duration-500 ease-out pointer-events-none sm:left-6 sm:right-auto sm:max-w-sm",
        isCheckout ? "bottom-40 sm:bottom-6" : "bottom-24 sm:bottom-6",
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none",
      )}
    >
      <div className="relative overflow-hidden rounded-[1.55rem] border border-emerald-200/60 bg-white/96 p-3.5 shadow-[0_20px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/85 via-white to-transparent" />
        <div className="relative z-[1] flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-[0_10px_24px_rgba(16,185,129,0.12)]">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <MarketingBadgePill label="Compra reciente" tone="emerald" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Señal de actividad
              </span>
            </div>

            <div className="mt-2 flex items-start gap-2">
              <ShoppingBag className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-600">
                <strong className="font-bold text-slate-950">{data.name}</strong>{" "}
                {t("recentPurchase.messageSuffix", { city: data.city })}
              </p>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-400">
              {t("recentPurchase.timeAgo", { minutes: data.time })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
