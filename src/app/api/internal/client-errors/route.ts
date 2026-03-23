import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  if (
    request.headers.get("content-length") &&
    Number(request.headers.get("content-length")) > maxBodySize
  ) {
    return NextResponse.json(
      { ok: false, error: "Solicitud demasiado grande." },
      { status: 413 },
    );
  }

  const rateLimit = await checkRateLimitDb({
    key: `client-error:${clientIp}`,
    limit: 6,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Demasiados reportes de errores.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: ClientErrorBody;
  try {
    body = (await request.json()) as ClientErrorBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud invalida." },
      { status: 400 },
    );
  }

  const source = toClientErrorSource(body.source);
  const message = sanitizeText(body.message || "", 500);
  const stack = sanitizeMultiline(body.stack, 1800) || null;

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Mensaje invalido." },
      { status: 400 },
    );
  }

  if (!isHydrationErrorCandidate(message, stack)) {
    return NextResponse.json(
      { ok: true, data: { ignored: true } },
      { status: 202 },
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

  return NextResponse.json({ ok: true });
}
