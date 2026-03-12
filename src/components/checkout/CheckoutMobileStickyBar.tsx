"use client";

import { ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[50] lg:hidden",
        "border-t bg-white/95 backdrop-blur-md",
        "border-[var(--border)]",
        "px-4 py-3 safe-area-inset-bottom"
      )}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-500">Total a pagar</p>
          <p className="text-lg font-bold text-[var(--foreground)] truncate">{total}</p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-sm font-bold shadow-[0_4px_16px_-4px_rgba(0,140,85,0.5)] shrink-0"
          onClick={onCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          Confirmar
        </Button>
      </div>
    </div>
  );
}
