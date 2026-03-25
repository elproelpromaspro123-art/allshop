"use client";

import { ShieldCheck, Loader2, ShoppingBag } from "lucide-react";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { useLanguage } from "@/providers/LanguageProvider";

interface CheckoutMobileStickyBarProps {
  total: string;
  isLoading: boolean;
  isLoadingEstimate?: boolean;
  itemCount?: number;
  onCheckout: () => void;
}

export function CheckoutMobileStickyBar({
  total,
  isLoading,
  isLoadingEstimate = false,
  itemCount,
  onCheckout,
}: CheckoutMobileStickyBarProps) {
  const { t } = useLanguage();
  const isDisabled = isLoading || isLoadingEstimate;

  return (
    <StickyActionBar
      eyebrow={
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          {t("checkout.securePurchase") !== "checkout.securePurchase"
            ? t("checkout.securePurchase")
            : "Compra protegida"}
          {itemCount != null && itemCount > 0 && (
            <span className="flex items-center gap-0.5 ml-1 opacity-70">
              <ShoppingBag className="h-2.5 w-2.5" />
              {itemCount}
            </span>
          )}
        </span>
      }
      value={total}
      actionLabel={isLoadingEstimate ? "Calculando..." : t("checkout.confirm")}
      actionIcon={
        isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />
      }
      onAction={onCheckout}
      disabled={isDisabled}
      className="animate-[slide-up_300ms_ease-out]"
      testId="checkout-sticky-bar"
    />
  );
}
