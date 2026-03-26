import { getConfiguredAppUrl } from "@/lib/env";
import type { OrderItem, OrderStatus } from "@/types/database";
import { escapeHtml } from "@/lib/utils";

export interface NotificationOrderRecord {
  id: string;
  customer_name: string;
  customer_email: string | null;
  total: number;
  status: OrderStatus | string;
  notes: string | null;
  items: unknown;
}

export interface OrderNotificationDetails {
  orderShortId: string;
  statusLabel: string;
  statusStyle: { bg: string; text: string; border: string };
  firstName: string;
  trackingCode: string | null;
  dispatchReference: string | null;
  customerNote: string | null;
  manualReview: {
    completed: boolean;
    completedAt: string | null;
  };
  nextStepText: string;
  trackingLink: string | null;
  orderItems: OrderItem[];
  orderTotal: number;
}

export const ORDER_EMAIL_THEME = {
  accent: "#00c97b",
  accentStrong: "#008f58",
  accentDark: "#0b3b2a",
  accentSoft: "#ecfdf5",
  accentText: "#065f46",
  warning: "#d97706",
  warningSoft: "#fffbeb",
} as const;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  deleted: "Eliminado",
};

export const STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  paid: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  processing: { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  shipped: { bg: "#E0E7FF", text: "#3730A3", border: "#C7D2FE" },
  delivered: { bg: "#DCFCE7", text: "#166534", border: "#BBF7D0" },
  cancelled: { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
  refunded: { bg: "#FFE4E6", text: "#9F1239", border: "#FECDD3" },
  deleted: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
};

export function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

export function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function getAppUrl(): string | null {
  const raw = String(getConfiguredAppUrl() || "").trim();
  if (!raw) return null;
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function buildOrderShortId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

export function normalizeEmailAddress(email: string): string {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function getNextStepText(
  status: OrderStatus,
  trackingCode: string | null,
): string {
  if (status === "pending" || status === "paid") {
    return "Estamos validando tu pedido. Te avisaremos cuando pase a preparación.";
  }
  if (status === "processing") {
    return "Estamos preparando tu despacho. Pronto recibirás la guía.";
  }
  if (status === "shipped") {
    return trackingCode
      ? "Tu pedido está en tránsito. Revisa la guía para ver el avance."
      : "Tu pedido está en tránsito. La guía se reflejará pronto.";
  }
  if (status === "delivered") {
    return "Pedido entregado. ¡Gracias por tu compra!";
  }
  if (status === "cancelled") {
    return "Pedido cancelado. Si necesitas ayuda, responde este correo.";
  }
  if (status === "refunded") {
    return "Reembolso procesado. Si tienes dudas, responde este correo.";
  }
  return "Te mantendremos informado sobre cualquier cambio.";
}

export function parseNotes(rawNotes: string | null): Record<string, unknown> {
  if (!rawNotes) return {};

  try {
    const parsed = JSON.parse(rawNotes) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { previous_notes: rawNotes };
  } catch {
    return { previous_notes: rawNotes };
  }
}

export function getRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function normalizeOrderItems(items: unknown): OrderItem[] {
  if (!Array.isArray(items)) return [];

  return items.filter(isOrderItem);
}

export function extractTrackingCode(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const candidates = fulfillment.tracking_candidates;

  if (!Array.isArray(candidates)) return null;

  const first = candidates.find(
    (value) => typeof value === "string" && value.trim().length >= 4,
  );
  return typeof first === "string" ? first.trim() : null;
}

export function extractDispatchReference(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const fulfillment = getRecord(parsed.fulfillment);
  const references = fulfillment.provider_order_references;

  if (!Array.isArray(references)) return null;

  const first = references.find(
    (value) => typeof value === "string" && value.trim().length >= 3,
  );
  return typeof first === "string" ? first.trim() : null;
}

export function extractCustomerNote(notes: string | null): string | null {
  const parsed = parseNotes(notes);
  const customerUpdates = getRecord(parsed.customer_updates);
  const note = String(customerUpdates.latest_note || "").trim();
  return note || null;
}

export function extractManualReview(notes: string | null): {
  completed: boolean;
  completedAt: string | null;
} {
  const parsed = parseNotes(notes);
  const manualReview = getRecord(parsed.manual_review);
  const completed = manualReview.completed === true;
  const completedAt =
    typeof manualReview.completed_at === "string"
      ? manualReview.completed_at
      : null;
  return { completed, completedAt };
}

export function resolveOrderNotificationDetails(
  order: NotificationOrderRecord,
  status: OrderStatus,
): OrderNotificationDetails {
  const trackingCode = extractTrackingCode(order.notes);
  const dispatchReference = extractDispatchReference(order.notes);
  const customerNote = extractCustomerNote(order.notes);
  const manualReview = extractManualReview(order.notes);
  const appUrl = getAppUrl();
  const firstName = String(order.customer_name || "")
    .split(" ")[0]
    ?.trim();

  return {
    orderShortId: buildOrderShortId(order.id),
    statusLabel: STATUS_LABELS[status] || status,
    statusStyle: STATUS_STYLES[status] || STATUS_STYLES.pending,
    firstName: firstName || "cliente",
    trackingCode,
    dispatchReference,
    customerNote,
    manualReview,
    nextStepText: getNextStepText(status, trackingCode),
    trackingLink: appUrl ? `${appUrl}/seguimiento` : null,
    orderItems: normalizeOrderItems(order.items),
    orderTotal: order.total,
  };
}

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.product_id === "string" &&
    typeof record.product_name === "string" &&
    (typeof record.variant === "string" || record.variant === null) &&
    typeof record.quantity === "number" &&
    typeof record.price === "number" &&
    typeof record.image === "string"
  );
}
