"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, RefreshCcw, Search, Trash2 } from "lucide-react";
import type { Order, OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { MY_ORDERS_POLL_MS } from "@/lib/polling-intervals";
import { useLanguage } from "@/providers/LanguageProvider";

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

type Translate = (key: string, vars?: Record<string, string | number>) => string;

const STATUS_LABEL_KEYS: Record<OrderStatus, string> = {
  pending: "order.status.pending",
  paid: "order.status.paid",
  processing: "order.status.processing",
  shipped: "order.status.shipped",
  delivered: "order.status.delivered",
  cancelled: "order.status.cancelled",
  refunded: "order.status.refunded",
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

function formatDateTime(value: string | null, emptyLabel: string): string {
  if (!value) return emptyLabel;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return emptyLabel;
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
  fulfillment: FulfillmentSummary | null,
  trackingCode: string | null,
  t: Translate
): string | null {
  if (trackingCode) return null;

  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.guide.dispatchErrorWithDetail", { detail: fulfillment.last_error })
        : t("orders.guide.dispatchErrorNoDetail");
    }
    return t("orders.guide.pendingReview");
  }

  if (["processing", "shipped", "delivered"].includes(order.status)) {
    return t("orders.guide.awaitCarrier");
  }

  return t("orders.guide.unavailable");
}

function buildTimeline(
  order: Order,
  fulfillment: FulfillmentSummary | null,
  t: Translate
): TimelineStage[] {
  const dispatchReference = extractDispatchReference(order.notes);
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchedAt = extractDispatchedAt(order.notes);
  const manualReview = extractManualReview(order.notes);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  const stages: TimelineStage[] = [
    {
      key: "registered",
      label: t("orders.timeline.registered.label"),
      detail: t("orders.timeline.registered.detail"),
      when: toIsoDate(order.created_at),
      state: "done",
    },
  ];

  // Cada paso depende de acciones REALES del panel secreto
  const manualDone = manualReview.completed;
  const dispatchDone = Boolean(dispatchReference) || Boolean(dispatchedAt) || fulfillment?.has_dispatch_success === true;
  const shippedDone = Boolean(trackingCode);
  const deliveredDone = order.status === "delivered";

  if (isCancelled) {
    stages.push({
      key: "manual_review",
      label: t("orders.timeline.manualReview.label"),
      detail: manualDone
        ? t("orders.timeline.manualReview.doneDetail")
        : t("orders.timeline.manualReview.skippedDetail"),
      when: manualDone ? manualReview.completedAt : null,
      state: manualDone ? "done" : "warning",
    });
    stages.push({
      key: "cancelled",
      label:
        order.status === "refunded"
          ? t("orders.timeline.refunded.label")
          : t("orders.timeline.cancelled.label"),
      detail: t("orders.timeline.cancelled.detail"),
      when: toIsoDate(order.updated_at),
      state: "done",
    });
    return stages;
  }

  // Paso 2: Revision manual - SOLO avanza cuando manualReview.completed es true
  stages.push({
    key: "manual_review",
    label: t("orders.timeline.manualReview.labelActive"),
    detail: manualDone
      ? t("orders.timeline.manualReview.detailDone")
      : t("orders.timeline.manualReview.detailPending"),
    when: manualDone ? manualReview.completedAt : toIsoDate(order.created_at),
    state: manualDone ? "done" : "current",
  });

  // Paso 3: Despacho - SOLO avanza cuando hay dispatchReference agregado desde panel secreto
  const dispatchCurrent = manualDone && !dispatchDone;
  const dispatchError = fulfillment?.has_dispatch_error === true;
  stages.push({
    key: "dispatch",
    label: t("orders.timeline.dispatch.label"),
    detail: dispatchError
      ? fulfillment?.last_error
        ? t("orders.timeline.dispatch.errorWithDetail", { detail: fulfillment.last_error })
        : t("orders.timeline.dispatch.errorNoDetail")
      : dispatchReference
        ? t("orders.timeline.dispatch.reference", { reference: dispatchReference })
        : dispatchCurrent
          ? t("orders.timeline.dispatch.awaitingReference")
          : t("orders.timeline.dispatch.awaitingReview"),
    when: dispatchedAt || fulfillment?.last_event_at || null,
    state: dispatchError ? "warning" : dispatchDone ? "done" : (dispatchCurrent ? "current" : "todo"),
  });

  // Paso 4: En transito - SOLO avanza cuando hay trackingCode agregado desde panel secreto
  const shippedCurrent = manualDone && dispatchDone && !shippedDone;
  stages.push({
    key: "shipping",
    label: t("orders.timeline.shipping.label"),
    detail: trackingCode
      ? t("orders.timeline.shipping.tracking", { code: trackingCode })
      : shippedCurrent
        ? t("orders.timeline.shipping.awaitingTracking")
        : t("orders.timeline.shipping.awaitingDispatch"),
    when: shippedDone ? toIsoDate(order.updated_at) : null,
    state: shippedDone ? "done" : (shippedCurrent ? "current" : "todo"),
  });

  // Paso 5: Entregado - SOLO avanza cuando el admin cambia el estado a delivered
  const deliveredCurrent = manualDone && dispatchDone && shippedDone && !deliveredDone;
  stages.push({
    key: "delivered",
    label: t("orders.timeline.delivered.label"),
    detail: deliveredDone
      ? t("orders.timeline.delivered.done")
      : deliveredCurrent
        ? t("orders.timeline.delivered.awaitingConfirmation")
        : t("orders.timeline.delivered.awaitingTransit"),
    when: deliveredDone ? toIsoDate(order.updated_at) : null,
    state: deliveredDone ? "done" : (deliveredCurrent ? "current" : "todo"),
  });

  return stages;
}

