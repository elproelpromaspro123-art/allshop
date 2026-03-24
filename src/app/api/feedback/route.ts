import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import {
  isFeedbackWebhookConfigured,
  sendFeedbackToDiscord,
  type FeedbackType,
} from "@/lib/feedback-discord";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 5 * 1024;

interface FeedbackBody {
  type?: string;
  name?: string;
  email?: string;
  message?: string;
  orderId?: string;
  page?: string;
}

const ALLOWED_TYPES = new Set<FeedbackType>([
  "error",
  "sugerencia",
  "comentario",
]);

// isValidGmail removed — now accepting all valid emails (fix 6.2)

function feedbackError(
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

  // CSRF + same-origin validation
  if (process.env.NODE_ENV === "production") {
    if (!validateSameOrigin(request)) {
      return feedbackError("Solicitud no autorizada.", {
        status: 403,
        code: "FORBIDDEN_ORIGIN",
      });
    }
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return feedbackError("Token de seguridad inválido. Recarga la página.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    return feedbackError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `feedback:${clientIp}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    console.warn(`[Feedback] Rate limit hit for IP: ${clientIp}`);
    return feedbackError("Demasiadas solicitudes. Intenta más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  if (!isFeedbackWebhookConfigured()) {
    return feedbackError("Canal de feedback no disponible por ahora.", {
      status: 503,
      code: "FEEDBACK_CHANNEL_UNAVAILABLE",
    });
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return feedbackError("Solicitud inválida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const type = sanitizeText(body.type || "", 20).toLowerCase();
  const name = sanitizeText(body.name || "", 80);
  const email = sanitizeEmail(body.email || "");
  const message = sanitizeText(body.message || "", 2000);
  const orderId = sanitizeText(body.orderId || "", 80);
  const page = sanitizeText(body.page || "", 240);

  if (!ALLOWED_TYPES.has(type as FeedbackType)) {
    return feedbackError("Tipo de feedback inválido.", {
      status: 400,
      code: "INVALID_FEEDBACK_TYPE",
    });
  }

  if (name.length < 2) {
    return feedbackError("Nombre inválido.", {
      status: 400,
      code: "INVALID_NAME",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 120) {
    return feedbackError("Ingresa un correo electrónico válido.", {
      status: 400,
      code: "INVALID_EMAIL",
    });
  }

  if (message.length < 10 || message.length > 2000) {
    return feedbackError("El mensaje debe tener entre 10 y 2000 caracteres.", {
      status: 400,
      code: "INVALID_MESSAGE_LENGTH",
    });
  }

  if (orderId.length > 80 || page.length > 240) {
    return feedbackError("Datos opcionales inválidos.", {
      status: 400,
      code: "INVALID_OPTIONAL_FIELDS",
    });
  }

  try {
    await sendFeedbackToDiscord({
      type: type as FeedbackType,
      name,
      email,
      message,
      orderId: orderId || null,
      page: page || null,
      clientIp,
      userAgent: request.headers.get("user-agent"),
    });
  } catch (error) {
    console.error("[Feedback] Discord send error:", error);
    return feedbackError("No se pudo enviar el feedback ahora. Intenta nuevamente.", {
      status: 500,
      code: "FEEDBACK_DELIVERY_FAILED",
    });
  }

  return apiOkFields({}, { headers: noStoreHeaders() });
}
