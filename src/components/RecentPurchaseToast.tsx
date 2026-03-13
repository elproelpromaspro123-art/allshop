"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FIRST_NAMES = [
  "Carlos", "Andrés", "Juan", "Diego", "Mateo", "Santiago",
  "María", "Camila", "Valentina", "Paola", "Laura", "Daniela",
  "Luis", "Jorge", "Javier", "Diana", "Carolina", "Natalia"
];

const CITIES = [
  "Medellín", "Bogotá", "Cali", "Barranquilla", "Cartagena",
  "Bucaramanga", "Pereira", "Manizales", "Santa Marta", "Villavicencio"
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTime(): number {
  return Math.floor(Math.random() * 45) + 2; // entre 2 y 46 mins
}

export function RecentPurchaseToast() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<{ name: string; city: string; time: number } | null>(null);
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";

  useEffect(() => {
    // Only show on client to avoid hydration mismatch
    let currentTimeout: number;
    let isFirstToast = true;

    const scheduleNext = () => {
      // Hide if currently shown
      setShow(false);
      
      // First toast after 10 seconds, subsequent toasts between 2 and 3 minutes
      const delayMs = isFirstToast 
        ? 10000 
        : Math.floor(Math.random() * 60000) + 120000;
      
      isFirstToast = false;

      currentTimeout = window.setTimeout(() => {
        setData({
          name: getRandomItem(FIRST_NAMES),
          city: getRandomItem(CITIES),
          time: getRandomTime()
        });
        setShow(true);

        // Hide after 6 seconds
        currentTimeout = window.setTimeout(() => {
          setShow(false);
          scheduleNext();
        }, 6000);
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
      <div className="bg-white/95 backdrop-blur-md border border-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 sm:p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-neutral-600 leading-tight">
            <strong className="text-neutral-900 font-semibold">{data.name}</strong> de {data.city} acaba de comprar un producto.
          </p>
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
            Hace {data.time} minutos
          </p>
        </div>
      </div>
    </div>
  );
}
