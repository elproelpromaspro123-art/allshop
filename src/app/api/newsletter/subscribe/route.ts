import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { sendNewsletterSubscriptionToDiscord } from "@/lib/discord-newsletter";
import { getClientIp } from "@/lib/utils";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import {
  hasExceededBodySize,
  isValidContactEmail,
  normalizeContactEmail,
} from "@/lib/contact/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 1024;

function newsletterError(
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
  try {
    if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
      return newsletterError("Solicitud no autorizada.", {
        status: 403,
        code: "FORBIDDEN_ORIGIN",
      });
    }

    const csrfToken = request.headers.get("x-csrf-token");
    if (!validateCsrfToken(csrfToken)) {
      return newsletterError("Token de seguridad inválido. Recarga la página.", {
        status: 403,
        code: "INVALID_CSRF_TOKEN",
      });
    }

    if (hasExceededBodySize(request.headers, maxBodySize)) {
      return newsletterError("Solicitud demasiado grande.", {
        status: 413,
        code: "REQUEST_TOO_LARGE",
      });
    }

    const body = await request.json();
    const payload = body && typeof body === "object" ? body : {};
    const email = normalizeContactEmail(
      typeof (payload as { email?: unknown }).email === "string"
        ? String((payload as { email?: string }).email)
        : "",
    );

    if (!email) {
      return newsletterError("Email requerido.", {
        status: 400,
        code: "INVALID_EMAIL",
      });
    }

    if (!isValidContactEmail(email)) {
      return newsletterError("Email inválido.", {
        status: 400,
        code: "INVALID_EMAIL",
      });
    }

    const clientIp = getClientIp(request.headers);

    const rateLimit = await checkRateLimitDb({
      key: `newsletter:${clientIp}`,
      limit: 1,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return newsletterError("Ya te has suscrito recientemente.", {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    sendNewsletterSubscriptionToDiscord({
      email,
      ip: clientIp,
      userAgent: request.headers.get("user-agent") || null,
      path: request.headers.get("referer") || null,
    }).catch((err) => {
      console.error("[Newsletter] Discord notification failed:", err);
    });

    return apiOkFields(
      { message: "¡Gracias por suscribirte!" },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    console.error("[Newsletter] Subscription error:", error);
    return newsletterError("Error al suscribirse.", {
      status: 500,
      code: "SUBSCRIPTION_FAILED",
    });
  }
}
