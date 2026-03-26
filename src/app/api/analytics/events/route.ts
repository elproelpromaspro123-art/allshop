import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { getClientIp } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 8 * 1024;

const ALLOWED_EVENT_TYPES = new Set([
  "view_content",
  "add_to_cart",
  "buy_now",
  "begin_checkout",
  "purchase",
  "save_wishlist",
  "remove_wishlist",
  "view_wishlist",
] as const);

type AllowedAnalyticsEventType = (typeof ALLOWED_EVENT_TYPES extends Set<infer T>
  ? T
  : never) & string;

interface AnalyticsEventBody {
  session_id?: string;
  event_type?: string;
  product_id?: string | null;
  order_id?: string | null;
  pathname?: string | null;
  metadata?: Record<string, unknown> | null;
}

function analyticsError(
  error: string,
  options: { status: number; code: string; retryAfterSeconds?: number | null },
) {
  return apiError(error, {
    status: options.status,
    code: options.code,
    retryAfterSeconds: options.retryAfterSeconds,
    headers: noStoreHeaders(
      options.retryAfterSeconds
        ? { "Retry-After": String(options.retryAfterSeconds) }
        : undefined,
    ),
  });
}

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
      const cleanKey = sanitizeText(key, 60);
      if (!cleanKey) return acc;
      acc[cleanKey] = sanitizeMetadataValue(value);
      return acc;
    },
    {},
  );
}

function normalizeBody(body: AnalyticsEventBody) {
  const eventType = sanitizeText(body.event_type || "", 60) as AllowedAnalyticsEventType;
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return null;

  const sessionId = sanitizeText(body.session_id || "", 120);
  if (!sessionId) return null;

  return {
    session_id: sessionId,
    event_type: eventType,
    product_id: body.product_id ? sanitizeText(body.product_id, 80) : null,
    order_id: body.order_id ? sanitizeText(body.order_id, 80) : null,
    pathname: body.pathname ? sanitizeText(body.pathname, 240) : null,
    metadata: sanitizeMetadata(body.metadata),
  };
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return analyticsError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return analyticsError("Token de seguridad inválido.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxBodySize) {
    return analyticsError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `analytics:${clientIp}`,
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return analyticsError("Demasiadas solicitudes.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  let body: AnalyticsEventBody;
  try {
    body = (await request.json()) as AnalyticsEventBody;
  } catch {
    return analyticsError("JSON inválido.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const normalized = normalizeBody(body);
  if (!normalized) {
    return analyticsError("Payload de analytics inválido.", {
      status: 400,
      code: "INVALID_ANALYTICS_EVENT",
    });
  }

  if (!isSupabaseAdminConfigured) {
    return apiOkFields(
      { accepted: true, stored: false },
      { status: 202, headers: noStoreHeaders() },
    );
  }

  const { error } = await supabaseAdmin.from("analytics_events").insert({
    session_id: normalized.session_id,
    event_type: normalized.event_type,
    product_id: normalized.product_id,
    order_id: normalized.order_id,
    pathname: normalized.pathname,
    metadata: normalized.metadata,
  });

  if (error) {
    return analyticsError("No se pudo registrar el evento.", {
      status: 500,
      code: "ANALYTICS_PERSISTENCE_FAILED",
    });
  }

  return apiOkFields(
    { accepted: true, stored: true },
    { status: 202, headers: noStoreHeaders() },
  );
}
