"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Trash2 } from "lucide-react";
import type { Order, OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "vortixy_my_orders_v1";
const POLL_INTERVAL_MS = 20_000;

interface StoredOrderRef {
  id: string;
  token: string;
  savedAt: string;
}

interface OrderLookupState {
  loading: boolean;
  fetchedAt: string | null;
  order: Order | null;
  error: string | null;
}

type TimelineState = "done" | "current" | "todo" | "warning";

interface TimelineStage {
  key: string;
  label: string;
  detail: string;
  when: string | null;
  state: TimelineState;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value.trim());
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function formatDateTime(value: string | null): string {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
}

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function parseOrderNotes(rawNotes: string | null): Record<string, unknown> {
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

function extractDropiReference(notes: string | null): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);

  const references = fulfillment.dropi_order_references;
  if (!Array.isArray(references)) return null;

  const found = references.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof found === "string" ? found.trim() : null;
}

function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);

  const candidates = fulfillment.tracking_candidates;
  if (!Array.isArray(candidates)) return null;

  const found = candidates.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof found === "string" ? found.trim() : null;
}

function extractCodeExpiresAt(notes: string | null): string | null {
  const parsed = parseOrderNotes(notes);
  const emailConfirmation = getRecord(parsed.email_confirmation);

  return toIsoDate(emailConfirmation.code_expires_at);
}

function extractEmailStage(notes: string | null): {
  stage: "pending" | "confirmed" | "failed_to_send" | "blocked";
  confirmedAt: string | null;
} {
  const parsed = parseOrderNotes(notes);
  const emailConfirmation = getRecord(parsed.email_confirmation);
  const rawStage = String(emailConfirmation.stage || "").trim().toLowerCase();
  const stage =
    rawStage === "confirmed"
      ? "confirmed"
      : rawStage === "failed_to_send"
        ? "failed_to_send"
        : rawStage === "blocked"
          ? "blocked"
          : "pending";

  return {
    stage,
    confirmedAt: toIsoDate(emailConfirmation.confirmed_at),
  };
}

function extractDispatchedAt(notes: string | null): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  return toIsoDate(fulfillment.dispatched_at);
}

function buildTimeline(order: Order): TimelineStage[] {
  const emailState = extractEmailStage(order.notes);
  const dropiReference = extractDropiReference(order.notes);
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchedAt = extractDispatchedAt(order.notes);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  const stages: TimelineStage[] = [
    {
      key: "registered",
      label: "Pedido registrado",
      detail: "Tu pedido quedo creado en Vortixy.",
      when: toIsoDate(order.created_at),
      state: "done",
    },
  ];

  if (isCancelled) {
    stages.push({
      key: "email",
      label: "Verificacion por correo",
      detail:
        emailState.stage === "confirmed"
          ? "Codigo confirmado antes de cancelar."
          : "No se confirmo el codigo.",
      when: emailState.confirmedAt,
      state: emailState.stage === "confirmed" ? "done" : "warning",
    });
    stages.push({
      key: "cancelled",
      label: order.status === "refunded" ? "Pedido reembolsado" : "Pedido cancelado",
      detail: "El flujo se detuvo y no continuara al despacho.",
      when: toIsoDate(order.updated_at),
      state: "done",
    });
    return stages;
  }

  const emailDone =
    emailState.stage === "confirmed" ||
    order.status === "processing" ||
    order.status === "shipped" ||
    order.status === "delivered";

  stages.push({
    key: "email",
    label: "Verificacion por correo",
    detail: emailDone
      ? "Codigo validado correctamente."
      : "Pendiente de validacion con codigo de correo.",
    when: emailState.confirmedAt,
    state: emailDone ? "done" : "current",
  });

  const dropiDone =
    Boolean(dropiReference) ||
    Boolean(dispatchedAt) ||
    order.status === "shipped" ||
    order.status === "delivered";
  const dropiCurrent = order.status === "processing" && !dropiDone;

  stages.push({
    key: "dropi",
    label: "Despacho a Dropi",
    detail: dropiReference
      ? `Orden enviada a Dropi. Ref: ${dropiReference}`
      : dropiDone
        ? "Despacho iniciado con operador logístico."
        : dropiCurrent
          ? "Procesando despacho hacia Dropi."
          : "Aun no se envia a Dropi.",
    when: dispatchedAt,
    state: dropiDone ? "done" : dropiCurrent ? "current" : "todo",
  });

  const shippedDone = order.status === "shipped" || order.status === "delivered";
  const shippedCurrent = order.status === "processing";
  stages.push({
    key: "shipping",
    label: "En transito",
    detail: trackingCode
      ? `Guia disponible: ${trackingCode}`
      : shippedDone
        ? "Pedido entregado a transportadora."
        : shippedCurrent
          ? "Alistando transporte."
          : "Pendiente de salir a transporte.",
    when: shippedDone ? toIsoDate(order.updated_at) : null,
    state: shippedDone ? "done" : shippedCurrent ? "current" : "todo",
  });

  stages.push({
    key: "delivered",
    label: "Entregado",
    detail:
      order.status === "delivered"
        ? "Entrega completada."
        : "Pendiente de entrega final.",
    when: order.status === "delivered" ? toIsoDate(order.updated_at) : null,
    state:
      order.status === "delivered"
        ? "done"
        : order.status === "shipped"
          ? "current"
          : "todo",
  });

  return stages;
}

