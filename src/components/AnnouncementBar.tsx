"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Truck, X, Sparkles, MessageCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

const ROTATION_MS = 4500;

interface AnnouncementMessage {
  icon: typeof ShieldCheck;
  textKey: string;
  fallback: string;
}

const MESSAGES: AnnouncementMessage[] = [
  { icon: ShieldCheck, textKey: "announcement.cod", fallback: "Pago contraentrega — pagas cuando recibes" },
  { icon: Truck, textKey: "announcement.shippingTime", fallback: "Envíos a toda Colombia · 3-7 días hábiles" },
  { icon: Sparkles, textKey: "announcement.coverage", fallback: "Catálogo disponible las 24 horas" },
  { icon: MessageCircle, textKey: "announcement.whatsapp", fallback: "Soporte personalizado por WhatsApp" },
  { icon: MapPin, textKey: "announcement.national", fallback: "Cobertura nacional · Más de 1.000 municipios" },
];

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { t } = useLanguage();

  const rotateMessage = useCallback(() => {
    setAnimating(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % MESSAGES.length);
      setAnimating(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(rotateMessage, ROTATION_MS);
    return () => clearInterval(timer);
  }, [visible, rotateMessage]);

  if (!visible) return null;

  const current = MESSAGES[activeIndex];
  const Icon = current.icon;
  const text = t(current.textKey) || current.fallback;

  return (
    <div
      className={cn(
        "relative z-[60] bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 text-white",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-2.5 min-h-[36px]">
        <div
          className={cn(
            "inline-flex items-center gap-2 text-[11px] sm:text-xs font-medium transition-all duration-300",
            animating ? "opacity-0 translate-y-[-6px]" : "opacity-100 translate-y-0"
          )}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{text}</span>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/15 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
