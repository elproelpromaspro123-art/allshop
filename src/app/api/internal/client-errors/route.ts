import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { getClientIp } from "@/lib/utils";
import {
  extractFbclid,
  isHydrationErrorCandidate,
  type ClientErrorSource,
} from "@/lib/client-error-monitor";
import { sendClientRuntimeErrorToDiscord } from "@/lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 4 * 1024;

interface ClientErrorBody {
  source?: string;
  message?: string;
  stack?: string | null;
  pathname?: string | null;
  href?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  fbclid?: string | null;
  filename?: string | null;
  line?: number | string | null;
  column?: number | string | null;
}

function sanitizeMultiline(value: string | null | undefined, max = 1800): string {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function toOptionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toClientErrorSource(value: string | undefined): ClientErrorSource {
  return value === "unhandled_rejection" ? "unhandled_rejection" : "window_error";
}

function clientErrorResponse(
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

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    return clientErrorResponse("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const rateLimit = await checkRateLimitDb({
    key: `client-error:${clientIp}`,
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return clientErrorResponse("Demasiados reportes de errores.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return clientErrorResponse("Solicitud no autorizada.", {
      status: 403,
      code: "SAME_ORIGIN_REQUIRED",
    });
  }

  let body: ClientErrorBody;
  try {
    body = (await request.json()) as ClientErrorBody;
  } catch {
    return clientErrorResponse("Solicitud invalida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const source = toClientErrorSource(body.source);
  const message = sanitizeText(body.message || "", 500);
  const stack = sanitizeMultiline(body.stack, 1800) || null;

  if (!message) {
    return clientErrorResponse("Mensaje invalido.", {
      status: 400,
      code: "INVALID_MESSAGE",
    });
  }

  if (!isHydrationErrorCandidate(message, stack)) {
    return apiOkFields(
      { data: { ignored: true } },
      {
        status: 202,
        headers: noStoreHeaders(),
      },
    );
  }

  const pathname = sanitizeText(body.pathname || "", 240) || "/";
  const href = sanitizeText(body.href || "", 320) || null;
  const referrer = sanitizeText(body.referrer || "", 320) || null;
  const userAgent =
    sanitizeText(
      body.userAgent || request.headers.get("user-agent") || "",
      320,
    ) || null;
  const fbclid =
    sanitizeText(body.fbclid || extractFbclid(href) || "", 240) || null;
  const filename = sanitizeText(body.filename || "", 240) || null;
  const line = toOptionalNumber(body.line);
  const column = toOptionalNumber(body.column);

  const payload = {
    source,
    message,
    stack,
    pathname,
    href,
    referrer,
    userAgent,
    fbclid,
    filename,
    line,
    column,
    clientIp,
  };

  console.error("[ClientErrorTelemetry] Hydration candidate", payload);

  await sendClientRuntimeErrorToDiscord(payload);

  return apiOkFields({}, { headers: noStoreHeaders() });
}