function timelineDotClass(state: TimelineState): string {
  if (state === "done") return "bg-emerald-500";
  if (state === "current") return "bg-blue-500";
  if (state === "warning") return "bg-rose-500";
  return "bg-[var(--border)]";
}

function timelineTextClass(state: TimelineState): string {
  if (state === "done") return "text-emerald-700";
  if (state === "current") return "text-blue-700";
  if (state === "warning") return "text-rose-700";
  return "text-[var(--muted-strong)]";
}

function getNextStepText(
  order: Order,
  fulfillment: FulfillmentSummary | null,
  t: Translate
): string {
  if (order.status === "pending") {
    if (fulfillment?.has_dispatch_error) {
      return fulfillment.last_error
        ? t("orders.next.dispatchErrorWithDetail", { detail: fulfillment.last_error })
        : t("orders.next.dispatchErrorNoDetail");
    }

    return t("orders.next.pendingReview");
  }

  if (order.status === "processing") {
    const dispatchReference = extractDispatchReference(order.notes);
    if (dispatchReference) {
      return t("orders.next.processingWithRef", { reference: dispatchReference });
    }
    return t("orders.next.processingReview");
  }

  if (order.status === "shipped") {
    return t("orders.next.shipped");
  }

  if (order.status === "delivered") {
    return t("orders.next.delivered");
  }

  if (order.status === "cancelled") {
    return t("orders.next.cancelled");
  }

  if (order.status === "refunded") {
    return t("orders.next.refunded");
  }

  return t("orders.next.updated");
}

async function fetchOrder(
  reference: StoredOrderRef,
  t: Translate
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
      error: t("orders.error.tokenInvalid"),
    };
  }

  if (!response.ok) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      fulfillment: null,
      error: t("orders.error.fetch"),
    };
  }

  if (!payload.order) {
    return {
      fetchedAt: new Date().toISOString(),
      order: null,
      fulfillment: null,
      error: t("orders.error.notFound"),
    };
  }

  return {
    fetchedAt: new Date().toISOString(),
    order: payload.order,
    fulfillment,
    error: null,
  };
}

