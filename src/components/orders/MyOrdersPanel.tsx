"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Loader2, RefreshCcw, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Order, OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { MY_ORDERS_POLL_MS } from "@/lib/polling-intervals";

const STORAGE_KEY = "vortixy_my_orders_v1";
const POLL_INTERVAL_MS = MY_ORDERS_POLL_MS;

interface StoredOrderRef {
  id: string;
  token: string;
  savedAt: string;
}

interface OrderLookupState {
  loading: boolean;
  fetchedAt: string | null;
  order: Order | null;
  fulfillment: FulfillmentSummary | null;
  error: string | null;
}

interface HistoryOrderRef {
  id: string;
  order_token: string;
}

interface FulfillmentSummary {
  has_dispatch_error: boolean;
  has_dispatch_success: boolean;
  last_error: string | null;
  last_event_at: string | null;
  last_action: string | null;
  last_status: string | null;
  skipped_reason: string | null;
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

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
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

function extractDispatchReference(notes: string | null): string | null {
  const parsed = parseOrderNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);

  const references = fulfillment.provider_order_references;
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

function extractManualReview(notes: string | null): { completed: boolean; completedAt: string | null } {
  const parsed = parseOrderNotes(notes);
  const manualReview = getRecord(parsed.manual_review);
  const completed = manualReview.completed === true;
  const completedAt = typeof manualReview.completed_at === "string" ? manualReview.completed_at : null;
  return { completed, completedAt };
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

function normalizeFulfillmentSummary(value: unknown): FulfillmentSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;

  return {
    has_dispatch_error: source.has_dispatch_error === true,
    has_dispatch_success: source.has_dispatch_success === true,
    last_error: typeof source.last_error === "string" ? source.last_error.trim() || null : null,
    last_event_at: toIsoDate(source.last_event_at),
    last_action: typeof source.last_action === "string" ? source.last_action.trim() || null : null,
    last_status: typeof source.last_status === "string" ? source.last_status.trim() || null : null,
    skipped_reason:
      typeof source.skipped_reason === "string" ? source.skipped_reason.trim() || null : null,
  };
}

function getGuideHint(
  order: Order,
  emailState: { stage: "pending" | "confirmed" | "failed_to_send" | "blocked" },
  fulfillment: FulfillmentSummary | null,
  trackingCode: string | null
): string | null {
  if (trackingCode) return null;

  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? `Sin guia: fallo de despacho (${fulfillment.last_error}).`
        : "Sin guia: fallo de despacho (sin detalle reportado).";
    }
    return "Sin guia: pedido en revision inicial.";
  }

  if (["processing", "shipped", "delivered"].includes(order.status)) {
    return "Sin guia: la transportadora aun no reporta tracking.";
  }

  return "Sin guia disponible por ahora.";
}

