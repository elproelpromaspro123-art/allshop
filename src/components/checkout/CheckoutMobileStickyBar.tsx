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
        "border-t bg-white/95 backdrop-blur-xl",
        "border-[var(--border-subtle)]",
        "px-4 py-3 safe-area-inset-bottom",
        "shadow-[0_-2px_12px_rgba(0,0,0,0.06)]",
        "animate-[slide-up_300ms_ease-out]"
      )}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <p className="text-[10px] font-medium text-emerald-700">{t("checkout.securePurchase") !== "checkout.securePurchase" ? t("checkout.securePurchase") : "Compra protegida"}</p>
          </div>
          <p className="text-lg font-bold text-[var(--foreground)] truncate">{total}</p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-sm font-bold shadow-md shadow-emerald-500/20 shrink-0"
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
