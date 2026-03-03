"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package,
  LogIn,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/providers/LanguageProvider";
import type { Order, OrderStatus } from "@/types/database";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-neutral-100 text-neutral-800",
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const DATE_LOCALES: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es-CO",
  ar: "ar",
  fr: "fr-FR",
  bn: "bn-BD",
  pt: "pt-BR",
  ru: "ru-RU",
  ja: "ja-JP",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const { t, language } = useLanguage();

  const statusLabels: Record<OrderStatus, string> = useMemo(
    () => ({
      pending: t("admin.status.pending"),
      paid: t("admin.status.paid"),
      processing: t("admin.status.processing"),
      shipped: t("admin.status.shipped"),
      delivered: t("admin.status.delivered"),
      cancelled: t("admin.status.cancelled"),
      refunded: t("admin.status.refunded"),
    }),
    [t]
  );

  const locale = DATE_LOCALES[language] || "en-US";

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.errorLoadingOrders"));
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.errorUnknown"));
    } finally {
      setLoading(false);
    }
  }, [password, t]);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${password}` },
      });

      if (res.status === 401) {
        setError(t("admin.errorWrongPassword"));
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("admin.errorLoadingOrders"));
        return;
      }

      setAuthenticated(true);
      setOrders(data.orders || []);
    } catch {
      setError(t("admin.errorConnection"));
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(orderId);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error(t("admin.errorUpdating"));

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch {
      setError(t("admin.errorUpdating"));
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchOrders]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8">
            <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-7 h-7 text-neutral-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 text-center mb-6">
              {t("admin.loginTitle")}
            </h1>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder={t("admin.passwordPlaceholder")}
              className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent mb-4"
            />
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.loginButton")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t("admin.ordersTitle")}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t("admin.totalOrders", { count: orders.length })}</p>
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {t("admin.refresh")}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">{t("admin.noOrders")}</p>
            <p className="text-sm text-neutral-400 mt-1">{t("admin.noOrdersHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {order.customer_name || t("admin.unknownName")}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {order.customer_email} — {new Date(order.created_at).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm font-bold text-neutral-900 hidden sm:inline">
                        {formatPrice(order.total)}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-full",
                          STATUS_COLORS[order.status]
                        )}
                      >
                        {statusLabels[order.status]}
                      </span>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t border-neutral-100 p-5 bg-neutral-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                          {t("admin.customerData")}
                        </h4>
                        <div className="space-y-1 text-sm text-neutral-700">
                          <p>{t("admin.phone")}: {order.customer_phone}</p>
                          <p>{t("admin.document")}: {order.customer_document}</p>
                          <p>{t("admin.address")}: {order.shipping_address}</p>
                          <p>
                            {order.shipping_city}, {order.shipping_department}
                          </p>
                          {order.shipping_zip && <p>{t("admin.postalCode")}: {order.shipping_zip}</p>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                          {t("admin.paymentDetails")}
                        </h4>
                        <div className="space-y-1 text-sm text-neutral-700">
                          <p>{t("admin.method")}: {order.payment_method || t("admin.noValue")}</p>
                          <p>{t("admin.paymentId")}: {order.payment_id || t("admin.noValue")}</p>
                          <p>{t("admin.subtotal")}: {formatPrice(order.subtotal)}</p>
                          <p>{t("admin.shipping")}: {formatPrice(order.shipping_cost)}</p>
                          <p className="font-semibold">{t("admin.total")}: {formatPrice(order.total)}</p>
                        </div>
                      </div>
                    </div>

                    {order.items &&
                      (order.items as { product_name: string; quantity: number; price: number; variant: string | null }[]).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                            {t("admin.products")}
                          </h4>
                          <div className="space-y-2">
                            {(order.items as { product_name: string; quantity: number; price: number; variant: string | null }[]).map(
                              (item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 text-sm bg-white rounded-xl px-4 py-3"
                                >
                                  <div className="min-w-0">
                                    <span className="font-medium text-neutral-900">{item.product_name}</span>
                                    {item.variant && <span className="text-neutral-500 ml-1">({item.variant})</span>}
                                    <span className="text-neutral-400 ml-2">x{item.quantity}</span>
                                  </div>
                                  <span className="font-medium whitespace-nowrap">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-sm font-medium text-neutral-700">{t("admin.changeStatus")}</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        disabled={updatingStatus === order.id}
                        className="h-9 px-3 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                      {updatingStatus === order.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
