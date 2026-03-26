"use client";

import { fetchWithCsrf } from "@/lib/csrf-client";
import { sanitizeText } from "@/lib/sanitize";

export type AnalyticsEventType =
  | "view_content"
  | "add_to_cart"
  | "buy_now"
  | "begin_checkout"
  | "purchase"
  | "save_wishlist"
  | "remove_wishlist"
  | "view_wishlist";

export interface AnalyticsEventInput {
  event_type: AnalyticsEventType;
  product_id?: string | null;
  order_id?: string | null;
  pathname?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface ClientAnalyticsEventPayload extends AnalyticsEventInput {
  session_id: string;
}

const ANALYTICS_SESSION_STORAGE_KEY = "vortixy_analytics_session_id";
const ANALYTICS_ONCE_STORAGE_PREFIX = "vortixy_analytics_once:";

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeText(value, 240);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 12).map((entry) => sanitizeMetadataValue(entry));
  }
  if (value && typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>);
  }
  return null;
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  return Object.entries(metadata).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      const sanitizedKey = sanitizeText(key, 60);
      if (!sanitizedKey) return acc;
      acc[sanitizedKey] = sanitizeMetadataValue(value);
      return acc;
    },
    {},
  );
}

export function getAnalyticsSessionId(): string | null {
  if (typeof window === "undefined") return null;

  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY);
  if (existing) return existing;

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  window.sessionStorage.setItem(ANALYTICS_SESSION_STORAGE_KEY, nextId);
  return nextId;
}

export async function trackClientEvent(
  event: AnalyticsEventInput,
  options?: { onceKey?: string },
): Promise<void> {
  if (typeof window === "undefined") return;

  const onceStorageKey = options?.onceKey
    ? `${ANALYTICS_ONCE_STORAGE_PREFIX}${options.onceKey}`
    : null;
  if (onceStorageKey && window.sessionStorage.getItem(onceStorageKey)) {
    return;
  }

  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;

  const payload: ClientAnalyticsEventPayload = {
    session_id: sessionId,
    event_type: event.event_type,
    product_id: event.product_id || null,
    order_id: event.order_id || null,
    pathname: sanitizeText(event.pathname || window.location.pathname, 240),
    metadata: sanitizeMetadata(event.metadata || {}),
  };

  try {
    const response = await fetchWithCsrf("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (response.ok && onceStorageKey) {
      window.sessionStorage.setItem(onceStorageKey, "1");
    }
  } catch {
    // Analytics should never interrupt the product flow.
  }
}
