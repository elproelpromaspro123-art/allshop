"use client";

import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
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
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[50] lg:hidden",
        "border-t border-white/10 bg-[rgba(8,19,15,0.88)] text-white backdrop-blur-xl",
        "px-4 py-3 safe-area-inset-bottom",
        "shadow-[0_-8px_30px_rgba(10,15,30,0.16)]",
        "animate-[slide-up_300ms_ease-out]",
      )}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Lock className="w-3 h-3 text-emerald-300" />
            <p className="text-[10px] font-medium text-emerald-300">
              {t("checkout.securePurchase") !== "checkout.securePurchase"
                ? t("checkout.securePurchase")
                : "Compra protegida"}
            </p>
          </div>
          <p className="text-lg font-bold text-white truncate">{total}</p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-sm font-bold shadow-[var(--shadow-action)] shrink-0"
          onClick={onCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {t("checkout.confirm")}
        </Button>
      </div>
    </div>
  );
}
