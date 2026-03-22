import { NextRequest, NextResponse } from "next/server";
import {
  isCatalogAdminAuthorized,
  isCatalogAdminCodeConfigured,
  isCatalogAdminPathTokenConfigured,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";
import { apiError, noStoreHeaders } from "@/lib/api-response";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";

interface AdminAccessOptions {
  headerName?: "authorization" | "x-catalog-admin-code";
  missingConfigMessage?: string;
  unauthorizedMessage?: string;
}

interface AdminRateLimitOptions {
  keyPrefix: string;
  limit?: number;
  windowMs?: number;
}

function readRequestAuthValue(
  request: NextRequest,
  headerName: AdminAccessOptions["headerName"] = "authorization",
): string {
  if (headerName === "authorization") {
    return parseBearerToken(request.headers.get("authorization"));
  }

  return String(request.headers.get(headerName || "authorization") || "").trim();
}

export function assertCatalogAdminAccess(
  request: NextRequest,
  options: AdminAccessOptions = {},
): NextResponse | null {
  if (!isCatalogAdminCodeConfigured() && !isCatalogAdminPathTokenConfigured()) {
    return apiError(
      options.missingConfigMessage ||
        "Configura CATALOG_ADMIN_ACCESS_CODE o CATALOG_ADMIN_PATH_TOKEN para habilitar el panel privado.",
      {
        status: 500,
        code: "ADMIN_CONFIG_MISSING",
        headers: noStoreHeaders(),
      },
    );
  }

  const sessionToken = request.cookies.get("catalog_admin_session")?.value;
  const bearerToken = readRequestAuthValue(request, options.headerName);

  if (!isCatalogAdminAuthorized({ bearerToken, sessionToken })) {
    return apiError(
      options.unauthorizedMessage || "Acceso administrativo no autorizado.",
      {
        status: 401,
        code: "ADMIN_UNAUTHORIZED",
        headers: noStoreHeaders(),
      },
    );
  }

  return null;
}

export async function enforceAdminRateLimit(
  request: NextRequest,
  options: AdminRateLimitOptions,
): Promise<NextResponse | null> {
  const clientIp = getClientIp(request.headers);
  const rateLimit = await checkRateLimitDb({
    key: `${options.keyPrefix}:${clientIp}`,
    limit: options.limit || 120,
    windowMs: options.windowMs || 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return apiError("Demasiadas solicitudes. Intenta de nuevo más tarde.", {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      headers: noStoreHeaders({
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    });
  }

  return null;
}
