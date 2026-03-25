"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ShieldCheck, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useDeliveryEstimate } from "@/lib/use-delivery-estimate";
import { usePathname } from "next/navigation";
import { getRouteChromeConfig } from "@/lib/route-chrome";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "vortixy_announcement_dismissed";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function AnnouncementBar({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();
  const pathname = usePathname();
  const deliveryEstimate = useDeliveryEstimate();
  const chrome = getRouteChromeConfig(pathname);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration pattern is intentional
    setIsHydrated(true);
    
    // Check persistence
    const lastDismissed = localStorage.getItem(DISMISS_KEY);
    if (lastDismissed) {
      const timeSinceDismiss = Date.now() - parseInt(lastDismissed, 10);
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

  // Auto-rotate messages on mobile every 4s
  useEffect(() => {
    if (!visible || !isHydrated) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [visible, isHydrated, messages.length]);

  if (!isHydrated || !visible || !chrome.showAnnouncementBar) return null;

  return (
    <div className={cn("relative z-[60] bg-gradient-to-r from-[#052e1a] via-[#063d24] to-[#052e1a] text-white/90 overflow-hidden", className)}>
      <div className="mx-auto flex min-h-[36px] max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
        {/* Desktop View: All visible */}
        <div className="hidden items-center justify-center gap-6 text-[13px] font-medium sm:flex w-full px-8">
          {messages.map((message, index) => (
            <span key={index} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="mr-4 h-3 w-px bg-white/20" /> : null}
              <message.icon className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{message.text}</span>
            </span>
          ))}
        </div>

        {/* Mobile View: Rotating Carousel */}
        <div className="flex w-full items-center justify-center pr-6 sm:hidden min-h-[24px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/95"
            >
              {(() => {
                const CurrentIcon = messages[currentIndex].icon;
                return (
                  <>
                    <CurrentIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>{messages[currentIndex].text}</span>
                  </>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        aria-label={t("common.close")}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
