"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

const FIRST_NAMES = [
  "Carlos", "Andres", "Juan", "Diego", "Mateo", "Santiago",
  "Maria", "Camila", "Valentina", "Paola", "Laura", "Daniela",
  "Luis", "Jorge", "Javier", "Diana", "Carolina", "Natalia",
  "Felipe", "Sebastian", "Isabella", "Mariana", "Alejandro",
  "Sofia", "Nicolas", "Gabriela", "Ricardo",
];

const CITIES = [
  "Medellin", "Bogota", "Cali", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Santa Marta", "Villavicencio",
  "Ibague", "Pasto", "Cucuta", "Monteria", "Neiva",
  "Armenia", "Popayan", "Sincelejo", "Tunja", "Valledupar",
  "Florencia", "Riohacha", "Yopal", "Quibdo", "Sogamoso",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTime(): number {
  return Math.floor(Math.random() * 165) + 15;
}

export function RecentPurchaseToast() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{ name: string; city: string; time: number } | null>(null);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();

  useEffect(() => {
    let currentTimeout: number;
    let isFirstToast = true;

    const scheduleNext = () => {
      setShow(false);

      const delayMs = isFirstToast
        ? 90000
        : Math.floor(Math.random() * 420000) + 480000;

      isFirstToast = false;

      currentTimeout = window.setTimeout(() => {
        setData({
          name: getRandomItem(FIRST_NAMES),
          city: getRandomItem(CITIES),
          time: getRandomTime()
        });
        setShow(true);

        currentTimeout = window.setTimeout(() => {
          setShow(false);
          scheduleNext();
        }, 5000);
      }, delayMs);
    };

    scheduleNext();

    return () => clearTimeout(currentTimeout);
  }, []);

  if (!data) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed z-[60] left-4 sm:left-6 max-w-xs sm:max-w-sm right-4 sm:right-auto transition-all duration-500 ease-out pointer-events-none",
        isCheckout ? "bottom-40 sm:bottom-6" : "bottom-24 sm:bottom-6",
        show ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
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
              <strong className="text-[var(--foreground)] font-semibold">{data.name}</strong>{" "}
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
