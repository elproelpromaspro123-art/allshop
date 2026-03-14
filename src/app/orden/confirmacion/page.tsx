"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Copy, Loader2, Banknote, Truck, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_CONFIRMATION_POLL_MS } from "@/lib/polling-intervals";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { usePricing } from "@/providers/PricingProvider";
import type { Order, OrderStatus } from "@/types/database";

const ORDER_STORAGE_KEY = "vortixy_my_orders_v1";

function parseNotes(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4
  );
  return typeof found === "string" ? found.trim() : null;
}

async function fetchOrderSnapshot(
  orderId: string,
  token: string
): Promise<Order | null> {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}${tokenQuery}`);
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
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const cleanOrderId = String(orderId || "").trim().toLowerCase();
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
          const token = String((entry as Record<string, unknown>).token || "").trim();
          const savedAt =
            toIsoDate((entry as Record<string, unknown>).savedAt) ||
            new Date().toISOString();
          if (!isUuid(id) || token.length < 16) return null;

          return { id, token, savedAt };
        })
        .filter(
          (entry): entry is { id: string; token: string; savedAt: string } =>
            Boolean(entry)
        );

      const withoutCurrent = normalized.filter((entry) => entry.id !== cleanOrderId);
      const next = [
        { id: cleanOrderId, token: cleanOrderToken, savedAt: new Date().toISOString() },
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
    [orderId, orderToken]
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
    [order?.notes]
  );

  const handleCopyId = () => {
    if (displayReference) {
      void navigator.clipboard.writeText(displayReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-lg mx-auto px-4 py-20 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-[var(--foreground)]">
          {isPendingConfirmation ? t("order.pendingTitle") : t("order.confirmedTitle")}
        </h1>
        <p className="text-lg mb-2 text-[var(--muted-soft)]">
          {isPendingConfirmation
            ? t("order.pendingSubtitle")
            : firstName
              ? t("order.confirmedWithName", { name: firstName })
              : t("order.confirmedWithoutName")}
        </p>
        {isPendingConfirmation ? (
          <p className="text-sm mb-2 text-[var(--muted-soft)]">
            {t("order.pendingDescription")}
          </p>
        ) : null}

        <div className="min-h-[12rem]">
        {displayReference ? (
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-6 bg-[var(--surface-muted)]">
            <span className="text-sm text-[var(--muted-soft)]">{t("common.reference")}:</span>
            <span className="text-sm font-semibold font-mono text-[var(--foreground)]">
              {displayReference}
            </span>
            <button
              onClick={handleCopyId}
              className={cn(
                "transition-colors",
                copied ? "text-emerald-500" : "text-[var(--muted-faint)] hover:text-[var(--muted-strong)]"
              )}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {loadingOrder && !order ? (
          <div className="mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-faint)] mx-auto" />
          </div>
        ) : null}

        {order ? (
          <div className="rounded-[var(--card-radius)] p-5 mb-6 text-left border min-h-[10rem] bg-[var(--background)] border-transparent">
            <p className="text-xs uppercase tracking-wider text-[var(--muted-soft)] mb-3">
              {t("order.summaryTitle")}
            </p>
            <div className="space-y-1 text-sm text-[var(--muted-strong)]">
              <p>
                {t("order.summaryStatus")}:{" "}
                <span className="font-semibold">{statusLabels[order.status] ?? order.status}</span>
              </p>
              <p>
                {t("order.summaryTotal")}:{" "}
                <span className="font-semibold">{formatDisplayPrice(order.total)}</span>
              </p>
              <p>
                {t("order.summaryItems")}:{" "}
                <span className="font-semibold">{order.items.length}</span>
              </p>
              {trackingCode ? (
                <p>
                  {t("order.trackingLabel")}:{" "}
                  <span className="font-semibold font-mono">{trackingCode}</span>
                </p>
              ) : null}
              {isDisplayDifferentFromPayment ? (
                <p>
                  <span className="font-semibold">{formatPaymentPrice(order.total)}</span>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {displayEmail ? (
          <p className="text-sm mb-8 text-[var(--muted-faint)]">
            {t("order.emailNotice", { email: displayEmail })}
          </p>
        ) : null}
        </div>

        <div className="rounded-[var(--card-radius)] p-6 mb-8 text-left border bg-[var(--background)] border-transparent">
          <div className="flex items-center gap-3 mb-3">
            <Package className="w-5 h-5 text-[var(--muted)]" />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {t("order.nextSteps")}
            </span>
          </div>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>{t("order.step1")}</li>
            <li>{t("order.step2")}</li>
            <li>{t("order.step3")}</li>
          </ul>
        </div>

        {/* Como funciona contra entrega */}
        <div className="rounded-[var(--card-radius)] p-6 mb-8 text-left border bg-emerald-50/50 border-emerald-200/60">
          <div className="flex items-center gap-3 mb-4">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {t("order.cod.title")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold shrink-0">1</div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step1.title")}
                </p>
                <p className="text-xs text-[var(--muted-soft)] mt-0.5">{t("order.cod.step1.text")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold shrink-0">2</div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step2.title")}
                </p>
                <p className="text-xs text-[var(--muted-soft)] mt-0.5">{t("order.cod.step2.text")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold shrink-0">3</div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  {t("order.cod.step3.title")}
                </p>
                <p className="text-xs text-[var(--muted-soft)] mt-0.5">{t("order.cod.step3.text")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg" variant="outline" className="gap-2">
              {t("order.continueShopping")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/seguimiento">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {t("order.trackButton")}
              <Package className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-faint)] mx-auto" />
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

