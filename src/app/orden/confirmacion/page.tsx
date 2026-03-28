"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  ClipboardCheck,
  Loader2,
  Package,
  Printer,
  Shield,
  Truck,
} from "lucide-react";
import { cn, isUuid } from "@/lib/utils";
import { ORDER_CONFIRMATION_POLL_MS } from "@/lib/polling-intervals";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { extractTrackingCode } from "@/lib/order-tracking";
import { usePricing } from "@/providers/PricingProvider";
import { OrderStatusHero } from "@/components/orders/OrderStatusHero";
import type { Order, OrderStatus } from "@/types/database";

const ORDER_STORAGE_KEY = "vortixy_my_orders_v1";
const ORDER_PROGRESS_STEPS = [
  {
    key: "received",
    title: "Pedido recibido",
    description: "La orden ya quedo registrada y validada en el sistema.",
  },
  {
    key: "processing",
    title: "Revision operativa",
    description: "El equipo confirma datos, stock y alistamiento.",
  },
  {
    key: "shipped",
    title: "Despacho en ruta",
    description: "La transportadora recibe el paquete y activa el movimiento.",
  },
  {
    key: "delivered",
    title: "Entrega final",
    description: "El pedido llega y el pago contraentrega se completa.",
  },
] as const;

function getOrderProgressIndex(status: OrderStatus | undefined): number {
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "processing") return 1;
  return 0;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
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
  }, [loadOrder, orderId, orderToken]);

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
  const progressIndex = getOrderProgressIndex(order?.status);

  const statusLabels: Record<OrderStatus, string> = {
    pending: t("order.status.pending"),
    paid: t("order.status.paid"),
    processing: t("order.status.processing"),
    shipped: t("order.status.shipped"),
    delivered: t("order.status.delivered"),
    cancelled: t("order.status.cancelled"),
    refunded: t("order.status.refunded"),
    deleted: t("order.status.deleted"),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16 print:max-w-none print:px-0 print:py-8">
        <OrderStatusHero
          tone={isPendingConfirmation ? "warning" : "success"}
          badge={isPendingConfirmation ? "Pedido en revision" : "Pedido confirmado"}
          title={isPendingConfirmation ? t("order.pendingTitle") : t("order.confirmedTitle")}
          subtitle={
            isPendingConfirmation
              ? t("order.pendingDescription")
              : firstName
                ? t("order.confirmedWithName", { name: firstName })
                : t("order.confirmedWithoutName")
          }
          reference={displayReference}
          referenceLabel="Referencia del pedido"
          icon={isPendingConfirmation ? "pending" : "success"}
          actions={
            <>
              <Button asChild size="lg" className="gap-2">
                <Link href="/seguimiento">
                  Ver seguimiento
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            </>
          }
          note={
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Estado
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {order ? statusLabels[order.status] ?? order.status : t("order.summaryStatus")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {order ? formatDisplayPrice(order.total) : "Pendiente"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Articulos
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {order ? order.items.length : "0"}
                </p>
              </div>
            </div>
          }
        />

        <div className="mt-6 min-h-[12rem]">
          {loadingOrder && !order ? (
            <div className="mb-6">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : null}

          {order ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  {t("order.summaryTitle")}
                </p>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {statusLabels[order.status] ?? order.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span>{t("order.summaryStatus")}:</span>
                  <span className="font-semibold text-indigo-700">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span>{t("order.summaryTotal")}:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDisplayPrice(order.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span>{t("order.summaryItems")}:</span>
                  <span className="font-semibold text-gray-900">
                    {order.items.length}
                  </span>
                </div>
                {trackingCode ? (
                  <div className="flex items-center justify-between py-2">
                    <span>{t("order.trackingLabel")}:</span>
                    <span className="font-mono font-semibold text-indigo-700">
                      {trackingCode}
                    </span>
                  </div>
                ) : null}
                {isDisplayDifferentFromPayment ? (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="mb-1 text-xs text-gray-400">
                      Precio en dolares (referencial):
                    </p>
                    <p className="text-sm font-semibold text-indigo-700">
                      {formatPaymentPrice(order.total)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {order ? (
            <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                    Ruta del pedido
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Una lectura rapida de la etapa actual para soporte y cliente.
                  </p>
                </div>
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {statusLabels[order.status] ?? order.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ORDER_PROGRESS_STEPS.map((step, index) => {
                  const active = progressIndex >= index;
                  return (
                    <article
                      key={step.key}
                      className={cn(
                        "rounded-[1.5rem] border px-4 py-4 transition-colors",
                        active
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-gray-200 bg-gray-50/80",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            active
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-gray-400",
                          )}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              active ? "text-gray-900" : "text-gray-600",
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {displayEmail ? (
            <p className="mb-8 text-sm text-gray-500">
              {t("order.emailNotice", { email: displayEmail })}
            </p>
          ) : null}
        </div>

        <div className="bento-card mb-6 p-6 text-left">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
              <Package className="h-5 w-5 text-indigo-700" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.nextSteps")}
            </span>
          </div>
          <ul className="space-y-3 text-sm text-gray-500">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{t("order.step1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{t("order.step2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <span>{t("order.step3")}</span>
            </li>
          </ul>
        </div>

        <div className="mb-8 rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-6 text-left shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {t("order.cod.title")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white/60 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-md">
                1
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {t("order.cod.step1.title")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t("order.cod.step1.text")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white/60 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-md">
                2
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  {t("order.cod.step2.title")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t("order.cod.step2.text")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white/60 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-md">
                3
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                  {t("order.cod.step3.title")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {t("order.cod.step3.text")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="print:hidden flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="outline" className="w-full gap-2 border-gray-200 hover:bg-gray-100 sm:w-auto">
            <Link href="/">
              {t("order.continueShopping")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 sm:w-auto">
            <Link href="/seguimiento">
              {t("order.trackButton")}
              <Package className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={handlePrint}
            className="w-full gap-2 border-gray-200 hover:bg-gray-100 sm:w-auto"
          >
            Imprimir resumen
            <Printer className="h-4 w-4" />
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
          <div className="mx-auto max-w-lg px-4 py-20 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-700" />
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
