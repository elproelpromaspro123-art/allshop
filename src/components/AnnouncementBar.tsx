"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
import { usePathname } from "next/navigation";
import { getRouteChromeConfig } from "@/lib/route-chrome";
import { AnimatePresence, motion } from "framer-motion";

const DISMISS_KEY = "vortixy_announcement_dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();
  const pathname = usePathname();
  const deliveryEstimate = useDeliveryEstimate();
  const chrome = getRouteChromeConfig(pathname);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag prevents announcement hydration drift
    setIsHydrated(true);

    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed) {
      const timeSinceDismiss = Date.now() - Number.parseInt(lastDismissed, 10);
      if (timeSinceDismiss < DISMISS_DURATION) {
        setVisible(false);
        return;
      }
    }

    setVisible(true);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const codText = t("announcement.cod");
  const shippingShortText = t("announcement.shippingShort");
  const whatsappShortText = t("announcement.whatsappShort");
  const whatsappText = t("announcement.whatsapp");

  const deliveryText =
    isHydrated && deliveryEstimate
      ? `Envíos Colombia · ${deliveryEstimate.min}-${deliveryEstimate.max} días hábiles`
      : "Envío calculado por destino";

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
    if (!visible || !isHydrated) return;

    const interval = setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHydrated, messages.length, visible]);

  if (!isHydrated || !visible || !chrome.showAnnouncementBar) return null;

  return (
    <div className={cn("announcement-surface relative z-[60] overflow-hidden text-white", className)}>
      <div className="mx-auto flex min-h-[42px] max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
        <div className="hidden w-full items-center justify-center gap-3 lg:flex">
          {messages.map((message, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/88"
            >
              <message.icon className="h-3.5 w-3.5 text-emerald-300" />
              <span>{message.text}</span>
            </span>
          ))}
        </div>

        <div className="flex w-full items-center justify-center pr-6 lg:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.24, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white/88"
            >
              {(() => {
                const CurrentIcon = messages[currentIndex].icon;
                return (
                  <>
                    <CurrentIcon className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{messages[currentIndex].text}</span>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/66 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
