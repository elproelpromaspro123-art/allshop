"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ClipboardCheck,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { fetchWithCsrf, isCsrfClientError } from "@/lib/csrf-client";
import {
  buildTimeline,
  extractDispatchReference,
  extractTrackingCode,
  getGuideHint,
  getNextStepText,
  normalizeFulfillmentSummary,
  type FulfillmentSummary,
  type TimelineStage,
  type TimelineState,
  type Translate,
} from "@/lib/order-tracking";
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

const STATUS_LABEL_KEYS: Record<OrderStatus, string> = {
  pending: "order.status.pending",
  paid: "order.status.paid",
  processing: "order.status.processing",
  shipped: "order.status.shipped",
  delivered: "order.status.delivered",
  cancelled: "order.status.cancelled",
  refunded: "order.status.refunded",
  deleted: "order.status.deleted",
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
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

function timelineDotClass(state: TimelineState): string {
  if (state === "done") return "bg-gradient-to-br from-emerald-500 to-teal-500";
  if (state === "current")
    return "bg-gradient-to-br from-blue-500 to-indigo-500";
  if (state === "warning") return "bg-gradient-to-br from-red-500 to-rose-500";
  return "bg-gray-200";
}

function timelineTextClass(state: TimelineState): string {
  if (state === "done") return "text-emerald-700";
  if (state === "current") return "text-blue-700";
  if (state === "warning") return "text-rose-700";
  return "text-gray-700";
}

async function fetchOrder(
  reference: StoredOrderRef,
  t: Translate,
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
  input: { email?: string; phone?: string; document?: string; token?: string },
  t: Translate,
): Promise<{
  refs: HistoryOrderRef[];
  error: string | null;
  action?: "verify_email";
}> {
  const body = input.token
    ? { token: input.token }
    : {
        email: input.email,
        phone: input.phone,
        document: input.document || undefined,
      };

  const response = await fetchWithCsrf("/api/orders/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    error?: string;
    orders?: Array<{ id?: string; order_token?: string }>;
    action?: string;
  };

  if (!response.ok) {
    return { refs: [], error: payload.error || t("orders.history.fetchError") };
  }

  if (payload.action === "verify_email") {
    return { refs: [], error: null, action: "verify_email" };
  }

  const refs = Array.isArray(payload.orders)
    ? payload.orders
        .map((item) => {
          const id = String(item?.id || "")
            .trim()
            .toLowerCase();
          const orderToken = String(item?.order_token || "").trim();
          if (!isUuid(id) || orderToken.length < 16) return null;
          return { id, order_token: orderToken };
        })
        .filter((item): item is HistoryOrderRef => Boolean(item))
    : [];

  return { refs, error: null };
}

function statusBadgeClass(status: OrderStatus | null): string {
  if (status === "pending")
    return "bg-amber-100 text-amber-900 border border-amber-200";
  if (status === "processing" || status === "paid")
    return "bg-blue-50 text-blue-900 border border-blue-200";
  if (status === "shipped")
    return "bg-indigo-50 text-indigo-900 border border-indigo-200";
  if (status === "delivered")
    return "bg-emerald-50 text-emerald-900 border border-emerald-200";
  if (status === "cancelled" || status === "refunded")
    return "bg-rose-50 text-rose-900 border border-rose-200";
  return "bg-gray-100 text-gray-900 border border-gray-200";
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
        if (!item || typeof item !== "object" || Array.isArray(item))
          return null;
        const id = String((item as Record<string, unknown>).id || "").trim();
        const token = String(
          (item as Record<string, unknown>).token || "",
        ).trim();
        const savedAt =
          toIsoDate((item as Record<string, unknown>).savedAt) ||
          new Date().toISOString();
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
    <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.14fr)_minmax(260px,0.86fr)]">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
            <Search className="w-4 h-4 text-indigo-700" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {t("orders.searchTitle")}
          </p>
        </div>
        <form onSubmit={onSubmitHistory} className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900/70">
              {t("orders.emailLabel")}
            </span>
            <input
              type="email"
              value={emailInput}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder={t("orders.emailPlaceholder")}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-900/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900/70">
              {t("orders.phoneLabel")}
            </span>
            <input
              type="tel"
              value={phoneInput}
              onChange={(event) => onPhoneChange(event.target.value)}
              placeholder={t("orders.phonePlaceholder")}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-900/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900/70">
              {t("orders.documentLabel")}
            </span>
            <input
              type="text"
              value={documentInput}
              onChange={(event) => onDocumentChange(event.target.value)}
              placeholder={t("orders.documentPlaceholder")}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-900/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </label>
          <Button
            type="submit"
            className="h-11 sm:col-span-2 gap-2 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-700 hover:to-indigo-500 shadow-md shadow-indigo-500/20"
            disabled={historyLoading}
          >
            {historyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {t("orders.searchButton")}
          </Button>
        </form>
        <p className="mt-3 text-xs text-gray-900/70">
          {t("orders.searchHint")}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
        <button
          type="button"
          onClick={onToggleManual}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={manualOpen}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
              <ClipboardCheck className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {t("orders.manual.title")}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-900/70 transition-transform ${manualOpen ? "rotate-180" : ""}`}
          />
        </button>

        {manualOpen && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="mb-3 text-xs text-gray-900/70">
              {t("orders.manual.hint")}
            </p>
            <form
              onSubmit={onSubmitManual}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900/70">
                  {t("orders.manual.idLabel")}
                </span>
                <input
                  type="text"
                  value={orderIdInput}
                  onChange={(event) => onOrderIdChange(event.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-900/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-900/70">
                  {t("orders.manual.tokenLabel")}
                </span>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(event) => onTokenChange(event.target.value)}
                  placeholder="exp.signature"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-900/45 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </label>
              <Button
                type="submit"
                className="h-11 sm:col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25"
              >
                {t("orders.manual.submit")}
              </Button>
            </form>
            {manualFormError && (
              <p className="mt-3 text-sm text-red-600">{manualFormError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderTimelineProps {
  timeline: TimelineStage[];
  t: Translate;
}

function OrderTimeline({ timeline, t }: OrderTimelineProps) {
  const TIMELINE_ICONS: Record<string, React.ReactNode> = {
    registered: <Package className="w-3 h-3" />,
    manual_review: <ClipboardCheck className="w-3 h-3" />,
    dispatch: <Truck className="w-3 h-3" />,
    shipping: <Clock className="w-3 h-3" />,
    delivered: <CheckCircle2 className="w-3 h-3" />,
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm mt-4 p-4 animate-fade-in-up">
      <p className="text-xs uppercase tracking-wider text-gray-900/70 mb-3 font-semibold flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-indigo-700" />
        {t("orders.timeline.title")}
      </p>
      <ol className="space-y-3">
        {timeline.map((stage, index) => (
          <li
            key={stage.key}
            className="relative pl-7"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            {index < timeline.length - 1 && (
              <span className="absolute left-[0.4rem] top-4 h-[calc(100%-0.4rem)] w-px bg-gradient-to-b from-gray-200 to-transparent" />
            )}
            <span
              className={`absolute left-0 top-2 h-4 w-4 rounded-full flex items-center justify-center ${timelineDotClass(stage.state)} shadow-sm text-white`}
            >
              {TIMELINE_ICONS[stage.key]}
            </span>
            <p
              className={`text-sm font-medium ${timelineTextClass(stage.state)}`}
            >
              {stage.label}
            </p>
            <p className="text-xs text-gray-900/75">
              {stage.detail}
            </p>
            {stage.when && (
              <p className="text-[11px] text-gray-900/60 mt-0.5">
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
  const dispatchReference = order
    ? extractDispatchReference(order.notes)
    : null;
  const guideHint = order
    ? getGuideHint(order, fulfillment, trackingCode, t)
    : null;
  const timeline = order ? buildTimeline(order, fulfillment, t) : [];

  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-700" />
            {t("orders.orderLabel")} #{reference.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs font-mono text-gray-900/60 break-all">
            {reference.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
          >
            {status ? t(STATUS_LABEL_KEYS[status]) : t("orders.statusUnknown")}
          </span>
          <button
            type="button"
            className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
            onClick={() => onRemove(reference.id)}
            aria-label={t("orders.removeLabel", { id: reference.id })}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-2 text-sm text-gray-900/80 sm:grid-cols-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {t("orders.totalLabel")}:
          </span>
          <span className="font-semibold text-gray-900">
            {order ? formatCop(order.total) : "-"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {t("orders.createdLabel")}:
          </span>
          <span>
            {order
              ? formatDateTime(order.created_at, t("orders.noDate"))
              : t("orders.noData")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">
            {t("orders.lastCheckedLabel")}:
          </span>
          <span className="text-xs">
            {formatDateTime(lookup?.fetchedAt || null, t("orders.noDate"))}
          </span>
        </div>
        {trackingCode && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <span className="font-medium text-gray-900">
              {t("order.trackingLabel")}:
            </span>
            <span className="font-mono text-indigo-700 font-semibold">
              {trackingCode}
            </span>
          </div>
        )}
        {!trackingCode && guideHint && (
          <p className="sm:col-span-2 text-sm text-gray-500">
            {guideHint}
          </p>
        )}
        {dispatchReference && (
          <div className="flex items-center gap-2 sm:col-span-2">
            <span className="font-medium text-gray-900">
              {t("orders.dispatchReferenceLabel")}:
            </span>
            <span className="font-mono text-indigo-700 font-semibold">
              {dispatchReference}
            </span>
          </div>
        )}
        {fulfillment?.has_dispatch_error && (
          <p className="sm:col-span-2 text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">
              {t("orders.dispatchErrorLabel")}:
            </span>
            {fulfillment.last_error || t("orders.dispatchErrorFallback")}
          </p>
        )}
      </div>

      {order && <OrderTimeline timeline={timeline} t={t} />}

      {lookup?.loading && (
        <p className="text-xs text-gray-900/70 mt-3 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin text-indigo-700" />
          {t("orders.refreshing")}
        </p>
      )}

      {lookup?.error ? (
        <p className="text-xs text-red-600 mt-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {lookup.error}
        </p>
      ) : (
        order && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-900 font-medium flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-700" />
              <span>{t("orders.nextStepLabel")}:</span>
              <span className="text-indigo-700">
                {getNextStepText(order, fulfillment, t)}
              </span>
            </p>
          </div>
        )
      )}
    </article>
  );
}

export function MyOrdersPanel() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const handledTokenRef = useRef<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [documentInput, setDocumentInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [refs, setRefs] = useState<StoredOrderRef[]>([]);
  const [refsLoaded, setRefsLoaded] = useState(false);
  const [lookupById, setLookupById] = useState<
    Record<string, OrderLookupState>
  >({});
  const [manualFormError, setManualFormError] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    setRefs(readStoredRefs());
    setRefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!refsLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
  }, [refs, refsLoaded]);

  const replaceRefs = useCallback((nextRefs: StoredOrderRef[]) => {
    const deduped = nextRefs
      .filter(
        (item, index, array) =>
          array.findIndex((other) => other.id === item.id) === index,
      )
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

  const refreshOne = useCallback(
    async (reference: StoredOrderRef) => {
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
    },
    [t],
  );

  useEffect(() => {
    const token = searchParams.get("history_token");
    if (!token || handledTokenRef.current === token) return;
    handledTokenRef.current = token;

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryMessage(null);

    const run = async () => {
      try {
        const result = await fetchOrderHistory({ token }, t);
        if (result.error) {
          setHistoryError(result.error);
          return;
        }
        if (!result.refs.length) {
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
          nextRefs.length === 1
            ? t("orders.history.foundSingle")
            : t("orders.history.foundMultiple", { count: nextRefs.length }),
        );
        setManualOpen(false);
        await Promise.all(nextRefs.map((reference) => refreshOne(reference)));
      } catch (error) {
        setHistoryError(
          isCsrfClientError(error)
            ? "Error de seguridad. Recarga la página e intenta nuevamente."
            : t("orders.history.connectionError"),
        );
      }
    };

    void run().finally(() => {
      setHistoryLoading(false);
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("history_token");
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      } catch {
        // ignore
      }
    });
  }, [searchParams, t, replaceRefs, refreshOne]);

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
    if (normalizeDigits(cleanDocument).length < 6) {
      setHistoryError(t("orders.history.invalidDocument"));
      setHistoryMessage(null);
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryMessage(null);

    try {
      const result = await fetchOrderHistory(
        { email: cleanEmail, phone: cleanPhone, document: cleanDocument },
        t,
      );
      if (result.error) {
        setHistoryError(result.error);
        return;
      }
      if (result.action === "verify_email") {
        setHistoryMessage(t("orders.history.verifySent"));
        return;
      }
      if (!result.refs.length) {
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
          : t("orders.history.foundMultiple", { count: result.refs.length }),
      );
      setManualOpen(false);
      await Promise.all(nextRefs.map((reference) => refreshOne(reference)));
    } catch (error) {
      setHistoryError(
        isCsrfClientError(error)
          ? "Error de seguridad. Recarga la página e intenta nuevamente."
          : t("orders.history.connectionError"),
      );
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
    return refs.filter((ref) => lookupById[ref.id]?.order?.status === "pending")
      .length;
  }, [lookupById, refs]);

  return (
    <section className="not-prose rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
      <div className="rounded-2xl bg-gray-900 mb-5 px-5 py-5 text-white sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Package className="w-5 h-5 text-emerald-300" />
              {t("orders.title")}
            </h2>
            <p className="mt-1 text-sm text-white/70">{t("orders.subtitle")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-white/15 bg-white/8 text-white hover:bg-white/15 hover:text-white"
            onClick={() => void refreshAll()}
            disabled={refreshingAll || !refs.length}
          >
            {refreshingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            {t("orders.refresh")}
          </Button>
        </div>
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
        onToggleManual={() =>
          startTransition(() => setManualOpen((prev) => !prev))
        }
        onEmailChange={setEmailInput}
        onPhoneChange={setPhoneInput}
        onDocumentChange={setDocumentInput}
        onOrderIdChange={setOrderIdInput}
        onTokenChange={setTokenInput}
      />

      {historyError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {historyError}
        </div>
      )}
      {historyMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          {historyMessage}
        </div>
      )}

      {refs.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-100/55 px-4 py-3">
          <p className="text-xs text-gray-900/70">
            <span className="font-medium">
              {t("orders.savedCount", { count: refs.length })}
            </span>
            <span className="mx-2">•</span>
            <span className="text-indigo-700 font-medium">
              {t("orders.pendingCount", { count: pendingCount })} pendientes
            </span>
          </p>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            {t("orders.clearList")}
          </button>
        </div>
      )}

      {!refs.length ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-900/80 font-medium">
            {t("orders.emptyState")}
          </p>
        </div>
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
