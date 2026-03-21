"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const { t } = useLanguage();
  const deliveryEstimate = useDeliveryEstimate();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const codText = t("announcement.cod");
  const shippingShortText = t("announcement.shippingShort");
  const whatsappShortText = t("announcement.whatsappShort");
  const whatsappText = t("announcement.whatsapp");

  const deliveryText =
    isHydrated && deliveryEstimate
      ? `Envíos a toda Colombia · ${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
      : "Calculando tiempo de envío...";

  const shippingLabel =
    shippingShortText !== "announcement.shippingShort"
      ? shippingShortText
      : deliveryText;

  const whatsappLabel =
    whatsappShortText !== "announcement.whatsappShort"
      ? whatsappShortText
      : whatsappText !== "announcement.whatsapp"
        ? whatsappText
        : "Soporte por WhatsApp";

  const messages = [
    {
      icon: ShieldCheck,
      text: codText !== "announcement.cod" ? codText : "Pago contraentrega",
    },
    { icon: Truck, text: shippingLabel },
    { icon: MessageCircle, text: whatsappLabel },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!visible) return null;

  return (
    <div className={cn("relative z-[60] bg-[#052e1a] text-white/90", className)}>
      <div className="mx-auto flex min-h-[36px] max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-4 text-xs font-medium sm:flex">
          {messages.map((message, index) => (
            <span key={index} className="inline-flex items-center gap-1.5">
              {index > 0 ? <span className="mr-0 h-3 w-px bg-white/20" /> : null}
              <message.icon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <span>{message.text}</span>
            </span>
          ))}
        </div>

        <div className="relative h-5 overflow-hidden sm:hidden">
          {messages.map((message, index) => {
            const Icon = message.icon;

            return (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all duration-500",
                  index === activeIndex
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                <span>{message.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => setVisible(false)}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
