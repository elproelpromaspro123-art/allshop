import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";
import { isFeedbackWebhookConfigured, sendFeedbackToDiscord } from "@/lib/feedback-discord";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import {
  hasExceededBodySize,
  isAllowedContactValue,
  isValidContactEmail,
  normalizeContactEmail,
  normalizeContactPhone,
  normalizeContactText,
} from "@/lib/contact/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 5 * 1024;

const ALLOWED_REQUEST_TYPES = ["access", "update", "delete", "export"] as const;

function contactError(
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
  const clientIp = getClientIp(request.headers);

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return contactError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return contactError("Token de seguridad inválido. Recarga la página.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  if (hasExceededBodySize(request.headers, maxBodySize)) {
    return contactError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `habeas:${clientIp}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn("[HabeasData] Rate limit hit", {
      clientIp,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
    return contactError("Demasiadas solicitudes. Intenta más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  if (!isFeedbackWebhookConfigured()) {
    return contactError("Servicio no disponible por ahora.", {
      status: 503,
      code: "SERVICE_UNAVAILABLE",
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
    const parsedBody = await request.json();
    if (!parsedBody || typeof parsedBody !== "object") {
      throw new Error("Invalid body");
    }
    body = parsedBody as typeof body;
  } catch {
    return contactError("Solicitud inválida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const name = normalizeContactText(body.name || "", 80);
  const email = normalizeContactEmail(body.email || "");
  const phone = normalizeContactPhone(body.phone || "");
  const document = normalizeContactText(body.document || "", 20);
  const requestType = normalizeContactText(body.requestType || "", 20);
  const details = normalizeContactText(body.details || "", 1000);

  if (name.length < 2) {
    return contactError("El nombre es obligatorio (mínimo 2 caracteres).", {
      status: 400,
      code: "INVALID_NAME",
    });
  }

  if (!isValidContactEmail(email)) {
    return contactError("Ingresa un correo electrónico válido.", {
      status: 400,
      code: "INVALID_EMAIL",
    });
  }

  if (document.length < 4) {
    return contactError("El número de documento es obligatorio.", {
      status: 400,
      code: "INVALID_DOCUMENT",
    });
  }

  if (!isAllowedContactValue(requestType, ALLOWED_REQUEST_TYPES)) {
    return contactError("Selecciona el tipo de solicitud.", {
      status: 400,
      code: "INVALID_REQUEST_TYPE",
    });
  }

  try {
    console.info("[HabeasData] Accepted", {
      clientIp,
      requestType,
    });

    await sendFeedbackToDiscord({
      type: "habeas_data",
      name,
      email,
      message: sanitizeText(
        `Tipo: ${requestType}\nTeléfono: ${phone}\nDocumento: ${document}\nDetalles: ${details}`,
        1600,
      ),
      orderId: null,
      page: null,
      clientIp,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[HabeasData] Discord send error:", error);
    return contactError("No se pudo enviar la solicitud. Intenta nuevamente.", {
      status: 500,
      code: "DELIVERY_FAILED",
    });
  }

  return apiOkFields({}, { headers: noStoreHeaders() });
}
