import { NextRequest, NextResponse } from "next/server";
import { isIpBlocked, loadBlockedIpsFromDb } from "@/lib/ip-block";

function getClientIp(headers: Headers): string {
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0]?.trim();
        if (ip) return ip;
    }

    const realIp = headers.get("x-real-ip");
    if (realIp?.trim()) return realIp.trim();

    return "unknown";
}

function generateCspNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

export async function proxy(request: NextRequest) {
    // Load blocked IPs from DB on first request
    await loadBlockedIpsFromDb();

    const ip = getClientIp(request.headers);

    // Skip middleware for the blocked page itself, API admin routes, and static assets
    const pathname = request.nextUrl.pathname;
    if (
        pathname === "/bloqueado" ||
        pathname.startsWith("/api/admin/") ||
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next();
    }

    // Check if IP is blocked
    if (isIpBlocked(ip)) {
        const blockedUrl = new URL("/bloqueado", request.url);
        return NextResponse.rewrite(blockedUrl);
    }

    // Generate CSP nonce for HTML pages
    const nonce = generateCspNonce();

    const cspDirectives = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.resend.com https://*.supabase.co",
        "frame-src 'none'",
        "form-action 'self'",
    ];

    const csp = cspDirectives.join("; ");

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });

    // Only enforce CSP in production
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Content-Security-Policy", csp);
    }

    response.headers.set("x-nonce", nonce);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
    ],
};
