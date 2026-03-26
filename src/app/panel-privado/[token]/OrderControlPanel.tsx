"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ClipboardCopy,
  CircleAlert,
  Loader2,
  Search,
  Send,
  RefreshCcw,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ControlEmptyState } from "@/components/admin/control/ControlEmptyState";
import { ControlStatCard } from "@/components/admin/control/ControlStatCard";
import { fetchWithCsrf } from "@/lib/csrf-client";
import type { OrderStatus } from "@/types/database";

interface ControlOrderRow {
  id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  shipping_city: string;
  shipping_department: string;
  total: number;
  item_count: number;
  items_preview: string[];
  tracking_code: string | null;
  dispatch_reference: string | null;
  last_internal_note: string | null;
  last_customer_note: string | null;
  manual_review_completed: boolean;
  manual_review_at: string | null;
  created_at: string;
  updated_at: string;
}

interface IntegrationsState {
  discord_webhook_configured: boolean;
  smtp_configured: boolean;
}

interface OrdersResponse {
  orders?: ControlOrderRow[];
  integrations?: IntegrationsState;
  error?: string;
}

interface UpdateResponse {
  ok?: boolean;
  updated?: ControlOrderRow;
  status_changed?: boolean;
  email_sent?: boolean;
  email_error?: string | null;
  error?: string;
}

interface DeleteResponse {
  ok?: boolean;
  error?: string;
}

interface OrderDraft {
  status: OrderStatus;
  tracking_code: string;
  dispatch_reference: string;
  internal_note: string;
  customer_note: string;
  notify_customer: boolean;
}

interface Props {
  accessCode?: string;
}

const STATUS_OPTIONS: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  deleted: "Eliminado",
};

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function statusBadgeClass(status: OrderStatus): string {
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "paid" || status === "processing")
    return "border-sky-200 bg-sky-50 text-sky-800";
  if (status === "shipped") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (status === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "cancelled" || status === "refunded")
    return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

function createDraft(order: ControlOrderRow): OrderDraft {
  return {
    status: order.status,
    tracking_code: order.tracking_code || "",
    dispatch_reference: order.dispatch_reference || "",
    internal_note: "",
    customer_note: "",
    notify_customer: true,
  };
}

async function copyText(value: string): Promise<void> {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore clipboard failures
  }
}

