"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Send, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  accessCode: string;
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
  if (status === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "paid" || status === "processing")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "shipped") return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (status === "delivered")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "cancelled" || status === "refunded")
    return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-neutral-100 text-neutral-700 border-neutral-200";
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

export default function OrderControlPanel({ accessCode }: Props) {
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
    if (!accessCode) return;
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(
        `/api/internal/orders/control?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "x-catalog-admin-code": accessCode,
          },
          cache: "no-store",
        }
      );

      const payload = (await response.json()) as OrdersResponse;
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo cargar la gestion de pedidos.");
      }

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
            tracking_code:
              next[row.id].tracking_code || row.tracking_code || "",
            dispatch_reference:
              next[row.id].dispatch_reference || row.dispatch_reference || "",
          };
        }
        return next;
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la gestion de pedidos."
      );
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
      return {
        ...current,
        [orderId]: {
          ...base,
          ...patch,
        },
      };
    });
  };

  const applyUpdatedOrder = (updated: ControlOrderRow) => {
    setOrders((current) =>
      current.map((row) => (row.id === updated.id ? updated : row))
    );
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
    options: { advanceStage?: boolean; sendEmailOnly?: boolean; markManualReview?: boolean } = {}
  ) => {
    const draft = drafts[order.id];
    if (!draft) return;

    setSavingRows((current) => ({ ...current, [order.id]: true }));
    setError(null);
    setMessage(null);

    try {
      const body: Record<string, unknown> = {
        order_id: order.id,
        notify_customer: draft.notify_customer,
      };

      const nextTracking = draft.tracking_code.trim();
      const currentTracking = String(order.tracking_code || "").trim();
      if (nextTracking !== currentTracking) {
        body.tracking_code = nextTracking || null;
      }

      const nextDispatch = draft.dispatch_reference.trim();
      const currentDispatch = String(order.dispatch_reference || "").trim();
      if (nextDispatch !== currentDispatch) {
        body.dispatch_reference = nextDispatch || null;
      }

      if (!options.sendEmailOnly) {
        if (!options.advanceStage && draft.status !== order.status) {
          body.status = draft.status;
        }
        body.advance_stage = options.advanceStage === true;
      }

      if (options.markManualReview) {
        body.mark_manual_review = true;
      }

      const internalNote = draft.internal_note.trim();
      const customerNote = draft.customer_note.trim();
      if (internalNote) body.internal_note = internalNote;
      if (customerNote) body.customer_note = customerNote;

      if (options.sendEmailOnly) {
        body.send_email_only = true;
      }

      const response = await fetch("/api/internal/orders/control", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-catalog-admin-code": accessCode,
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as UpdateResponse;
      if (!response.ok || !payload.updated) {
        throw new Error(payload.error || "No se pudo actualizar el pedido.");
      }

      applyUpdatedOrder(payload.updated);

      if (payload.email_error) {
        setMessage(
          "Pedido actualizado, pero fallo el correo al cliente: " +
          payload.email_error
        );
      } else if (payload.email_sent) {
        setMessage("Pedido actualizado y correo enviado al cliente.");
      } else {
        setMessage("Pedido actualizado correctamente.");
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar el pedido."
      );
    } finally {
      setSavingRows((current) => ({ ...current, [order.id]: false }));
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("¿Estas seguro de que quieres eliminar este pedido de la base de datos permanentemente? Esta accion no se puede deshacer.")) {
      return;
    }

    setSavingRows((current) => ({ ...current, [orderId]: true }));
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/internal/orders/control?id=${orderId}`, {
        method: "DELETE",
        headers: {
          "x-catalog-admin-code": accessCode,
        },
      });

      const payload = (await response.json()) as DeleteResponse;
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo eliminar el pedido.");
      }

      setOrders((current) => current.filter((row) => row.id !== orderId));
      setMessage("Pedido eliminado permanentemente.");

      setDrafts((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar el pedido."
      );
    } finally {
      setSavingRows((current) => ({ ...current, [orderId]: false }));
    }
  };

  const activeStatusLabel = useMemo(
    () => STATUS_OPTIONS.find((entry) => entry.value === statusFilter)?.label || "Todos",
    [statusFilter]
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="flex-1 text-xs font-semibold text-neutral-600">
            Buscar por ID, email, telefono, documento o ciudad
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej: 2f2c..., cliente@mail.com, 300..."
                className="w-full rounded-xl border border-[var(--border)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </div>
          </label>

          <label className="w-full text-xs font-semibold text-neutral-600 lg:w-56">
            Estado
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-strong)]"
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

        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1">
            Filtro activo: {activeStatusLabel}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1">
            Resultados: {orders.length}
          </span>
          {integrations ? (
            <>
              <span
                className={`rounded-full border px-3 py-1 ${integrations.discord_webhook_configured
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
              >
                Discord:{" "}
                {integrations.discord_webhook_configured
                  ? "conectado"
                  : "sin configurar"}
              </span>
              <span
                className={`rounded-full border px-3 py-1 ${integrations.smtp_configured
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
              >
                Gmail/SMTP:{" "}
                {integrations.smtp_configured
                  ? "conectado"
                  : "sin configurar"}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {!hasOrders && !isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-neutral-600">
          No hay pedidos para este filtro.
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => {
          const draft = drafts[order.id] || createDraft(order);
          const isSaving = Boolean(savingRows[order.id]);

          return (
            <article
              key={order.id}
              className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-base font-bold text-[var(--foreground)]">
                      Pedido #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(
                        order.status
                      )}`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Creado: {formatDate(order.created_at)} | Actualizado:{" "}
                    {formatDate(order.updated_at)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-700">
                    {order.customer_name} | {order.customer_email}
                  </p>
                  <p className="text-sm text-neutral-700">
                    Tel: {order.customer_phone} | Doc: {order.customer_document}
                  </p>
                  <p className="text-sm text-neutral-700">
                    {order.shipping_city}, {order.shipping_department}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-right">
                  <p className="text-xs text-neutral-500">Total</p>
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {formatCop(order.total)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Items: {order.item_count}
                  </p>
                </div>
              </div>

              {order.items_preview.length > 0 ? (
                <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Productos
                  </p>
                  <ul className="space-y-1 text-sm text-neutral-700">
                    {order.items_preview.map((item, index) => (
                      <li key={`${order.id}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-2">
                <label className="text-xs font-semibold text-neutral-600">
                  Estado del pedido
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft(order.id, {
                        status: event.target.value as OrderStatus,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.filter((option) => option.value !== "all").map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="text-xs font-semibold text-neutral-600">
                  Referencia interna de despacho
                  <input
                    type="text"
                    value={draft.dispatch_reference}
                    onChange={(event) =>
                      updateDraft(order.id, {
                        dispatch_reference: event.target.value,
                      })
                    }
                    placeholder="Ej: GUIA-INT-001"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-semibold text-neutral-600">
                  Guia de transporte
                  <input
                    type="text"
                    value={draft.tracking_code}
                    onChange={(event) =>
                      updateDraft(order.id, {
                        tracking_code: event.target.value,
                      })
                    }
                    placeholder="Ej: TCC12345678"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-semibold text-neutral-600">
                  Nota interna (solo panel privado)
                  <textarea
                    value={draft.internal_note}
                    onChange={(event) =>
                      updateDraft(order.id, {
                        internal_note: event.target.value,
                      })
                    }
                    rows={2}
                    placeholder={
                      order.last_internal_note || "Ej: validar entrega en la tarde"
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                  />
                </label>

                <label className="text-xs font-semibold text-neutral-600 lg:col-span-2">
                  Mensaje para cliente (se envia por email si activas notificacion)
                  <textarea
                    value={draft.customer_note}
                    onChange={(event) =>
                      updateDraft(order.id, {
                        customer_note: event.target.value,
                      })
                    }
                    rows={2}
                    placeholder={
                      order.last_customer_note ||
                      "Ej: tu pedido ya tiene guia y saldra hoy."
                    }
                    className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  id={`notify-${order.id}`}
                  type="checkbox"
                  checked={draft.notify_customer}
                  onChange={(event) =>
                    updateDraft(order.id, { notify_customer: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <label
                  htmlFor={`notify-${order.id}`}
                  className="text-xs font-semibold text-neutral-600"
                >
                  Notificar por email al cliente al guardar
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!order.manual_review_completed && (
                  <Button
                    size="sm"
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSaving}
                    onClick={() =>
                      void mutateOrder(order, { markManualReview: true })
                    }
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Marcar como revisado
                  </Button>
                )}
                {order.manual_review_completed && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Revisado {order.manual_review_at ? formatDate(order.manual_review_at) : ""}
                  </span>
                )}
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={isSaving}
                  onClick={() => void mutateOrder(order)}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={isSaving}
                  onClick={() =>
                    void mutateOrder(order, { advanceStage: true })
                  }
                >
                  <Truck className="h-3.5 w-3.5" />
                  Continuar etapa
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1"
                  disabled={isSaving}
                  onClick={() =>
                    void mutateOrder(order, { sendEmailOnly: true })
                  }
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar email ahora
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                  disabled={isSaving}
                  onClick={() => void deleteOrder(order.id)}
                >
                  Eliminar pedido
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