function timelineDotClass(state: TimelineState): string {
  if (state === "done") return "bg-emerald-500";
  if (state === "current") return "bg-blue-500";
  if (state === "warning") return "bg-rose-500";
  return "bg-neutral-300";
}

function timelineTextClass(state: TimelineState): string {
  if (state === "done") return "text-emerald-700";
  if (state === "current") return "text-blue-700";
  if (state === "warning") return "text-rose-700";
  return "text-neutral-700";
}

function getNextStepText(order: Order): string {
  if (order.status === "pending") {
    return "Debes confirmar el codigo del correo. Mientras siga en pendiente, no se envia a Dropi.";
  }

  if (order.status === "processing") {
    const dropiReference = extractDropiReference(order.notes);
    if (dropiReference) {
      return `Pedido ya enviado a Dropi. Referencia Dropi: ${dropiReference}.`;
    }
    return "Pedido en alistamiento/logistica. Espera guia de transporte.";
  }

  if (order.status === "shipped") {
    return "Ya va en transporte. Revisa la guia de seguimiento si aparece abajo.";
  }

  if (order.status === "delivered") {
    return "Pedido entregado.";
  }

  if (order.status === "cancelled") {
    return "Pedido cancelado.";
  }

  if (order.status === "refunded") {
    return "Pedido reembolsado.";
  }

  return "Estado actualizado.";
}

async function fetchOrder(
  reference: StoredOrderRef
): Promise<Omit<OrderLookupState, "loading">> {
  const endpoint = `/api/orders/${encodeURIComponent(reference.id)}?token=${encodeURIComponent(reference.token)}`;
  const response = await fetch(endpoint, { cache: "no-store" });
  const payload = (await response.json()) as { order: Order | null };

  if (response.status === 401) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      error: "Token invalido o vencido para este pedido.",
    };
  }

  if (!response.ok) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      error: "No se pudo consultar el pedido en este momento.",
    };
  }

  if (!payload.order) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      error: "Pedido no encontrado con esta referencia/token.",
    };
  }

  return {
    fetchedAt: new Date().toISOString(),
    order: payload.order,
    error: null,
  };
}

function statusBadgeClass(status: OrderStatus | null): string {
  if (status === "pending") return "bg-amber-100 text-amber-900";
  if (status === "processing" || status === "paid") return "bg-blue-100 text-blue-900";
  if (status === "shipped") return "bg-indigo-100 text-indigo-900";
  if (status === "delivered") return "bg-emerald-100 text-emerald-900";
  if (status === "cancelled" || status === "refunded") return "bg-rose-100 text-rose-900";
  return "bg-neutral-100 text-neutral-800";
}

function readStoredRefs(): StoredOrderRef[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const id = String((item as Record<string, unknown>).id || "").trim();
        const token = String((item as Record<string, unknown>).token || "").trim();
        const savedAt =
          toIsoDate((item as Record<string, unknown>).savedAt) || new Date().toISOString();
        if (!id || !token) return null;
        return { id, token, savedAt } as StoredOrderRef;
      })
      .filter((item): item is StoredOrderRef => Boolean(item));
  } catch {
    return [];
  }
}

