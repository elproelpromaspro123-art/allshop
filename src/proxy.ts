import { NextRequest, NextResponse } from "next/server";
import { isIpBlockedAsync, loadBlockedIpsFromDb } from "@/lib/ip-block";
import { getClientIp } from "@/lib/utils";

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

    // Check if IP is blocked (uses DB for serverless reliability)
    if (await isIpBlockedAsync(ip)) {
        // Return JSON for API routes instead of rewriting to HTML page (fix 1.13)
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Tu acceso ha sido restringido." },
                { status: 403 }
            );
        }
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
        "connect-src 'self' https://api.resend.com https://*.supabase.co https://vitals.vercel-insights.com https://*.vercel-insights.com https://www.facebook.com https://connect.facebook.net",
        "frame-src 'self' https://www.facebook.com https://connect.facebook.net",
        "form-action 'self' https://www.facebook.com https://connect.facebook.net",
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
