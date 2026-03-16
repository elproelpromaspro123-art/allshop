import { NextRequest, NextResponse } from "next/server";
import { isIpBlockedAsync, loadBlockedIpsFromDb } from "@/lib/ip-block";
import { getClientIp } from "@/lib/utils";

function readCatalogAdminPathToken(): string {
    return String(process.env.CATALOG_ADMIN_PATH_TOKEN || "").trim();
}

function isPanelTokenValid(token: string): boolean {
    const secret = readCatalogAdminPathToken();
    if (!secret || secret.length < 12) return false;
    return token === secret;
}

function maybeHandlePanelToken(
    request: NextRequest,
    pathname: string
): NextResponse | null {
    if (!pathname.startsWith("/panel-privado/")) return null;

    const token = pathname.split("/")[2] || "";
    if (!token) return null;

    if (!isPanelTokenValid(token)) {
        return null;
    }

    const response = NextResponse.redirect(
        new URL("/panel-privado", request.url)
    );
    response.cookies.set("catalog_admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/panel-privado",
        maxAge: 60 * 60 * 8,
    });

    return response;
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

    const panelRedirect = maybeHandlePanelToken(request, pathname);
    if (panelRedirect) {
        return panelRedirect;
    }

    // CSP compatible with Next.js — cannot use strict-dynamic/nonce because
    // Next.js injects many inline scripts for hydration that don't receive nonces.
    // Using 'unsafe-inline' for scripts is the standard approach for Next.js apps.
    const cspDirectives = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://va.vercel-scripts.com https://vitals.vercel-insights.com",
        "script-src-elem 'self' 'unsafe-inline' https://connect.facebook.net https://va.vercel-scripts.com https://vitals.vercel-insights.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://api.resend.com https://*.supabase.co https://*.supabase.in https://vitals.vercel-insights.com https://*.vercel-insights.com https://va.vercel-scripts.com https://www.facebook.com https://connect.facebook.net https://api.dropi.co https://demo-1.conversionsapigateway.com https://mpc2-prod-27-is5qnl632q-uk.a.run.app",
        "frame-src 'self' https://www.facebook.com https://connect.facebook.net",
        "form-action 'self' https://www.facebook.com https://connect.facebook.net",
    ];

    const csp = cspDirectives.join("; ");

    const response = NextResponse.next();

    // Only enforce CSP in production
    if (process.env.NODE_ENV === "production") {
        response.headers.set("Content-Security-Policy", csp);
    }

    // Additional security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

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
