import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { sendNewsletterSubscriptionToDiscord } from "@/lib/discord-newsletter";
import { getClientIp } from "@/lib/utils";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";

const SUBSCRIBED_IPS = new Map<string, number>();
const SUBSCRIPTION_COOLDOWN_MS = 60_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return apiError("Email requerido.", {
        status: 400,
        code: "INVALID_EMAIL",
        headers: noStoreHeaders(),
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return apiError("Email inválido.", {
        status: 400,
        code: "INVALID_EMAIL",
        headers: noStoreHeaders(),
      });
    }

    const clientIp = getClientIp(request.headers);
    const now = Date.now();
    const lastSubmission = SUBSCRIBED_IPS.get(clientIp) || 0;

    if (now - lastSubmission < SUBSCRIPTION_COOLDOWN_MS) {
      return apiError("Ya te has suscrito recientemente.", {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        headers: noStoreHeaders(),
      });
    }

    SUBSCRIBED_IPS.set(clientIp, now);

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
    return apiError("Error al suscribirse.", {
      status: 500,
      code: "SUBSCRIPTION_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
