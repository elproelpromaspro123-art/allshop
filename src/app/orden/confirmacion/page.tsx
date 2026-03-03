"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
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

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id");
  const orderId = searchParams.get("order_id");
  const reference = orderId || paymentId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const statusLabels: Record<OrderStatus, string> = {
    pending: t("admin.status.pending"),
    paid: t("admin.status.paid"),
    processing: t("admin.status.processing"),
    shipped: t("admin.status.shipped"),
    delivered: t("admin.status.delivered"),
    cancelled: t("admin.status.cancelled"),
    refunded: t("admin.status.refunded"),
  };

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;
    const loadOrder = async () => {
      setLoadingOrder(true);
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(reference)}`);
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
  }, [reference]);

  const displayReference = order?.id || orderId || paymentId;
  const displayEmail = order?.customer_email;
  const firstName = useMemo(() => {
    if (order?.customer_name) return order.customer_name.split(" ")[0];
    return null;
  }, [order?.customer_name]);

  const handleCopyId = () => {
    if (displayReference) {
      navigator.clipboard.writeText(displayReference);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        {t("order.confirmedTitle")}
      </h1>
      <p className="text-neutral-500 text-lg mb-2">
        {firstName
          ? t("order.confirmedWithName", { name: firstName })
          : t("order.confirmedWithoutName")}
      </p>

      {displayReference && (
        <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-xl px-4 py-2 mb-6">
          <span className="text-sm text-neutral-500">{t("common.reference")}:</span>
          <span className="text-sm font-semibold text-neutral-900 font-mono">
            {displayReference}
          </span>
          <button
            onClick={handleCopyId}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
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
        <div className="bg-neutral-50 rounded-2xl p-5 mb-6 text-left">
          <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">
            {t("order.summaryTitle")}
          </p>
          <div className="space-y-1 text-sm text-neutral-700">
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
        <p className="text-neutral-400 text-sm mb-8">
          {t("order.emailNotice", { email: displayEmail })}
        </p>
      )}

      <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-5 h-5 text-neutral-600" />
          <span className="text-sm font-semibold text-neutral-900">
            {t("order.nextSteps")}
          </span>
        </div>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>{t("order.step1")}</li>
          <li>{t("order.step2")}</li>
          <li>{t("order.step3")}</li>
        </ul>
      </div>

      <Link href="/">
        <Button size="lg">
          {t("order.continueShopping")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
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
