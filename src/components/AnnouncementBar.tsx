"use client";

import { useState } from "react";
import { ShieldCheck, Truck, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative z-[60] bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white",
        "bg-[length:200%_100%] animate-gradient-subtle",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-x-5 gap-y-1 py-2 text-[11px] sm:text-xs font-medium flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          {t("announcement.cod")}
        </span>
        <span
          className="hidden sm:inline-block w-px h-3 bg-white/30"
          aria-hidden
        />
        <span className="inline-flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 shrink-0" />
          {t("announcement.shippingTime")}
        </span>
        <span
          className="hidden md:inline-block w-px h-3 bg-white/30"
          aria-hidden
        />
        <span className="inline-flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
          <Sparkles className="w-3 h-3 shrink-0 opacity-80" />
          {t("announcement.coverage")}
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
      >
        <span className="sr-only">{t("common.close")}</span>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
