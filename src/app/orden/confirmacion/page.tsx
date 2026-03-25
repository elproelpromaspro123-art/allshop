"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Copy,
  Loader2,
  Banknote,
  Truck,
  ClipboardCheck,
  Shield,
} from "lucide-react";
import { cn, isUuid } from "@/lib/utils";
import { ORDER_CONFIRMATION_POLL_MS } from "@/lib/polling-intervals";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import type { Order, OrderStatus } from "@/types/database";

const ORDER_STORAGE_KEY = "vortixy_my_orders_v1";

function parseNotes(rawNotes: unknown): Record<string, unknown> {
  if (!rawNotes) return {};
  if (typeof rawNotes === "object" && !Array.isArray(rawNotes)) {
    return rawNotes as Record<string, unknown>;
  }
  try {
    const parsed =
      typeof rawNotes === "string" ? (JSON.parse(rawNotes) as unknown) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function extractTrackingCode(notes: unknown): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4,
  );
  return typeof found === "string" ? found.trim() : null;
}

async function fetchOrderSnapshot(
  orderId: string,
  token: string,
): Promise<Order | null> {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const res = await fetch(
    `/api/orders/${encodeURIComponent(orderId)}${tokenQuery}`,
  );
  const data = (await res.json()) as { order: Order | null };
  return data.order;
}

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
  const queryOrderToken = searchParams.get("order_token") || "";

  const [orderToken, setOrderToken] = useState(queryOrderToken);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusLabels: Record<OrderStatus, string> = {
    pending: t("order.status.pending"),
    paid: t("order.status.paid"),
    processing: t("order.status.processing"),
    shipped: t("order.status.shipped"),
    delivered: t("order.status.delivered"),
    cancelled: t("order.status.cancelled"),
    refunded: t("order.status.refunded"),
  };

  useEffect(() => {
    setOrderToken(queryOrderToken);
  }, [queryOrderToken]);

  useEffect(() => {
    if (order) {
      clearCart();
    }
  }, [order, clearCart]);

  useEffect(() => {
    const cleanOrderId = String(orderId || "")
      .trim()
      .toLowerCase();
    const cleanOrderToken = String(orderToken || "").trim();
    if (!isUuid(cleanOrderId) || cleanOrderToken.length < 16) return;

    try {
      const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const normalized = list
        .map((entry) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            return null;
          }

          const id = String((entry as Record<string, unknown>).id || "")
            .trim()
            .toLowerCase();
          const token = String(
            (entry as Record<string, unknown>).token || "",
          ).trim();
          const savedAt =
            toIsoDate((entry as Record<string, unknown>).savedAt) ||
            new Date().toISOString();
          if (!isUuid(id) || token.length < 16) return null;

          return { id, token, savedAt };
        })
        .filter(
          (entry): entry is { id: string; token: string; savedAt: string } =>
            Boolean(entry),
        );

      const withoutCurrent = normalized.filter(
        (entry) => entry.id !== cleanOrderId,
      );
      const next = [
        {
          id: cleanOrderId,
          token: cleanOrderToken,
          savedAt: new Date().toISOString(),
        },
        ...withoutCurrent,
      ].slice(0, 10);

      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore localStorage persistence errors.
    }
  }, [orderId, orderToken]);

  const loadOrder = useCallback(
    async (showSpinner: boolean) => {
      if (!orderId) return;

      if (showSpinner) setLoadingOrder(true);
      try {
        const nextOrder = await fetchOrderSnapshot(orderId, orderToken);
        setOrder(nextOrder);
      } catch {
        setOrder(null);
      } finally {
        if (showSpinner) setLoadingOrder(false);
      }
    },
    [orderId, orderToken],
  );

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const load = async (showSpinner: boolean) => {
      if (cancelled) return;
      await loadOrder(showSpinner);
    };

    void load(true);
    const intervalId = window.setInterval(() => {
      void load(false);
    }, ORDER_CONFIRMATION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [orderId, loadOrder]);

  const displayReference = order?.id || orderId || paymentId;
  const displayEmail = order?.customer_email;
  const isPendingConfirmation = order?.status === "pending";
  const firstName = useMemo(() => {
    if (order?.customer_name) return order.customer_name.split(" ")[0];
    return null;
  }, [order?.customer_name]);
  const trackingCode = useMemo(
    () => extractTrackingCode(order?.notes ?? null),
    [order?.notes],
  );

  const handleCopyId = () => {
    if (displayReference) {
      void navigator.clipboard.writeText(displayReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center animate-fade-in-up">
        {/* Success Icon with Premium Gradient */}
        <div className="relative mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 shadow-lg">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 animate-pulse" />
          <CheckCircle2 className="w-10 h-10 text-emerald-600 relative z-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-gray-900">
          {isPendingConfirmation
            ? t("order.pendingTitle")
            : t("order.confirmedTitle")}
        </h1>
        <p className="text-lg mb-6 text-gray-400">
          {isPendingConfirmation
            ? t("order.pendingSubtitle")
            : firstName
              ? t("order.confirmedWithName", { name: firstName })
              : t("order.confirmedWithoutName")}
        </p>

        <div className="min-h-[12rem]">
          {displayReference ? (
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 mb-6 bg-gray-100 border border-gray-100">
              <span className="text-sm text-gray-400">
                {t("common.reference")}:
              </span>
              <span className="text-sm font-semibold font-mono text-gray-900">
                {displayReference}
              </span>
              <button
                onClick={handleCopyId}
                aria-label="Copiar referencia"
                className={cn(
                  "transition-colors p-1 rounded-lg hover:bg-white",
                  copied
                    ? "text-emerald-500"
                    : "text-gray-300 hover:text-gray-700",
                )}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          {loadingOrder && !order ? (
            <div className="mb-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
            </div>
          ) : null}

          {order ? (
            <div className="rounded-3xl p-6 mb-6 text-left border bg-white border-gray-200 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-4">{t("order.summaryTitle")}</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span>{t("order.summaryStatus")}:</span>
                  <span className="font-semibold text-indigo-700">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span>{t("order.summaryTotal")}:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDisplayPrice(order.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span>{t("order.summaryItems")}:</span>
                  <span className="font-semibold text-gray-900">
                    {order.items.length}
                  </span>
                </div>
                {trackingCode ? (
                  <div className="flex justify-between items-center py-2">
                    <span>{t("order.trackingLabel")}:</span>
                    <span className="font-semibold font-mono text-indigo-700">
                      {trackingCode}
                    </span>
                  </div>
                ) : null}
                {isDisplayDifferentFromPayment ? (
                  <div className="pt-2 mt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">
                      Precio en dólares (referencial):
                    </p>
                    <p className="text-sm font-semibold text-indigo-700">
                      {formatPaymentPrice(order.total)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {displayEmail ? (
            <p className="text-sm mb-8 text-gray-300">
              {t("order.emailNotice", { email: displayEmail })}
            </p>
          ) : null}
        </div>

        {/* Next Steps Card - Bento Style */}
        <div className="bento-card p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50">
              <Package className="w-5 h-5 text-indigo-700" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.nextSteps")}
            </span>
          </div>
          <ul className="space-y-3 text-sm text-gray-500">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{t("order.step1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{t("order.step2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{t("order.step3")}</span>
            </li>
          </ul>
        </div>

        {/* Como funciona contra entrega - Premium Card */}
        <div className="rounded-3xl p-6 mb-8 text-left border bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-100">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.cod.title")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-emerald-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold shrink-0 shadow-md">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step1.title")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("order.cod.step1.text")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-emerald-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold shrink-0 shadow-md">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step2.title")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("order.cod.step2.text")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-emerald-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-bold shrink-0 shadow-md">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step3.title")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("order.cod.step3.text")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="gap-2 w-full sm:w-auto border-gray-200 hover:bg-gray-100"
          >
            <Link href="/">
              {t("order.continueShopping")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="gap-2 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
          >
            <Link href="/seguimiento">
              {t("order.trackButton")}
              <Package className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-emerald-700 animate-spin mx-auto" />
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
