import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { createOrderLookupToken } from "@/lib/order-token";
import { getPhoneLookupCandidates, normalizePhone } from "@/lib/phone";
import {
  createOrderHistoryToken,
  isOrderHistorySecretConfigured,
  verifyOrderHistoryToken,
} from "@/lib/order-history-token";
import {
  isEmailConfigured,
  sendOrderHistoryAccessEmail,
} from "@/lib/notifications";
import { getBaseUrl } from "@/lib/site";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import type { OrderStatus } from "@/types/database";

export const maxBodySize = 5 * 1024;

interface HistoryBody {
  email?: string;
  phone?: string;
  document?: string;
  token?: string;
}

interface HistoryRow {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string;
  customer_document: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDigits(value: string): string {
  return String(value || "").replace(/\D+/g, "");
}

function documentMatches(
  orderDocument: string,
  providedDocument: string,
): boolean {
  const orderDigits = normalizeDigits(orderDocument);
  if (!orderDigits || !providedDocument) return false;
  return orderDigits === providedDocument;
}

function historyError(
  error: string,
  options: {
    status: number;
    code: string;
    retryAfterSeconds?: number | null;
  },
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request.headers);

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return historyError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return historyError("Token de seguridad inválido. Recarga la página.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    console.warn(`[OrderHistory] Large body rejected for IP: ${clientIp}`);
    return historyError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `order-history:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[OrderHistory] Rate limit hit for IP: ${clientIp}`);
    return historyError("Demasiadas solicitudes. Intenta nuevamente en unos minutos.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  if (!isSupabaseAdminConfigured) {
    return historyError("Base de datos no configurada para historial de pedidos.", {
      status: 500,
      code: "SUPABASE_ADMIN_MISSING",
    });
  }

  let body: HistoryBody;
  try {
    body = (await request.json()) as HistoryBody;
  } catch {
    return historyError("Solicitud inválida para consultar historial.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const rawToken = String(body.token || "").trim();
  const tokenFlow = rawToken.length > 0;

  let email = "";
  let normalizedPhone = "";
  let phoneCandidates: string[] = [];
  let documentDigits = "";

  if (tokenFlow) {
    const payload = verifyOrderHistoryToken(rawToken);
    if (!payload) {
      return historyError("Token de acceso inválido.", {
        status: 401,
        code: "INVALID_HISTORY_TOKEN",
      });
    }
    email = String(payload.email || "")
      .trim()
      .toLowerCase();
    normalizedPhone = normalizePhone(String(payload.phone || "").trim()) || "";
    phoneCandidates = getPhoneLookupCandidates(normalizedPhone);
    documentDigits = normalizeDigits(String(payload.document || "").trim());
  } else {
    email = String(body.email || "")
      .trim()
      .toLowerCase();
    normalizedPhone = normalizePhone(String(body.phone || "").trim()) || "";
    phoneCandidates = getPhoneLookupCandidates(String(body.phone || "").trim());
    documentDigits = normalizeDigits(String(body.document || "").trim());

    if (!isValidEmail(email)) {
      return historyError("Correo inválido.", {
        status: 400,
        code: "INVALID_EMAIL",
      });
    }

    if (!normalizedPhone || !phoneCandidates.length) {
      return historyError("Teléfono inválido.", {
        status: 400,
        code: "INVALID_PHONE",
      });
    }

    if (documentDigits.length < 6) {
      return historyError("El documento debe tener al menos 6 dígitos para validar.", {
        status: 400,
        code: "INVALID_DOCUMENT",
      });
    }

    if (
      process.env.NODE_ENV === "production" &&
      !isOrderHistorySecretConfigured()
    ) {
      return historyError(
        "Configura ORDER_HISTORY_SECRET para habilitar el historial seguro.",
        {
          status: 500,
          code: "ORDER_HISTORY_SECRET_MISSING",
        },
      );
    }

    if (!isEmailConfigured()) {
      return historyError("Configura SMTP para enviar el acceso seguro al historial.", {
        status: 500,
        code: "EMAIL_NOT_CONFIGURED",
      });
    }

    const identityRateLimit = await checkRateLimitDb({
      key: `order-history:${clientIp}:${email}:${normalizedPhone}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!identityRateLimit.allowed) {
      return historyError("Demasiadas solicitudes. Intenta nuevamente en unos minutos.", {
        status: 429,
        code: "IDENTITY_RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: identityRateLimit.retryAfterSeconds,
      });
    }
  }

  if (
    !email ||
    !normalizedPhone ||
    !phoneCandidates.length ||
    documentDigits.length < 6
  ) {
    return historyError("Datos inválidos para consultar historial.", {
      status: 400,
      code: "INVALID_HISTORY_LOOKUP",
    });
  }

  let query = supabaseAdmin
    .from("orders")
    .select("id,status,total,created_at,updated_at,customer_document")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(30);

  query =
    phoneCandidates.length === 1
      ? query.eq("customer_phone", phoneCandidates[0])
      : query.in("customer_phone", phoneCandidates);

  const { data, error } = await query;
  if (error) {
    console.error("[OrderHistory] Query error:", error);
    return historyError("No se pudo consultar el historial en este momento.", {
      status: 500,
      code: "ORDER_HISTORY_QUERY_FAILED",
    });
  }

  const rows = ((data || []) as HistoryRow[]).filter((row) =>
    documentMatches(row.customer_document, documentDigits),
  );

  if (tokenFlow) {
    const orders = rows
      .map((row) => ({
        id: row.id,
        status: row.status,
        total: row.total,
        created_at: row.created_at,
        updated_at: row.updated_at,
        order_token: createOrderLookupToken(row.id),
      }))
      .filter(
        (row) =>
          typeof row.order_token === "string" && row.order_token.length > 0,
      );

    return apiOkFields(
      {
        orders,
      },
      {
        headers: noStoreHeaders(),
      },
    );
  }

  if (rows.length > 0) {
    const historyToken = createOrderHistoryToken({
      email,
      phone: normalizedPhone,
      document: documentDigits,
    });

    if (!historyToken) {
      return historyError("No se pudo generar el acceso seguro al historial.", {
        status: 500,
        code: "HISTORY_TOKEN_CREATE_FAILED",
      });
    }

    const accessUrl = `${getBaseUrl()}/seguimiento?history_token=${encodeURIComponent(historyToken)}`;
    try {
      await sendOrderHistoryAccessEmail({ email, link: accessUrl });
    } catch (sendError) {
      console.error("[OrderHistory] Email send error:", sendError);
      return historyError("No se pudo enviar el acceso al historial. Intenta más tarde.", {
        status: 500,
        code: "ORDER_HISTORY_EMAIL_FAILED",
      });
    }
  }

  // SECURITY: Anti-timing attack - always wait minimum consistent time
  const elapsed = Date.now() - startTime;
  if (elapsed < 500) {
    await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
  }

  return apiOkFields(
    {
      action: "verify_email",
    },
    {
      headers: noStoreHeaders(),
    },
  );
}
