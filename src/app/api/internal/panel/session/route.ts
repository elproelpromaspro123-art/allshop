import { NextRequest, NextResponse } from "next/server";
import { apiError, apiOkFields, noStoreHeaders } from "@/lib/api-response";
import {
  createCatalogAdminSessionToken,
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
} from "@/lib/catalog-admin-auth";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

const COOKIE_NAME = "catalog_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8;

function applyCookie(
  response: NextResponse,
  value: string,
  maxAge: number,
): void {
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `panel-session:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return apiError(
      "Demasiados intentos. Espera un momento e intenta nuevamente.",
      {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        headers: noStoreHeaders(),
      },
    );
  }

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return apiError("Solicitud no autorizada.", {
      status: 403,
      code: "SAME_ORIGIN_REQUIRED",
      headers: noStoreHeaders(),
    });
  }

  if (!isCatalogAdminPathTokenConfigured()) {
    return apiError(
      "Configura CATALOG_ADMIN_PATH_TOKEN para habilitar el panel.",
      {
        status: 500,
        code: "ADMIN_PANEL_CONFIG_MISSING",
        headers: noStoreHeaders(),
      },
    );
  }

  let body: { token?: unknown };
  try {
    body = (await request.json()) as { token?: unknown };
  } catch {
    return apiError("Solicitud invalida.", {
      status: 400,
      code: "INVALID_JSON",
      headers: noStoreHeaders(),
    });
  }

  const token = String(body.token || "").trim();
  if (!isCatalogAdminPathTokenValid(token)) {
    return apiError("Clave privada invalida.", {
      status: 401,
      code: "INVALID_PANEL_TOKEN",
      headers: noStoreHeaders(),
    });
  }

  const sessionToken = createCatalogAdminSessionToken(token);

  const response = apiOkFields({}, { headers: noStoreHeaders() });
  applyCookie(response, sessionToken, COOKIE_MAX_AGE);
  return response;
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return apiError("Solicitud no autorizada.", {
      status: 403,
      code: "SAME_ORIGIN_REQUIRED",
      headers: noStoreHeaders(),
    });
  }

  const response = apiOkFields({}, { headers: noStoreHeaders() });
  applyCookie(response, "", 0);
  return response;
}
