/**
 * VPN/Proxy Detection for Vortixy
 * Uses free heuristics + optional API check
 */

interface VpnCheckResult {
    isVpn: boolean;
    reason: string | null;
}

/**
 * Heuristic check using request headers
 * Most VPNs/proxies add certain headers or lack typical browser headers
 */
export function checkVpnHeuristics(headers: Headers): VpnCheckResult {
    // Check for common proxy headers
    const viaHeader = headers.get("via");
    if (viaHeader) {
        return { isVpn: true, reason: "Proxy detectado (header Via)" };
    }

    // Check for Tor exit nodes
    const forwardedFor = headers.get("x-forwarded-for") || "";
    const forwardedIps = forwardedFor.split(",").filter((ip) => ip.trim());
    if (forwardedIps.length > 3) {
        return { isVpn: true, reason: "Múltiples proxies detectados (cadena x-forwarded-for larga)" };
    }

    return { isVpn: false, reason: null };
}

/**
 * Check IP against a free VPN detection API
 * Uses ipapi.co (free tier: 1000 requests/day)
 */
export async function checkVpnByApi(ip: string): Promise<VpnCheckResult> {
    // Skip for localhost/unknown
    if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
        return { isVpn: false, reason: null };
    }

    try {
        const response = await fetch(
            `https://vpnapi.io/api/${encodeURIComponent(ip)}?key=${process.env.VPNAPI_KEY || ""}`,
            { signal: AbortSignal.timeout(3000) }
        );

        if (!response.ok) {
            // If API fails, allow the request (fail open)
            return { isVpn: false, reason: null };
        }

        const data = (await response.json()) as {
            security?: {
                vpn?: boolean;
                proxy?: boolean;
                tor?: boolean;
                relay?: boolean;
            };
        };

        const security = data.security;
        if (!security) return { isVpn: false, reason: null };

        if (security.vpn) {
            return { isVpn: true, reason: "VPN detectada por verificación de red" };
        }
        if (security.proxy) {
            return { isVpn: true, reason: "Proxy detectado por verificación de red" };
        }
        if (security.tor) {
            return { isVpn: true, reason: "Red Tor detectada" };
        }
        if (security.relay) {
            return { isVpn: true, reason: "Relay de privacidad detectado" };
        }

        return { isVpn: false, reason: null };
    } catch {
        // Fail open: if API times out or errors, allow the request
        return { isVpn: false, reason: null };
    }
}

/**
 * Combined VPN check: heuristics first, then API
 */
export async function isVpnOrProxy(ip: string, headers: Headers): Promise<VpnCheckResult> {
    // Quick heuristic check first (zero latency)
    const heuristic = checkVpnHeuristics(headers);
    if (heuristic.isVpn) return heuristic;

    // Only call API if VPNAPI_KEY is configured
    if (process.env.VPNAPI_KEY) {
        return checkVpnByApi(ip);
    }

    return { isVpn: false, reason: null };
}
