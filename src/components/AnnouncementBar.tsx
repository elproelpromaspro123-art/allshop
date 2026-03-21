"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Truck, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLanguage();

  const codText = t("announcement.cod");
  const shippingShortText = t("announcement.shippingShort");
  const shippingTimeText = t("announcement.shippingTime");
  const whatsappShortText = t("announcement.whatsappShort");
  const whatsappText = t("announcement.whatsapp");

  const shippingLabel =
    shippingShortText !== "announcement.shippingShort"
      ? shippingShortText
      : shippingTimeText !== "announcement.shippingTime"
        ? shippingTimeText
        : "Envíos a toda Colombia";

  const whatsappLabel =
    whatsappShortText !== "announcement.whatsappShort"
      ? whatsappShortText
      : whatsappText !== "announcement.whatsapp"
        ? whatsappText
        : "Soporte por WhatsApp";

  const messages = [
    { icon: ShieldCheck, text: codText !== "announcement.cod" ? codText : "Pago contraentrega" },
    { icon: Truck, text: shippingLabel },
    { icon: MessageCircle, text: whatsappLabel },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!visible) return null;

  return (
    <div
      className={cn("relative z-[60] bg-[#052e1a] text-white/90", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-2 min-h-[36px]">
        {/* Desktop: show all */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-medium">
          {messages.map((msg, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="w-px h-3 bg-white/20 mr-0" />}
              <msg.icon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{msg.text}</span>
            </span>
          ))}
        </div>

        {/* Mobile: rotate one at a time */}
        <div className="sm:hidden relative h-5 overflow-hidden">
          {messages.map((msg, i) => {
            const Icon = msg.icon;
            return (
              <div
                key={i}
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all duration-500",
                  i === activeIndex
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-3 pointer-events-none",
                )}
              >
                <Icon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
