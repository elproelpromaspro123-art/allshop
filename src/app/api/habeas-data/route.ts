import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import { isFeedbackWebhookConfigured, sendFeedbackToDiscord } from "@/lib/feedback-discord";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 5 * 1024;

const ALLOWED_REQUEST_TYPES = new Set([
  "access",
  "update",
  "delete",
  "export",
]);

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return apiError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
      headers: noStoreHeaders(),
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return apiError("Token de seguridad inválido. Recarga la página.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
      headers: noStoreHeaders(),
    });
  }

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    return apiError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
      headers: noStoreHeaders(),
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `habeas:${clientIp}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[HabeasData] Rate limit hit for IP: ${clientIp}`);
    return apiError("Demasiadas solicitudes. Intenta más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  if (!isFeedbackWebhookConfigured()) {
    return apiError("Servicio no disponible por ahora.", {
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      headers: noStoreHeaders(),
    });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    requestType?: string;
    details?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("Solicitud inválida.", {
      status: 400,
      code: "INVALID_JSON",
      headers: noStoreHeaders(),
    });
  }

  const name = sanitizeText(body.name || "", 80);
  const email = sanitizeEmail(body.email || "");
  const phone = sanitizeText(body.phone || "", 20);
  const document = sanitizeText(body.document || "", 20);
  const requestType = sanitizeText(body.requestType || "", 20);
  const details = sanitizeText(body.details || "", 1000);

  if (name.length < 2) {
    return apiError("El nombre es obligatorio (mínimo 2 caracteres).", {
      status: 400,
      code: "INVALID_NAME",
      headers: noStoreHeaders(),
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 120) {
    return apiError("Ingresa un correo electrónico válido.", {
      status: 400,
      code: "INVALID_EMAIL",
      headers: noStoreHeaders(),
    });
  }

  if (document.length < 4) {
    return apiError("El número de documento es obligatorio.", {
      status: 400,
      code: "INVALID_DOCUMENT",
      headers: noStoreHeaders(),
    });
  }

  if (!ALLOWED_REQUEST_TYPES.has(requestType)) {
    return apiError("Selecciona el tipo de solicitud.", {
      status: 400,
      code: "INVALID_REQUEST_TYPE",
      headers: noStoreHeaders(),
    });
  }

  try {
    await sendFeedbackToDiscord({
      type: "habeas_data",
      name,
      email,
      message: `Tipo: ${requestType}\nTeléfono: ${phone}\nDocumento: ${document}\nDetalles: ${details}`,
      orderId: null,
      page: null,
      clientIp,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[HabeasData] Discord send error:", error);
    return apiError("No se pudo enviar la solicitud. Intenta nuevamente.", {
      status: 500,
      code: "DELIVERY_FAILED",
      headers: noStoreHeaders(),
    });
  }

  return apiOkFields({}, { headers: noStoreHeaders() });
}
