import { NextRequest, NextResponse } from "next/server";
import {
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
  maxAge: number
): void {
  response.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/panel-privado",
    maxAge,
  });
}

function noStoreJson(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
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
    return noStoreJson(
      { error: "Demasiados intentos. Espera un momento e intenta nuevamente." },
      429
    );
  }

  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return noStoreJson({ error: "Solicitud no autorizada." }, 403);
  }

  if (!isCatalogAdminPathTokenConfigured()) {
    return noStoreJson(
      { error: "Configura CATALOG_ADMIN_PATH_TOKEN para habilitar el panel." },
      500
    );
  }

  let body: { token?: unknown };
  try {
    body = (await request.json()) as { token?: unknown };
  } catch {
    return noStoreJson({ error: "Solicitud invalida." }, 400);
  }

  const token = String(body.token || "").trim();
  if (!isCatalogAdminPathTokenValid(token)) {
    return noStoreJson({ error: "Clave privada invalida." }, 401);
  }

  const response = noStoreJson({ ok: true });
  applyCookie(response, token, COOKIE_MAX_AGE);
  return response;
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !validateSameOrigin(request)) {
    return noStoreJson({ error: "Solicitud no autorizada." }, 403);
  }

  const response = noStoreJson({ ok: true });
  applyCookie(response, "", 0);
  return response;
}
