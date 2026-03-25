import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

interface GuardOptions {
  maxBodySize?: number;
  rateLimit?: { key: string; limit: number; windowMs: number };
  requireSameOrigin?: boolean;
}

interface GuardResult {
  body: unknown;
  clientIp: string;
}

export async function guardPostRequest(
  request: NextRequest,
  options: GuardOptions = {},
): Promise<GuardResult | ReturnType<typeof apiError>> {
  const clientIp = getClientIp(request.headers);

  if (options.requireSameOrigin !== false && !validateSameOrigin(request)) {
    return apiError("Origen no autorizado.", { status: 403, code: "FORBIDDEN_ORIGIN" });
  }

  if (options.maxBodySize) {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > options.maxBodySize) {
      return apiError("Payload demasiado grande.", { status: 413, code: "PAYLOAD_TOO_LARGE" });
    }
  }

  if (options.rateLimit) {
    const rateLimit = await checkRateLimitDb(options.rateLimit);
    if (!rateLimit.allowed) {
      return apiError("Demasiadas solicitudes.", {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }
  }

  try {
    const body = await request.json();
    return { body, clientIp };
  } catch {
    return apiError("JSON inválido.", { status: 400, code: "INVALID_JSON" });
  }
}
