import { NextRequest, NextResponse } from "next/server";
import { isIpBlockedAsync, loadBlockedIpsFromDb } from "@/lib/ip-block";
import { validateCsrfToken as validateCsrfTokenHmac } from "@/lib/csrf";
import { getClientIp } from "@/lib/utils";

/**
 * CSRF Protection Validation
 * Returns null if CSRF is valid or should be skipped
 * Returns NextResponse if CSRF validation failed
 */
function validateCsrfToken(request: NextRequest): NextResponse | null {
  // Only validate on state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    return null;
  }

  // Skip CSRF validation for specific safe endpoints
  const unsafeEndpoints = [
    "/api/webhooks", // External webhooks (Supabase, payment providers)
    "/api/health",   // Health checks
    "/api/chat",     // AI chatbot (has its own rate limiting)
    "/api/internal/panel/session", // Panel session login (has its own validation)
    "/api/internal/live-visitors", // Same-origin heartbeat used by storefront UI
    "/api/internal/visitor-alert", // Same-origin visitor tracking with bot filtering
    "/api/internal/client-errors", // Same-origin hydration telemetry via sendBeacon/fetch
    "/api/newsletter/subscribe", // Public newsletter subscription (has own rate limiting)
  ];

  const pathname = request.nextUrl.pathname;
  const isUnsafe = unsafeEndpoints.some(
    (endpoint) => pathname === endpoint || pathname.startsWith(endpoint + "/")
  );

  if (isUnsafe) {
    return null;
  }

  // Validate CSRF token from header
  const csrfToken =
    request.headers.get("x-csrf-token") ||
    request.headers.get("x-csrf-header-token");

  if (!csrfToken) {
    return NextResponse.json(
      {
        error: "Missing CSRF token",
        code: "CSRF_MISSING",
        message: "Esta acción requiere validación de seguridad."
      },
      { status: 403 }
    );
  }

  // Validate token using HMAC verification
  if (!validateCsrfTokenHmac(csrfToken)) {
    return NextResponse.json(
      {
        error: "Invalid CSRF token",
        code: "CSRF_INVALID",
        message: "Token de seguridad inválido."
      },
      { status: 403 }
    );
  }

  return null; // CSRF validation passed
}

export async function proxy(request: NextRequest) {
  await loadBlockedIpsFromDb();

  const ip = getClientIp(request.headers);
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/bloqueado" ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (await isIpBlockedAsync(ip)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Tu acceso ha sido restringido." },
        { status: 403 },
      );
    }

    return NextResponse.rewrite(new URL("/bloqueado", request.url));
  }

  // Validate CSRF token for state-changing requests
  const csrfError = validateCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const cspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    "script-src-elem 'self' 'unsafe-inline' https://connect.facebook.net https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.resend.com https://*.supabase.co https://*.supabase.in https://vitals.vercel-insights.com https://*.vercel-insights.com https://va.vercel-scripts.com https://www.facebook.com https://connect.facebook.net https://api.dropi.co https://demo-1.conversionsapigateway.com https://mpc2-prod-27-is5qnl632q-uk.a.run.app",
    "frame-src 'self' https://www.facebook.com https://connect.facebook.net",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob: https:",
    "form-action 'self' https://www.facebook.com https://connect.facebook.net",
    "upgrade-insecure-requests",
  ];

  const response = NextResponse.next();

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Origin-Agent-Cluster", "?1");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
