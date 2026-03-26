import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import {
  isFeedbackWebhookConfigured,
  sendFeedbackToDiscord,
  type FeedbackType,
} from "@/lib/feedback-discord";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import {
  hasExceededBodySize,
  isAllowedContactValue,
  isValidContactEmail,
  normalizeContactEmail,
  normalizeContactText,
} from "@/lib/contact/validation";

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

const ALLOWED_TYPES = ["error", "sugerencia", "comentario"] as const;

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

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return feedbackError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return feedbackError("Token de seguridad inválido. Recarga la página.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  if (hasExceededBodySize(request.headers, maxBodySize)) {
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
    console.warn("[Feedback] Rate limit hit", {
      clientIp,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
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
    const parsedBody = await request.json();
    if (!parsedBody || typeof parsedBody !== "object") {
      throw new Error("Invalid body");
    }
    body = parsedBody as FeedbackBody;
  } catch {
    return feedbackError("Solicitud inválida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const type = normalizeContactText(body.type || "", 20).toLowerCase();
  const name = normalizeContactText(body.name || "", 80);
  const email = normalizeContactEmail(body.email || "");
  const message = normalizeContactText(body.message || "", 2000);
  const orderId = normalizeContactText(body.orderId || "", 80);
  const page = normalizeContactText(body.page || "", 240);

  if (!isAllowedContactValue(type, ALLOWED_TYPES)) {
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

  if (!isValidContactEmail(email)) {
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
    console.info("[Feedback] Accepted", {
      type,
      clientIp,
      page: page || null,
      hasOrderId: Boolean(orderId),
    });

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
    return feedbackError(
      "No se pudo enviar el feedback ahora. Intenta nuevamente.",
      {
        status: 500,
        code: "FEEDBACK_DELIVERY_FAILED",
      },
    );
  }

  return apiOkFields({}, { headers: noStoreHeaders() });
}