export function MyOrdersPanel() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [refs, setRefs] = useState<StoredOrderRef[]>(() => readStoredRefs());
  const [lookupById, setLookupById] = useState<Record<string, OrderLookupState>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
  }, [refs]);

  const refreshOne = useCallback(async (reference: StoredOrderRef) => {
    setLookupById((prev) => ({
      ...prev,
      [reference.id]: {
        loading: true,
        fetchedAt: prev[reference.id]?.fetchedAt || null,
        order: prev[reference.id]?.order || null,
        error: prev[reference.id]?.error || null,
      },
    }));

    try {
      const result = await fetchOrder(reference);
      setLookupById((prev) => ({
        ...prev,
        [reference.id]: {
          loading: false,
          fetchedAt: result.fetchedAt,
          order: result.order,
          error: result.error,
        },
      }));
    } catch {
      setLookupById((prev) => ({
        ...prev,
        [reference.id]: {
          loading: false,
          fetchedAt: new Date().toISOString(),
          order: prev[reference.id]?.order || null,
          error: "Error de conexion consultando el pedido.",
        },
      }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    if (!refs.length) return;
    setRefreshingAll(true);
    await Promise.all(refs.map((reference) => refreshOne(reference)));
    setRefreshingAll(false);
  }, [refreshOne, refs]);

  useEffect(() => {
    if (!refs.length) return;

    const firstRefreshTimer = window.setTimeout(() => {
      void refreshAll();
    }, 0);
    const timer = window.setInterval(() => {
      void refreshAll();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(firstRefreshTimer);
      window.clearInterval(timer);
    };
  }, [refs, refreshAll]);

  const addOrderRef = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanId = orderIdInput.trim().toLowerCase();
    const cleanToken = tokenInput.trim();

    if (!isUuid(cleanId)) {
      setFormError("La referencia debe ser un UUID valido.");
      return;
    }

    if (cleanToken.length < 16) {
      setFormError("El token del pedido no parece valido.");
      return;
    }

    const nextRef: StoredOrderRef = {
      id: cleanId,
      token: cleanToken,
      savedAt: new Date().toISOString(),
    };

    setRefs((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== cleanId);
      return [nextRef, ...withoutCurrent].slice(0, 10);
    });
    setFormError(null);
    setOrderIdInput("");
    setTokenInput("");
  };

  const removeOrderRef = (id: string) => {
    setRefs((prev) => prev.filter((item) => item.id !== id));
    setLookupById((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const clearAll = () => {
    setRefs([]);
    setLookupById({});
  };

  const pendingCount = useMemo(() => {
    return refs.filter((ref) => lookupById[ref.id]?.order?.status === "pending").length;
  }, [lookupById, refs]);

  return (
    <section className="not-prose rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Mis pedidos</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Consulta el estado en tiempo real. Se actualiza cada 20 segundos.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void refreshAll()}
          disabled={refreshingAll || !refs.length}
        >
          {refreshingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Actualizar
        </Button>
      </div>

      <form onSubmit={addOrderRef} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] mb-4">
        <input
          type="text"
          value={orderIdInput}
          onChange={(event) => setOrderIdInput(event.target.value)}
          placeholder="order_id (UUID)"
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
        />
        <input
          type="text"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
          placeholder="order_token"
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
        />
        <Button type="submit" className="h-11">
          Agregar
        </Button>
      </form>

      <p className="text-xs text-[var(--muted)] mb-3">
        Puedes sacar ambos datos de la URL de confirmacion del pedido o del enlace del correo.
      </p>

      {formError && (
        <p className="text-sm text-red-600 mb-3">{formError}</p>
      )}

      {refs.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--muted)]">
            Guardados: {refs.length} | Pendientes: {pendingCount}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Limpiar lista
          </button>
        </div>
      )}

      {!refs.length ? (
        <p className="text-sm text-[var(--muted)]">
          Aun no tienes pedidos guardados. Agrega tu referencia para empezar.
        </p>
      ) : (
        <div className="space-y-3">
          {refs.map((reference) => {
            const lookup = lookupById[reference.id];
            const order = lookup?.order;
            const status = order?.status || null;
            const trackingCode = order ? extractTrackingCode(order.notes) : null;
            const dropiReference = order ? extractDropiReference(order.notes) : null;
            const codeExpiresAt = order ? extractCodeExpiresAt(order.notes) : null;
            const timeline = order ? buildTimeline(order) : [];

            return (
              <article
                key={reference.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-mono text-[var(--foreground)] break-all">{reference.id}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
                    >
                      {status ? STATUS_LABEL[status] : "Sin estado"}
                    </span>
                    <button
                      type="button"
                      className="text-[var(--muted)] hover:text-[var(--foreground)]"
                      onClick={() => removeOrderRef(reference.id)}
                      aria-label={`Eliminar ${reference.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted)] space-y-1">
                  <p>Total: {order ? formatCop(order.total) : "-"}</p>
                  <p>Creado: {order ? formatDateTime(order.created_at) : "Sin datos"}</p>
                  <p>Ultima consulta: {formatDateTime(lookup?.fetchedAt || null)}</p>
                  {trackingCode && <p>Guia: <span className="font-mono">{trackingCode}</span></p>}
                  {dropiReference && <p>Referencia Dropi: <span className="font-mono">{dropiReference}</span></p>}
                  {status === "pending" && codeExpiresAt && (
                    <p>Vencimiento codigo: {formatDateTime(codeExpiresAt)}</p>
                  )}
                </div>

                {order && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                      Linea de tiempo
                    </p>
                    <ol className="space-y-2">
                      {timeline.map((stage, index) => (
                        <li key={stage.key} className="relative pl-6">
                          {index < timeline.length - 1 && (
                            <span className="absolute left-[0.35rem] top-3 h-[calc(100%-0.2rem)] w-px bg-[var(--border)]" />
                          )}
                          <span
                            className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${timelineDotClass(stage.state)}`}
                          />
                          <p className={`text-sm font-medium ${timelineTextClass(stage.state)}`}>
                            {stage.label}
                          </p>
                          <p className="text-xs text-[var(--muted)]">{stage.detail}</p>
                          {stage.when && (
                            <p className="text-[11px] text-[var(--muted)]">
                              {formatDateTime(stage.when)}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {lookup?.loading && (
                  <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando...
                  </p>
                )}

                {lookup?.error ? (
                  <p className="text-xs text-red-600 mt-2">{lookup.error}</p>
                ) : (
                  order && (
                    <p className="text-xs text-[var(--foreground)] mt-2 font-medium">
                      Siguiente paso: {getNextStepText(order)}
                    </p>
                  )
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
