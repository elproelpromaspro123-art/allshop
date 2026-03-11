/**
 * IP Blocking System for Vortixy
 * Supabase-backed with in-memory cache for fast lookups.
 *
 * In serverless (Vercel), the in-memory cache is per-instance.
 * Critical check: isIpBlocked always verifies against Supabase DB
 * to ensure blocked IPs are enforced across all instances.
 */

import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";

interface BlockEntry {
    ip: string;
    reason: string;
    blockedAt: number;
    expiresAt: number | null; // null = permanent
}

// In-memory cache for fast lookups (synced with Supabase)
const memoryBlocklist = new Map<string, BlockEntry>();

/**
 * Check if IP is blocked — always checks DB for reliability in serverless.
 */
export async function isIpBlockedAsync(ip: string): Promise<boolean> {
    // Quick memory check first
    const memEntry = memoryBlocklist.get(ip);
    if (memEntry) {
        if (memEntry.expiresAt !== null && Date.now() > memEntry.expiresAt) {
            memoryBlocklist.delete(ip);
        } else {
            return true;
        }
    }

    // Always verify against DB for serverless reliability
    if (!isSupabaseAdminConfigured) return false;

    try {
        const { data } = await supabaseAdmin
            .from("blocked_ips")
            .select("ip,expires_at")
            .eq("ip", ip)
            .maybeSingle();

        if (!data) return false;

        const expiresAt = data.expires_at
            ? new Date(data.expires_at as string).getTime()
            : null;

        if (expiresAt !== null && Date.now() > expiresAt) {
            // Expired — clean up
            void supabaseAdmin.from("blocked_ips").delete().eq("ip", ip);
            return false;
        }

        // Update memory cache
        memoryBlocklist.set(ip, {
            ip,
            reason: "Bloqueado",
            blockedAt: Date.now(),
            expiresAt,
        });

        return true;
    } catch (error) {
        console.error("[IPBlock] DB check error:", error);
        // Fall back to memory result
        return false;
    }
}

/**
 * Synchronous check — uses memory cache only.
 * For use in proxy.ts where async DB call is acceptable via isIpBlockedAsync.
 */
export function isIpBlocked(ip: string): boolean {
    const entry = memoryBlocklist.get(ip);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        memoryBlocklist.delete(ip);
        return false;
    }

    return true;
}

export function getBlockEntry(ip: string): BlockEntry | null {
    const entry = memoryBlocklist.get(ip);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        memoryBlocklist.delete(ip);
        return null;
    }

    return entry;
}

export function blockIp(
    ip: string,
    duration: "permanent" | "24h" | "1h",
    reason: string = "Bloqueado por administrador"
): void {
    const now = Date.now();
    let expiresAt: number | null = null;

    switch (duration) {
        case "1h":
            expiresAt = now + 60 * 60 * 1000;
            break;
        case "24h":
            expiresAt = now + 24 * 60 * 60 * 1000;
            break;
        case "permanent":
            expiresAt = null;
            break;
    }

    memoryBlocklist.set(ip, {
        ip,
        reason,
        blockedAt: now,
        expiresAt,
    });

    // Persist to Supabase in background
    void persistBlockToSupabase(ip, duration, reason, expiresAt);
}

export function unblockIp(ip: string): void {
    memoryBlocklist.delete(ip);
    void removeBlockFromSupabase(ip);
}

async function persistBlockToSupabase(
    ip: string,
    duration: string,
    reason: string,
    expiresAt: number | null
): Promise<void> {
    if (!isSupabaseAdminConfigured) return;

    try {
        await supabaseAdmin.from("blocked_ips").upsert(
            {
                ip,
                duration,
                reason,
                blocked_at: new Date().toISOString(),
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            },
            { onConflict: "ip" }
        );
    } catch (error) {
        console.error("[IPBlock] Supabase persist error:", error);
    }
}

async function removeBlockFromSupabase(ip: string): Promise<void> {
    if (!isSupabaseAdminConfigured) return;

    try {
        await supabaseAdmin.from("blocked_ips").delete().eq("ip", ip);
    } catch (error) {
        console.error("[IPBlock] Supabase remove error:", error);
    }
}

/**
 * Load blocked IPs from Supabase into memory on startup/first call
 */
let hasLoadedFromDb = false;

export async function loadBlockedIpsFromDb(): Promise<void> {
    if (hasLoadedFromDb || !isSupabaseAdminConfigured) return;

    try {
        const { data } = await supabaseAdmin
            .from("blocked_ips")
            .select("ip,reason,blocked_at,expires_at");

        if (data) {
            const now = Date.now();
            for (const row of data) {
                const expiresAt = row.expires_at
                    ? new Date(row.expires_at as string).getTime()
                    : null;

                // Skip expired entries
                if (expiresAt !== null && now > expiresAt) continue;

                memoryBlocklist.set(row.ip as string, {
                    ip: row.ip as string,
                    reason: (row.reason as string) || "Bloqueado",
                    blockedAt: new Date(row.blocked_at as string).getTime(),
                    expiresAt,
                });
            }
        }

        hasLoadedFromDb = true;
    } catch (error) {
        console.error("[IPBlock] Failed to load blocked IPs from DB:", error);
    }
}