function buildTimeline(order: Order, fulfillment: FulfillmentSummary | null): TimelineStage[] {
  const dispatchReference = extractDispatchReference(order.notes);
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchedAt = extractDispatchedAt(order.notes);
  const manualReview = extractManualReview(order.notes);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  const stages: TimelineStage[] = [
    {
      key: "registered",
      label: "Pedido registrado",
      detail: "Tu pedido quedó creado en Vortixy.",
      when: toIsoDate(order.created_at),
      state: "done",
    },
  ];

  // Cada paso depende de acciones REALES del panel secreto
  const manualDone = manualReview.completed;
  const dispatchDone = Boolean(dispatchReference) || Boolean(dispatchedAt) || fulfillment?.has_dispatch_success === true;
  const shippedDone = Boolean(trackingCode) || order.status === "shipped" || order.status === "delivered";
  const deliveredDone = order.status === "delivered";

  if (isCancelled) {
    stages.push({
      key: "manual_review",
      label: "Revisión del pedido",
      detail: manualDone
        ? "Revisión humana completada antes de cancelar."
        : "No se alcanzó a revisar manualmente.",
      when: manualDone ? manualReview.completedAt : null,
      state: manualDone ? "done" : "warning",
    });
    stages.push({
      key: "cancelled",
      label: order.status === "refunded" ? "Pedido reembolsado" : "Pedido cancelado",
      detail: "El flujo se detuvo y no continuará al despacho.",
      when: toIsoDate(order.updated_at),
      state: "done",
    });
    return stages;
  }

  // Paso 2: Revisión manual - SOLO avanza cuando manualReview.completed es true
  const manualCurrent = !manualDone;
  stages.push({
    key: "manual_review",
    label: "Revisión manual",
    detail: manualDone
      ? "Revisión humana aprobada con éxito."
      : "Un especialista está revisando tu pedido manualmente para asegurar stock y cobertura.",
    when: manualDone ? manualReview.completedAt : toIsoDate(order.created_at),
    state: manualDone ? "done" : "current",
  });

  // Paso 3: Despacho - SOLO avanza cuando hay dispatchReference agregado desde panel secreto
  const dispatchCurrent = manualDone && !dispatchDone;
  const dispatchError = fulfillment?.has_dispatch_error === true;
  stages.push({
    key: "dispatch",
    label: "Despacho logístico",
    detail: dispatchError
      ? fulfillment?.last_error
        ? `Error al ordenar despacho: ${fulfillment.last_error}`
        : "Error al ordenar despacho (sin detalle en logs)."
      : dispatchReference
        ? `Referencia de despacho logístico: ${dispatchReference}`
        : dispatchCurrent
          ? "Esperando asignación de referencia de despacho."
          : "Pendiente de revisión manual.",
    when: dispatchedAt || fulfillment?.last_event_at || null,
    state: dispatchError ? "warning" : dispatchDone ? "done" : (dispatchCurrent ? "current" : "todo"),
  });

  // Paso 4: En tránsito - SOLO avanza cuando hay trackingCode agregado desde panel secreto
  const shippedCurrent = manualDone && dispatchDone && !shippedDone;
  stages.push({
    key: "shipping",
    label: "En transito",
    detail: trackingCode
      ? `Guia disponible: ${trackingCode}`
      : shippedCurrent
        ? "Esperando numero de guia de transportadora."
        : "Pendiente de despacho.",
    when: shippedDone ? toIsoDate(order.updated_at) : null,
    state: shippedDone ? "done" : (shippedCurrent ? "current" : "todo"),
  });

  // Paso 5: Entregado - SOLO avanza cuando el admin cambia el estado a delivered
  const deliveredCurrent = manualDone && dispatchDone && shippedDone && !deliveredDone;
  stages.push({
    key: "delivered",
    label: "Entregado",
    detail: deliveredDone
      ? "Entrega completada."
      : deliveredCurrent
        ? "En espera de confirmacion de entrega."
        : "Pendiente de transito.",
    when: deliveredDone ? toIsoDate(order.updated_at) : null,
    state: deliveredDone ? "done" : (deliveredCurrent ? "current" : "todo"),
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

function getNextStepText(order: Order, fulfillment: FulfillmentSummary | null): string {
  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? `Error al ordenar despacho: ${fulfillment.last_error}`
        : "Error al ordenar despacho (sin detalle en logs).";
    }

    return "Pedido en revisión inicial. Un asesor validará tus datos pronto.";
  }

  if (order.status === "processing") {
    const dispatchReference = extractDispatchReference(order.notes);
    if (dispatchReference) {
      return `Revisión completada. Pedido en alistamiento. Ref: ${dispatchReference}.`;
    }
    return "Un asesor está revisando tu pedido manualmente. Pronto pasará a despacho.";
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
  const payload = (await response.json()) as {
    order: Order | null;
    fulfillment?: unknown;
  };
  const fulfillment = normalizeFulfillmentSummary(payload.fulfillment);

  if (response.status === 401) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      fulfillment: null,
      error: "Token invalido o vencido para este pedido.",
    };
  }

  if (!response.ok) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      fulfillment: null,
      error: "No se pudo consultar el pedido en este momento.",
    };
  }

  if (!payload.order) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      fulfillment: null,
      error: "Pedido no encontrado con esta referencia/token.",
    };
  }

  return {
    fetchedAt: new Date().toISOString(),
    order: payload.order,
    fulfillment,
    error: null,
  };
}

