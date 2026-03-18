"use client";

import { useState } from "react";
import { ShieldCheck, Truck, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
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

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative z-[60] bg-[#052e1a] text-white/90",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-2 min-h-[36px]">
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{codText !== "announcement.cod" ? codText : "Pago contraentrega"}</span>
          </span>
          <span className="w-px h-3 bg-white/20 hidden sm:block" />
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{shippingLabel}</span>
          </span>
          <span className="w-px h-3 bg-white/20 hidden sm:block" />
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>{whatsappLabel}</span>
          </span>
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
