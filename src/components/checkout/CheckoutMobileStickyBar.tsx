"use client";

import { ShieldCheck, Loader2 } from "lucide-react";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { useLanguage } from "@/providers/LanguageProvider";

interface CheckoutMobileStickyBarProps {
  total: string;
  isLoading: boolean;
  onCheckout: () => void;
}

export function CheckoutMobileStickyBar({
  total,
  isLoading,
  onCheckout,
}: CheckoutMobileStickyBarProps) {
  const { t } = useLanguage();

  return (
    <StickyActionBar
      eyebrow={
        t("checkout.securePurchase") !== "checkout.securePurchase"
          ? t("checkout.securePurchase")
          : "Compra protegida"
      }
      value={total}
      actionLabel={t("checkout.confirm")}
      actionIcon={
        isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />
      }
      onAction={onCheckout}
      disabled={isLoading}
      className="animate-[slide-up_300ms_ease-out]"
      testId="checkout-sticky-bar"
    />
  );
}
