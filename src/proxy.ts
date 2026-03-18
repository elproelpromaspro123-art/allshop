import { NextRequest, NextResponse } from "next/server";
import { isIpBlockedAsync, loadBlockedIpsFromDb } from "@/lib/ip-block";
import { getClientIp } from "@/lib/utils";

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
                { status: 403 }
            );
        }

        return NextResponse.rewrite(new URL("/bloqueado", request.url));
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
        response.headers.set(
            "Content-Security-Policy",
            cspDirectives.join("; ")
        );
    }

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
    ],
};