async function fetchOrderHistory(input: {
  email: string;
  phone: string;
  document: string;
}): Promise<{ refs: HistoryOrderRef[]; error: string | null }> {
  const response = await fetch("/api/orders/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      phone: input.phone,
      document: input.document || undefined,
    }),
  });

  const payload = (await response.json()) as {
    error?: string;
    orders?: Array<{ id?: string; order_token?: string }>;
  };

  if (!response.ok) {
    return {
      refs: [],
      error: payload.error || "No se pudo consultar el historial de pedidos.",
    };
  }

  const refs = Array.isArray(payload.orders)
    ? payload.orders
      .map((item) => {
        const id = String(item?.id || "").trim().toLowerCase();
        const orderToken = String(item?.order_token || "").trim();
        if (!isUuid(id) || orderToken.length < 16) return null;
        return { id, order_token: orderToken };
      })
      .filter((item): item is HistoryOrderRef => Boolean(item))
    : [];

  return { refs, error: null };
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
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [refs, setRefs] = useState<StoredOrderRef[]>(() => readStoredRefs());
  const [lookupById, setLookupById] = useState<Record<string, OrderLookupState>>({});
  const [manualFormError, setManualFormError] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
  }, [refs]);

  const replaceRefs = useCallback((nextRefs: StoredOrderRef[]) => {
    const deduped = nextRefs
      .filter((item, index, array) => array.findIndex((other) => other.id === item.id) === index)
      .slice(0, 20);

    setRefs(deduped);
    setLookupById((prev) => {
      const keepIds = new Set(deduped.map((item) => item.id));
      const next: Record<string, OrderLookupState> = {};
      for (const [id, lookup] of Object.entries(prev)) {
        if (keepIds.has(id)) next[id] = lookup;
      }
      return next;
    });
  }, []);

  const refreshOne = useCallback(async (reference: StoredOrderRef) => {
    setLookupById((prev) => ({
      ...prev,
      [reference.id]: {
        loading: true,
        fetchedAt: prev[reference.id]?.fetchedAt || null,
        order: prev[reference.id]?.order || null,
        fulfillment: prev[reference.id]?.fulfillment || null,
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
          fulfillment: result.fulfillment,
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
          fulfillment: prev[reference.id]?.fulfillment || null,
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

  const loadOrderHistory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPhone = phoneInput.trim();
    const cleanDocument = documentInput.trim();

    if (!isEmail(cleanEmail)) {
      setHistoryError("Ingresa un correo valido para buscar tus pedidos.");
      setHistoryMessage(null);
      return;
    }

    if (normalizeDigits(cleanPhone).length < 7) {
      setHistoryError("Ingresa un telefono valido.");
      setHistoryMessage(null);
      return;
    }

    if (cleanDocument && normalizeDigits(cleanDocument).length < 4) {
      setHistoryError("El documento debe tener al menos 4 digitos.");
      setHistoryMessage(null);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryMessage(null);

    try {
      const result = await fetchOrderHistory({
        email: cleanEmail,
        phone: cleanPhone,
        document: cleanDocument,
      });

      if (result.error) {
        setHistoryError(result.error);
        return;
      }

      if (!result.refs.length) {
        replaceRefs([]);
        setHistoryError("No encontramos pedidos con esos datos.");
        return;
      }

      const nextRefs: StoredOrderRef[] = result.refs.map((item) => ({
        id: item.id,
        token: item.order_token,
        savedAt: new Date().toISOString(),
      }));

      replaceRefs(nextRefs);
      setManualFormError(null);
      setHistoryMessage(
        result.refs.length === 1
          ? "Encontramos 1 pedido y ya esta cargado."
          : `Encontramos ${result.refs.length} pedidos y ya estan cargados.`
      );
      setManualOpen(false);

      await Promise.all(nextRefs.map((reference) => refreshOne(reference)));
    } catch {
      setHistoryError("Error de conexion buscando tus pedidos.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const addOrderRef = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanId = orderIdInput.trim().toLowerCase();
    const cleanToken = tokenInput.trim();

    if (!isUuid(cleanId)) {
      setManualFormError("La referencia debe ser un UUID valido.");
      return;
    }

    if (cleanToken.length < 16) {
      setManualFormError("El token del pedido no parece valido.");
      return;
    }

    const nextRef: StoredOrderRef = {
      id: cleanId,
      token: cleanToken,
      savedAt: new Date().toISOString(),
    };

    replaceRefs([nextRef, ...refs]);
    setManualFormError(null);
    setHistoryError(null);
    setOrderIdInput("");
    setTokenInput("");
    void refreshOne(nextRef);
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
    setHistoryMessage(null);
  };

  const pendingCount = useMemo(() => {
    return refs.filter((ref) => lookupById[ref.id]?.order?.status === "pending").length;
  }, [lookupById, refs]);

  return (
    <section className="not-prose rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Mis pedidos</h2>
          <p className="text-sm text-[var(--foreground)]/80 mt-1">
            Mira todos tus pedidos en una sola lista. Actualiza en tiempo real cada 20 segundos.
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

      <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:p-5">
        <p className="text-sm font-medium text-[var(--foreground)] mb-3">
          Busca tus pedidos con los datos de compra
        </p>
        <form onSubmit={loadOrderHistory} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              Correo del pedido
            </span>
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="ejemplo@correo.com"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              Telefono
            </span>
            <input
              type="tel"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="3001234567"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              Documento (opcional)
            </span>
            <input
              type="text"
              value={documentInput}
              onChange={(event) => setDocumentInput(event.target.value)}
              placeholder="Ultimos digitos para validar identidad"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <Button
            type="submit"
            className="h-11 sm:col-span-2 gap-2"
            disabled={historyLoading}
          >
            {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Ver mis pedidos
          </Button>
        </form>
        <p className="mt-3 text-xs text-[var(--foreground)]/70">
          Usa los mismos datos con los que compraste y te mostramos toda tu linea de pedidos.
        </p>
      </div>

      <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
        <button
          type="button"
          onClick={() => setManualOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={manualOpen}
        >
          <span className="text-sm font-medium text-[var(--foreground)]">
            Agregar pedido manualmente (avanzado)
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--foreground)]/70 transition-transform ${manualOpen ? "rotate-180" : ""}`}
          />
        </button>

        {manualOpen && (
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <p className="mb-3 text-xs text-[var(--foreground)]/70">
              Usa esta opcion solo si tienes el enlace de confirmacion y quieres agregar un pedido puntual.
            </p>
            <form onSubmit={addOrderRef} className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
                  Order ID (UUID)
                </span>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(event) => setOrderIdInput(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
                  Order Token
                </span>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="exp.signature"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
                />
              </label>
              <Button type="submit" className="h-11 sm:col-span-2">
                Agregar pedido manual
              </Button>
            </form>
            {manualFormError && (
              <p className="mt-3 text-sm text-red-600">{manualFormError}</p>
            )}
          </div>
        )}
      </div>

      {historyError && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {historyError}
        </p>
      )}
      {historyMessage && (
        <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {historyMessage}
        </p>
      )}

      {refs.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--foreground)]/75">
            Guardados: {refs.length} | Pendientes: {pendingCount}
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
          >
            Limpiar lista
          </button>
        </div>
      )}

      {!refs.length ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]/80">
          Aun no hay pedidos cargados. Busca con correo y telefono para ver tu historial.
        </p>
      ) : (
        <div className="space-y-3">
          {refs.map((reference) => {
            const lookup = lookupById[reference.id];
            const order = lookup?.order;
            const fulfillment = lookup?.fulfillment || null;
            const status = order?.status || null;
            const trackingCode = order ? extractTrackingCode(order.notes) : null;
            const dispatchReference = order ? extractDispatchReference(order.notes) : null;
            const manualReview = order ? extractManualReview(order.notes) : { completed: false, completedAt: null };
            const emailState = order ? extractEmailStage(order.notes) : null;
            const guideHint =
              order && emailState
                ? getGuideHint(order, emailState, fulfillment, trackingCode)
                : null;
            const timeline = order ? buildTimeline(order, fulfillment) : [];

            return (
              <article
                key={reference.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Pedido #{reference.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs font-mono text-[var(--foreground)]/70 break-all">{reference.id}</p>
                  </div>
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

                <div className="grid gap-1 text-sm text-[var(--foreground)]/80 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Total:</span>{" "}
                    {order ? formatCop(order.total) : "-"}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Creado:</span>{" "}
                    {order ? formatDateTime(order.created_at) : "Sin datos"}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Ultima consulta:</span>{" "}
                    {formatDateTime(lookup?.fetchedAt || null)}
                  </p>
                  {trackingCode && (
                    <p>
                      <span className="font-medium text-[var(--foreground)]">Guia:</span>{" "}
                      <span className="font-mono">{trackingCode}</span>
                    </p>
                  )}
                  {!trackingCode && guideHint && (
                    <p className="sm:col-span-2">
                      <span className="font-medium text-[var(--foreground)]">Guia:</span>{" "}
                      {guideHint}
                    </p>
                  )}
                  {dispatchReference && (
                    <p>
                      <span className="font-medium text-[var(--foreground)]">Referencia logistica:</span>{" "}
                      <span className="font-mono">{dispatchReference}</span>
                    </p>
                  )}
                  {fulfillment?.has_dispatch_error && (
                    <p className="sm:col-span-2 text-rose-700">
                      <span className="font-medium">Error de despacho:</span>{" "}
                      {fulfillment.last_error || "No se registro detalle adicional en el log."}
                    </p>
                  )}
                </div>

                {order && manualReview.completed && (
                  <Link
                    href={`/seguimiento`}
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver seguimiento detallado
                  </Link>
                )}

                {order && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/70 mb-2 font-semibold">
                      Linea de tiempo del pedido
                    </p>
                    <ol className="space-y-2">
                      {timeline.map((stage, index) => (
                        <motion.li
                          key={stage.key}
                          className="relative pl-6"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: index * 0.08,
                            ease: [0.25, 0.46, 0.45, 0.94] as const,
                          }}
                        >
                          {index < timeline.length - 1 && (
                            <motion.span
                              className="absolute left-[0.35rem] top-3 h-[calc(100%-0.2rem)] w-px bg-[var(--border)]"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                duration: 0.4,
                                delay: index * 0.08 + 0.15,
                                ease: [0.25, 0.46, 0.45, 0.94] as const,
                              }}
                              style={{ transformOrigin: "top" }}
                            />
                          )}
                          <motion.span
                            className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${timelineDotClass(stage.state)}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                              delay: index * 0.08,
                            }}
                          />
                          <p className={`text-sm font-medium ${timelineTextClass(stage.state)}`}>
                            {stage.label}
                          </p>
                          <p className="text-xs text-[var(--foreground)]/75">{stage.detail}</p>
                          {stage.when && (
                            <p className="text-[11px] text-[var(--foreground)]/65">
                              {formatDateTime(stage.when)}
                            </p>
                          )}
                        </motion.li>
                      ))}
                    </ol>
                  </motion.div>
                )}

                {lookup?.loading && (
                  <p className="text-xs text-[var(--foreground)]/70 mt-2 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Actualizando...
                  </p>
                )}

                {lookup?.error ? (
                  <p className="text-xs text-red-600 mt-2">{lookup.error}</p>
                ) : (
                  order && (
                    <p className="text-xs text-[var(--foreground)] mt-2 font-medium">
                      Siguiente paso: {getNextStepText(order, fulfillment)}
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