export default function OrderControlPanel({ accessCode = "" }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [orders, setOrders] = useState<ControlOrderRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OrderDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);

  const hasOrders = orders.length > 0;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const headers: Record<string, string> = {};
      if (accessCode) headers["x-catalog-admin-code"] = accessCode;

      const response = await fetch(`/api/internal/orders/control?${params.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      const payload = (await response.json()) as OrdersResponse;
      if (!response.ok) throw new Error(payload.error || "No se pudo cargar la gestion de pedidos.");

      const rows = Array.isArray(payload.orders) ? payload.orders : [];
      setOrders(rows);
      setIntegrations(payload.integrations || null);
      setDrafts((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (!next[row.id]) {
            next[row.id] = createDraft(row);
            continue;
          }
          next[row.id] = {
            ...next[row.id],
            status: row.status,
            tracking_code: next[row.id].tracking_code || row.tracking_code || "",
            dispatch_reference: next[row.id].dispatch_reference || row.dispatch_reference || "",
          };
        }
        return next;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la gestion de pedidos.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessCode, query, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const updateDraft = (orderId: string, patch: Partial<OrderDraft>) => {
    setDrafts((current) => {
      const base = current[orderId];
      if (!base) return current;
      return { ...current, [orderId]: { ...base, ...patch } };
    });
  };

  const applyUpdatedOrder = (updated: ControlOrderRow) => {
    setOrders((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    setDrafts((current) => ({
      ...current,
      [updated.id]: {
        ...(current[updated.id] || createDraft(updated)),
        status: updated.status,
        tracking_code: updated.tracking_code || "",
        dispatch_reference: updated.dispatch_reference || "",
        internal_note: "",
        customer_note: "",
      },
    }));
  };

  const mutateOrder = async (
    order: ControlOrderRow,
    options: {
      advanceStage?: boolean;
      sendEmailOnly?: boolean;
      markManualReview?: boolean;
    } = {},
  ) => {
    const draft = drafts[order.id];
    if (!draft) return;
    setSavingRows((current) => ({ ...current, [order.id]: true }));
    setError(null);
    setMessage(null);
    try {
      const body: Record<string, unknown> = { order_id: order.id, notify_customer: draft.notify_customer };
      const nextTracking = draft.tracking_code.trim();
      const currentTracking = String(order.tracking_code || "").trim();
      if (nextTracking !== currentTracking) body.tracking_code = nextTracking || null;
      const nextDispatch = draft.dispatch_reference.trim();
      const currentDispatch = String(order.dispatch_reference || "").trim();
      if (nextDispatch !== currentDispatch) body.dispatch_reference = nextDispatch || null;
      if (!options.sendEmailOnly) {
        if (!options.advanceStage && draft.status !== order.status) body.status = draft.status;
        body.advance_stage = options.advanceStage === true;
      }
      if (options.markManualReview) body.mark_manual_review = true;
      const internalNote = draft.internal_note.trim();
      const customerNote = draft.customer_note.trim();
      if (internalNote) body.internal_note = internalNote;
      if (customerNote) body.customer_note = customerNote;
      if (options.sendEmailOnly) body.send_email_only = true;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessCode) headers["x-catalog-admin-code"] = accessCode;

      const response = await fetchWithCsrf("/api/internal/orders/control", {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as UpdateResponse;
      if (!response.ok || !payload.updated) throw new Error(payload.error || "No se pudo actualizar el pedido.");

      applyUpdatedOrder(payload.updated);
      if (payload.email_error) setMessage("Pedido actualizado, pero fallo el correo al cliente: " + payload.email_error);
      else if (payload.email_sent) setMessage("Pedido actualizado y correo enviado al cliente.");
      else setMessage("Pedido actualizado correctamente.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar el pedido.");
    } finally {
      setSavingRows((current) => ({ ...current, [order.id]: false }));
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Estas seguro de que quieres eliminar este pedido de la base de datos permanentemente? Esta accion no se puede deshacer.")) {
      return;
    }

    setSavingRows((current) => ({ ...current, [orderId]: true }));
    setError(null);
    setMessage(null);
    try {
      const headers: Record<string, string> = {};
      if (accessCode) headers["x-catalog-admin-code"] = accessCode;

      const response = await fetchWithCsrf(`/api/internal/orders/control?id=${orderId}`, {
        method: "DELETE",
        headers,
      });

      const payload = (await response.json()) as DeleteResponse;
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar el pedido.");

      setOrders((current) => current.filter((row) => row.id !== orderId));
      setMessage("Pedido eliminado permanentemente.");
      setDrafts((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el pedido.");
    } finally {
      setSavingRows((current) => ({ ...current, [orderId]: false }));
    }
  };

  const activeStatusLabel = useMemo(
    () => STATUS_OPTIONS.find((entry) => entry.value === statusFilter)?.label || "Todos",
    [statusFilter],
  );

  const orderMetrics = useMemo(() => {
    const shippingReady = orders.filter((order) => Boolean(order.tracking_code || order.dispatch_reference)).length;
    const reviewPending = orders.filter((order) => !order.manual_review_completed).length;
    const reviewDone = orders.filter((order) => order.manual_review_completed).length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { shippingReady, reviewPending, reviewDone, totalRevenue };
  }, [orders]);

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm">
        <PageHeader
          eyebrow="Pedidos"
          title="Control manual"
          description="Busca, corrige y notifica pedidos desde una unica vista. Cada cambio queda listo para seguir la operacion sin abrir otra pantalla."
          actions={
            <Button size="sm" onClick={() => void fetchOrders()} disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
              Buscar
            </Button>
          }
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ControlStatCard label="Pedidos" value={String(orders.length)} detail={`Filtro activo: ${activeStatusLabel}`} />
          <ControlStatCard label="Listos para envio" value={String(orderMetrics.shippingReady)} detail="Tienen guia o referencia." tone="indigo" />
          <ControlStatCard label="Pendientes de revision" value={String(orderMetrics.reviewPending)} detail="Aun no se marcan como revisados." tone="amber" />
          <ControlStatCard label="Recaudo visible" value={formatCop(orderMetrics.totalRevenue)} detail={`Revision cerrada: ${orderMetrics.reviewDone}`} tone="emerald" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1">Filtro activo: {activeStatusLabel}</span>
          {integrations ? (
            <>
              <span className={`rounded-full border px-3 py-1 ${integrations.discord_webhook_configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                Discord: {integrations.discord_webhook_configured ? "conectado" : "sin configurar"}
              </span>
              <span className={`rounded-full border px-3 py-1 ${integrations.smtp_configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                Gmail/SMTP: {integrations.smtp_configured ? "conectado" : "sin configurar"}
              </span>
            </>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <label className="flex-1 text-xs font-semibold text-gray-500">
            Buscar por ID, email, telefono, documento o ciudad
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-300" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: 2f2c..., cliente@mail.com, 300..."
                className="w-full rounded-2xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-600"
              />
            </div>
          </label>

          <label className="w-full text-xs font-semibold text-gray-500 lg:w-56">
            Estado
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
              className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => void fetchOrders()} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              disabled={isLoading}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {error ? <ControlEmptyState title="No se pudo cargar la gestion de pedidos" description={error} icon={<CircleAlert className="h-5 w-5" />} primaryAction={{ label: "Reintentar", onClick: () => void fetchOrders() }} /> : null}
      {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      {!hasOrders && !isLoading ? (
        <ControlEmptyState
          title="No hay pedidos para este filtro"
          description="Ajusta la busqueda o cambia el estado para encontrar una orden manualmente."
          icon={<Users className="h-5 w-5" />}
          primaryAction={{ label: "Buscar de nuevo", onClick: () => void fetchOrders() }}
          secondaryAction={{ label: "Limpiar filtros", variant: "outline", onClick: () => { setQuery(""); setStatusFilter("all"); } }}
        />
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => {
          const draft = drafts[order.id] || createDraft(order);
          const isSaving = Boolean(savingRows[order.id]);
          return (
            <article key={order.id} className="rounded-[1.75rem] border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-base font-black tracking-tight text-gray-900">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(order.status)}`}>{STATUS_LABEL[order.status]}</span>
                    {order.manual_review_completed ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Revisado
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Requiere revision
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Creado: {formatDate(order.created_at)} | Actualizado: {formatDate(order.updated_at)}</p>
                  <p className="mt-1 text-sm text-gray-700">{order.customer_name} | {order.customer_email}</p>
                  <p className="text-sm text-gray-700">Tel: {order.customer_phone} | Doc: {order.customer_document}</p>
                  <p className="text-sm text-gray-700">{order.shipping_city}, {order.shipping_department}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-lg font-black text-gray-900">{formatCop(order.total)}</p>
                  <p className="text-xs text-gray-400">Items: {order.item_count}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => void copyText(order.id)} className="gap-2">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copiar ID
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copyText(order.customer_email)} className="gap-2">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copiar email
                </Button>
              </div>

              <details className="group">
                <summary className="mb-3 flex cursor-pointer list-none items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20">
                  Ver controles del pedido
                  <span className="text-lg font-normal transition-transform duration-200 group-open:rotate-180">↓</span>
                </summary>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Productos</p>
                    {order.items_preview.length > 0 ? (
                      <ul className="space-y-1 text-sm text-gray-700">
                        {order.items_preview.map((item, index) => (
                          <li key={`${order.id}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Sin items visibles en el preview.</p>
                    )}
                  </div>

                  <label className="text-xs font-semibold text-gray-500">
                    Estado del pedido
                    <select
                      value={draft.status}
                      onChange={(event) => updateDraft(order.id, { status: event.target.value as OrderStatus })}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    >
                      {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-xs font-semibold text-gray-500">
                    Referencia interna de despacho
                    <input
                      type="text"
                      value={draft.dispatch_reference}
                      onChange={(event) => updateDraft(order.id, { dispatch_reference: event.target.value })}
                      placeholder="Ej: GUIA-INT-001"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>

                  <label className="text-xs font-semibold text-gray-500">
                    Guia de transporte
                    <input
                      type="text"
                      value={draft.tracking_code}
                      onChange={(event) => updateDraft(order.id, { tracking_code: event.target.value })}
                      placeholder="Ej: TCC12345678"
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>

                  <label className="text-xs font-semibold text-gray-500">
                    Nota interna
                    <textarea
                      value={draft.internal_note}
                      onChange={(event) => updateDraft(order.id, { internal_note: event.target.value })}
                      rows={2}
                      placeholder={order.last_internal_note || "Ej: validar entrega en la tarde"}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>

                  <label className="text-xs font-semibold text-gray-500 lg:col-span-2">
                    Mensaje para cliente
                    <textarea
                      value={draft.customer_note}
                      onChange={(event) => updateDraft(order.id, { customer_note: event.target.value })}
                      rows={2}
                      placeholder={order.last_customer_note || "Ej: tu pedido ya tiene guia y saldra hoy."}
                      className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    id={`notify-${order.id}`}
                    type="checkbox"
                    checked={draft.notify_customer}
                    onChange={(event) => updateDraft(order.id, { notify_customer: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-200"
                  />
                  <label htmlFor={`notify-${order.id}`} className="text-xs font-semibold text-gray-500">
                    Notificar por email al cliente al guardar
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!order.manual_review_completed ? (
                    <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={isSaving} onClick={() => void mutateOrder(order, { markManualReview: true })}>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Marcar como revisado
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Revisado {order.manual_review_at ? formatDate(order.manual_review_at) : ""}
                    </span>
                  )}

                  <Button size="sm" disabled={isSaving} onClick={() => void mutateOrder(order)}>
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" disabled={isSaving} onClick={() => void mutateOrder(order, { advanceStage: true })}>
                    <Truck className="h-3.5 w-3.5" />
                    Continuar etapa
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1" disabled={isSaving} onClick={() => void mutateOrder(order, { sendEmailOnly: true })}>
                    <Send className="h-3.5 w-3.5" />
                    Enviar email
                  </Button>
                  <Button size="sm" variant="secondary" className="gap-1 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800" disabled={isSaving} onClick={() => void deleteOrder(order.id)}>
                    Eliminar pedido
                  </Button>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
