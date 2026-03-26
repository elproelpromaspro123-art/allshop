import { NextRequest } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import { evaluateCoupon, normalizeCouponCode, type CouponContextItem } from "@/lib/coupons";
import { validateCsrfToken, validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { hasExceededBodySize } from "@/lib/contact/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = 8 * 1024;

interface CouponValidationBody {
  code?: string;
  subtotal?: number;
  shippingCost?: number;
  items?: Array<{
    id?: string;
    slug?: string | null;
    quantity?: number;
  }>;
}

function couponError(
  error: string,
  options: {
    status: number;
    code: string;
    retryAfterSeconds?: number | null;
    fields?: Record<string, unknown>;
  },
) {
  return apiError(error, {
    status: options.status,
    code: options.code,
    retryAfterSeconds: options.retryAfterSeconds,
    fields: options.fields,
    headers: noStoreHeaders(
      options.retryAfterSeconds
        ? { "Retry-After": String(options.retryAfterSeconds) }
        : undefined,
    ),
  });
}

function normalizeCouponItems(
  items: CouponValidationBody["items"],
): CouponContextItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const id = String(item?.id || "").trim();
      const quantity = Math.max(0, Math.floor(Number(item?.quantity) || 0));

      return {
        id,
        slug: item?.slug ? String(item.slug).trim() : null,
        quantity,
      };
    })
    .filter((item) => item.id && item.quantity > 0);
}

function normalizeAmount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return couponError("Solicitud no autorizada.", {
      status: 403,
      code: "FORBIDDEN_ORIGIN",
    });
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return couponError("Token de seguridad invalido. Recarga la pagina.", {
      status: 403,
      code: "INVALID_CSRF_TOKEN",
    });
  }

  if (hasExceededBodySize(request.headers, maxBodySize)) {
    return couponError("Solicitud demasiado grande.", {
      status: 413,
      code: "REQUEST_TOO_LARGE",
    });
  }

  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `coupon:${clientIp}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return couponError("Demasiados intentos de validacion. Intenta mas tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  let body: CouponValidationBody;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid body");
    }
    body = parsed as CouponValidationBody;
  } catch {
    return couponError("Solicitud invalida.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }

  const items = normalizeCouponItems(body.items);
  if (!items.length) {
    return couponError("No hay productos validos para evaluar el codigo.", {
      status: 400,
      code: "INVALID_COUPON_ITEMS",
    });
  }

  const application = evaluateCoupon({
    code: normalizeCouponCode(body.code),
    subtotal: normalizeAmount(body.subtotal),
    shippingCost: normalizeAmount(body.shippingCost),
    items,
  });

  if (!application.ok) {
    return couponError(application.message, {
      status: 400,
      code: application.errorCode,
      fields: { application },
    });
  }

  return apiOkFields(
    { application },
    {
      headers: noStoreHeaders(),
    },
  );
}