async function fetchOrderHistory(
  input: {
    email: string;
    phone: string;
    document: string;
  },
  t: Translate
): Promise<{ refs: HistoryOrderRef[]; error: string | null }> {
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
      error: payload.error || t("orders.history.fetchError"),
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
  return "bg-[var(--surface-muted)] text-[var(--foreground)]";
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

interface OrderHistoryFormProps {
  t: Translate;
  emailInput: string;
  phoneInput: string;
  documentInput: string;
  orderIdInput: string;
  tokenInput: string;
  historyLoading: boolean;
  manualOpen: boolean;
  manualFormError: string | null;
  onSubmitHistory: (event: React.FormEvent<HTMLFormElement>) => void;
  onSubmitManual: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleManual: () => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDocumentChange: (value: string) => void;
  onOrderIdChange: (value: string) => void;
  onTokenChange: (value: string) => void;
}

function OrderHistoryForm({
  t,
  emailInput,
  phoneInput,
  documentInput,
  orderIdInput,
  tokenInput,
  historyLoading,
  manualOpen,
  manualFormError,
  onSubmitHistory,
  onSubmitManual,
  onToggleManual,
  onEmailChange,
  onPhoneChange,
  onDocumentChange,
  onOrderIdChange,
  onTokenChange,
}: OrderHistoryFormProps) {
  return (
    <>
      <div className="mb-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--background)] p-4 sm:p-5">
        <p className="text-sm font-medium text-[var(--foreground)] mb-3">
          {t("orders.searchTitle")}
        </p>
        <form onSubmit={onSubmitHistory} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              {t("orders.emailLabel")}
            </span>
            <input
              type="email"
              value={emailInput}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={t("orders.emailPlaceholder")}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              {t("orders.phoneLabel")}
            </span>
            <input
              type="tel"
              value={phoneInput}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder={t("orders.phonePlaceholder")}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
              {t("orders.documentLabel")}
            </span>
            <input
              type="text"
              value={documentInput}
              onChange={(event) => onDocumentChange(event.target.value)}
              placeholder={t("orders.documentPlaceholder")}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
            />
          </label>
          <Button
            type="submit"
            className="h-11 sm:col-span-2 gap-2"
            disabled={historyLoading}
          >
            {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t("orders.searchButton")}
          </Button>
        </form>
        <p className="mt-3 text-xs text-[var(--foreground)]/70">
          {t("orders.searchHint")}
        </p>
      </div>

      <div className="mb-4 rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--background)] p-4">
        <button
          type="button"
          onClick={onToggleManual}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={manualOpen}
        >
          <span className="text-sm font-medium text-[var(--foreground)]">
            {t("orders.manual.title")}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[var(--foreground)]/70 transition-transform ${manualOpen ? "rotate-180" : ""}`}
          />
        </button>

        {manualOpen && (
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <p className="mb-3 text-xs text-[var(--foreground)]/70">
              {t("orders.manual.hint")}
            </p>
            <form onSubmit={onSubmitManual} className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
                  {t("orders.manual.idLabel")}
                </span>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(event) => onOrderIdChange(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]/70">
                  {t("orders.manual.tokenLabel")}
                </span>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(event) => onTokenChange(event.target.value)}
                  placeholder="exp.signature"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35"
                />
              </label>
              <Button type="submit" className="h-11 sm:col-span-2">
                {t("orders.manual.submit")}
              </Button>
            </form>
            {manualFormError && (
              <p className="mt-3 text-sm text-red-600">{manualFormError}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface OrderTimelineProps {
  timeline: TimelineStage[];
  t: Translate;
}

function OrderTimeline({ timeline, t }: OrderTimelineProps) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 animate-fade-in-up">
      <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/70 mb-2 font-semibold">
        {t("orders.timeline.title")}
      </p>
      <ol className="space-y-2">
        {timeline.map((stage, index) => (
          <li
            key={stage.key}
            className="relative pl-6"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {index < timeline.length - 1 && (
              <span
                className="absolute left-[0.35rem] top-3 h-[calc(100%-0.2rem)] w-px bg-[var(--border)]"
                style={{ transformOrigin: "top" }}
              />
            )}
            <span
              className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${timelineDotClass(stage.state)}`}
            />
            <p className={`text-sm font-medium ${timelineTextClass(stage.state)}`}>
              {stage.label}
            </p>
            <p className="text-xs text-[var(--foreground)]/75">{stage.detail}</p>
            {stage.when && (
              <p className="text-[11px] text-[var(--foreground)]/65">
                {formatDateTime(stage.when, t("orders.noDate"))}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

interface OrderCardProps {
  reference: StoredOrderRef;
  lookup: OrderLookupState | undefined;
  t: Translate;
  onRemove: (id: string) => void;
}

function OrderCard({ reference, lookup, t, onRemove }: OrderCardProps) {
  const order = lookup?.order;
  const fulfillment = lookup?.fulfillment || null;
  const status = order?.status || null;
  const trackingCode = order ? extractTrackingCode(order.notes) : null;
  const dispatchReference = order ? extractDispatchReference(order.notes) : null;
  const guideHint = order ? getGuideHint(order, fulfillment, trackingCode, t) : null;
  const timeline = order ? buildTimeline(order, fulfillment, t) : [];

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {t("orders.orderLabel")} #{reference.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs font-mono text-[var(--foreground)]/70 break-all">{reference.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
          >
            {status ? t(STATUS_LABEL_KEYS[status]) : t("orders.statusUnknown")}
          </span>
          <button
            type="button"
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => onRemove(reference.id)}
            aria-label={t("orders.removeLabel", { id: reference.id })}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-1 text-sm text-[var(--foreground)]/80 sm:grid-cols-2">
        <p>
          <span className="font-medium text-[var(--foreground)]">{t("orders.totalLabel")}:</span>{" "}
          {order ? formatCop(order.total) : "-"}
        </p>
        <p>
          <span className="font-medium text-[var(--foreground)]">{t("orders.createdLabel")}:</span>{" "}
          {order ? formatDateTime(order.created_at, t("orders.noDate")) : t("orders.noData")}
        </p>
        <p>
          <span className="font-medium text-[var(--foreground)]">{t("orders.lastCheckedLabel")}:</span>{" "}
          {formatDateTime(lookup?.fetchedAt || null, t("orders.noDate"))}
        </p>
        {trackingCode && (
          <p>
            <span className="font-medium text-[var(--foreground)]">{t("order.trackingLabel")}:</span>{" "}
            <span className="font-mono">{trackingCode}</span>
          </p>
        )}
        {!trackingCode && guideHint && (
          <p className="sm:col-span-2">
            <span className="font-medium text-[var(--foreground)]">{t("order.trackingLabel")}:</span>{" "}
            {guideHint}
          </p>
        )}
        {dispatchReference && (
          <p>
            <span className="font-medium text-[var(--foreground)]">{t("orders.dispatchReferenceLabel")}:</span>{" "}
            <span className="font-mono">{dispatchReference}</span>
          </p>
        )}
        {fulfillment?.has_dispatch_error && (
          <p className="sm:col-span-2 text-rose-700">
            <span className="font-medium">{t("orders.dispatchErrorLabel")}:</span>{" "}
            {fulfillment.last_error || t("orders.dispatchErrorFallback")}
          </p>
        )}
      </div>

      {order && <OrderTimeline timeline={timeline} t={t} />}

      {lookup?.loading && (
        <p className="text-xs text-[var(--foreground)]/70 mt-2 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          {t("orders.refreshing")}
        </p>
      )}

      {lookup?.error ? (
        <p className="text-xs text-red-600 mt-2">{lookup.error}</p>
      ) : (
        order && (
          <p className="text-xs text-[var(--foreground)] mt-2 font-medium">
            {t("orders.nextStepLabel")}: {getNextStepText(order, fulfillment, t)}
          </p>
        )
      )}
    </article>
  );
}

export function MyOrdersPanel() {
  const { t } = useLanguage();
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
      const result = await fetchOrder(reference, t);
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
          error: t("orders.error.connection"),
        },
      }));
    }
  }, [t]);

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
      setHistoryError(t("orders.history.invalidEmail"));
      setHistoryMessage(null);
      return;
    }

    if (normalizeDigits(cleanPhone).length < 7) {
      setHistoryError(t("orders.history.invalidPhone"));
      setHistoryMessage(null);
      return;
    }

    if (cleanDocument && normalizeDigits(cleanDocument).length < 4) {
      setHistoryError(t("orders.history.invalidDocument"));
      setHistoryMessage(null);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryMessage(null);

    try {
      const result = await fetchOrderHistory(
        {
          email: cleanEmail,
          phone: cleanPhone,
          document: cleanDocument,
        },
        t
      );

      if (result.error) {
        setHistoryError(result.error);
        return;
      }

      if (!result.refs.length) {
        replaceRefs([]);
        setHistoryError(t("orders.history.noneFound"));
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
          ? t("orders.history.foundSingle")
          : t("orders.history.foundMultiple", { count: result.refs.length })
      );
      setManualOpen(false);

      await Promise.all(nextRefs.map((reference) => refreshOne(reference)));
    } catch {
      setHistoryError(t("orders.history.connectionError"));
    } finally {
      setHistoryLoading(false);
    }
  };

  const addOrderRef = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanId = orderIdInput.trim().toLowerCase();
    const cleanToken = tokenInput.trim();

    if (!isUuid(cleanId)) {
      setManualFormError(t("orders.manual.invalidId"));
      return;
    }

    if (cleanToken.length < 16) {
      setManualFormError(t("orders.manual.invalidToken"));
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

  const handleRemoveOrder = (id: string) => {
    if (window.confirm(t("orders.confirmRemove"))) {
      removeOrderRef(id);
    }
  };

  const clearAll = () => {
    setRefs([]);
    setLookupById({});
    setHistoryMessage(null);
  };

  const handleClearAll = () => {
    if (window.confirm(t("orders.confirmClearAll"))) {
      clearAll();
    }
  };

  const pendingCount = useMemo(() => {
    return refs.filter((ref) => lookupById[ref.id]?.order?.status === "pending").length;
  }, [lookupById, refs]);

  return (
    <section className="not-prose rounded-[var(--card-radius)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{t("orders.title")}</h2>
          <p className="text-sm text-[var(--foreground)]/80 mt-1">
            {t("orders.subtitle")}
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
          {t("orders.refresh")}
        </Button>
      </div>

      <OrderHistoryForm
        t={t}
        emailInput={emailInput}
        phoneInput={phoneInput}
        documentInput={documentInput}
        orderIdInput={orderIdInput}
        tokenInput={tokenInput}
        historyLoading={historyLoading}
        manualOpen={manualOpen}
        manualFormError={manualFormError}
        onSubmitHistory={loadOrderHistory}
        onSubmitManual={addOrderRef}
        onToggleManual={() => startTransition(() => setManualOpen((prev) => !prev))}
        onEmailChange={setEmailInput}
        onPhoneChange={setPhoneInput}
        onDocumentChange={setDocumentInput}
        onOrderIdChange={setOrderIdInput}
        onTokenChange={setTokenInput}
      />

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
            {t("orders.savedCount", { count: refs.length })} | {t("orders.pendingCount", { count: pendingCount })}
          </p>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
          >
            {t("orders.clearList")}
          </button>
        </div>
      )}

      {!refs.length ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)]/80">
          {t("orders.emptyState")}
        </p>
      ) : (
        <div className="space-y-3">
          {refs.map((reference) => (
            <OrderCard
              key={reference.id}
              reference={reference}
              lookup={lookupById[reference.id]}
              t={t}
              onRemove={handleRemoveOrder}
            />
          ))}
        </div>
      )}
    </section>
  );
}

