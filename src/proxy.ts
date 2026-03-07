import { NextRequest, NextResponse } from "next/server";
import { isIpBlocked, loadBlockedIpsFromDb } from "@/lib/ip-block";

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

    return NextResponse.next();
}

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
