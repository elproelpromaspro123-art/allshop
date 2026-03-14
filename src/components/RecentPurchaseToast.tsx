"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

const FIRST_NAMES = [
  "Carlos", "Andres", "Juan", "Diego", "Mateo", "Santiago",
  "Maria", "Camila", "Valentina", "Paola", "Laura", "Daniela",
  "Luis", "Jorge", "Javier", "Diana", "Carolina", "Natalia"
];

const CITIES = [
  "Medellin", "Bogota", "Cali", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Santa Marta", "Villavicencio"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTime(): number {
  return Math.floor(Math.random() * 165) + 15; // entre 15 y 180 mins
}

export function RecentPurchaseToast() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{ name: string; city: string; time: number } | null>(null);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const { t } = useLanguage();

  useEffect(() => {
    // Only show on client to avoid hydration mismatch
    let currentTimeout: number;
    let isFirstToast = true;

    const scheduleNext = () => {
      // Hide if currently shown
      setShow(false);
      
      // First toast after 60 seconds, subsequent toasts between 8 and 15 minutes
      const delayMs = isFirstToast 
        ? 60000 
        : Math.floor(Math.random() * 420000) + 480000;
      
      isFirstToast = false;

      currentTimeout = window.setTimeout(() => {
        setData({
          name: getRandomItem(FIRST_NAMES),
          city: getRandomItem(CITIES),
          time: getRandomTime()
        });
        setShow(true);

        // Hide after 5 seconds instead of 6 to be slightly less intrusive
        currentTimeout = window.setTimeout(() => {
          setShow(false);
          scheduleNext();
        }, 5000);
      }, delayMs);
    };

    // Initial trigger
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
      <div className="bg-white/95 backdrop-blur-md border border-[var(--border)] shadow-[var(--shadow-toast)] rounded-[var(--card-radius)] p-3 sm:p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-[var(--muted)] leading-tight">
            <strong className="text-[var(--foreground)] font-semibold">{data.name}</strong>{" "}
            {t("recentPurchase.messageSuffix", { city: data.city })}
          </p>
          <p className="text-[10px] sm:text-xs text-[var(--muted-faint)] mt-0.5">
            {t("recentPurchase.timeAgo", { minutes: data.time })}
          </p>
        </div>
      </div>
    </div>
  );
}

