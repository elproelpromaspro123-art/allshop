"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Copy, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import { useTheme } from "@/providers/ThemeProvider";
import type { Order, OrderStatus } from "@/types/database";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const { t } = useLanguage();
  const {
    formatDisplayPrice,
    formatPaymentPrice,
    isDisplayDifferentFromPayment,
  } = usePricing();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const orderToken = searchParams.get("order_token");

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusLabels: Record<OrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const loadOrder = async () => {
      setLoadingOrder(true);
      try {
        const tokenQuery = orderToken
          ? `?token=${encodeURIComponent(orderToken)}`
          : "";
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${tokenQuery}`);
        const data = (await res.json()) as { order: Order | null };
        if (!cancelled) setOrder(data.order);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    };

    void loadOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, orderToken]);

  const displayReference = order?.id || orderId || paymentId;
  const displayEmail = order?.customer_email;
  const isPendingConfirmation = order?.status === "pending";
  const firstName = useMemo(() => {
    if (order?.customer_name) return order.customer_name.split(" ")[0];
    return null;
  }, [order?.customer_name]);

  const handleCopyId = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#0a0b0f]" : "bg-[var(--background)]")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
          isDark ? "bg-emerald-500/15" : "bg-emerald-100"
        )}>
          <CheckCircle2 className={cn("w-10 h-10", isDark ? "text-emerald-400" : "text-emerald-600")} />
        </div>
        <h1 className={cn("text-3xl font-bold mb-3", isDark ? "text-white" : "text-[var(--foreground)]")}>
          {isPendingConfirmation ? t("order.pendingTitle") : t("order.confirmedTitle")}
        </h1>
        <p className={cn("text-lg mb-2", isDark ? "text-neutral-400" : "text-neutral-500")}>
          {isPendingConfirmation
            ? t("order.pendingSubtitle")
            : firstName
              ? t("order.confirmedWithName", { name: firstName })
              : t("order.confirmedWithoutName")}
        </p>
        {isPendingConfirmation && (
          <p className={cn("text-sm mb-2", isDark ? "text-neutral-500" : "text-neutral-500")}>{t("order.pendingDescription")}</p>
        )}

        {displayReference && (
          <div className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-6",
            isDark ? "bg-white/[0.05] border border-white/[0.08]" : "bg-neutral-100"
          )}>
            <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
            <span className={cn("text-sm font-semibold font-mono", isDark ? "text-white" : "text-neutral-900")}>
              {displayReference}
            </span>
            <button
              onClick={handleCopyId}
              className={cn(
                "transition-colors",
                copied ? "text-emerald-500" : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-neutral-700"
              )}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}

        {loadingOrder && (
          <div className="mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400 mx-auto" />
          </div>
        )}

        {order && (
          <div className={cn(
            "rounded-2xl p-5 mb-6 text-left border",
            isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-neutral-50 border-transparent"
          )}>
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
              {t("order.summaryTitle")}
            </p>
            <div className={cn("space-y-1 text-sm", isDark ? "text-neutral-300" : "text-neutral-700")}>
              <p>
                {t("order.summaryStatus")}:{" "}
                <span className="font-semibold">{statusLabels[order.status] ?? order.status}</span>
              </p>
              <p>
                {t("order.summaryTotal")}: <span className="font-semibold">{formatDisplayPrice(order.total)}</span>
              </p>
              <p>
                {t("order.summaryItems")}: <span className="font-semibold">{order.items.length}</span>
              </p>
              {isDisplayDifferentFromPayment && (
                <p>
                  <span className="font-semibold">{formatPaymentPrice(order.total)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {displayEmail && (
          <p className={cn("text-sm mb-8", isDark ? "text-neutral-500" : "text-neutral-400")}>
            {t("order.emailNotice", { email: displayEmail })}
          </p>
        )}

        <div className={cn(
          "rounded-2xl p-6 mb-8 text-left border",
          isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-neutral-50 border-transparent"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <Package className={cn("w-5 h-5", isDark ? "text-neutral-400" : "text-neutral-600")} />
            <span className={cn("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>
              {t("order.nextSteps")}
            </span>
          </div>
          <ul className={cn("space-y-2 text-sm", isDark ? "text-neutral-400" : "text-neutral-600")}>
            <li>{t("order.step1")}</li>
            <li>{t("order.step2")}</li>
            <li>{t("order.step3")}</li>
          </ul>
        </div>

        <Link href="/">
          <Button size="lg" className="gap-2">
            {t("order.continueShopping")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
