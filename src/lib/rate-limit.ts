/**
 * Rate limiting for Vortixy API routes.
 *
 * IMPORTANT — Serverless limitation:
 * This uses an in-memory Map which works per-instance. In serverless (Vercel),
 * each function instance has its own Map, so rate limits are approximate.
 * For critical paths (checkout), we also check Supabase for a DB-backed limit.
 * For non-critical paths (feedback, order-lookup), in-memory is acceptable
 * as a best-effort defense.
 */
import { supabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, RateLimitBucket>();

function cleanupExpiredBuckets(now: number) {
  for (const [bucketKey, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(bucketKey);
    }
  }
}

/** @deprecated Use getClientIp from @/lib/utils instead */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

/**
 * In-memory rate limiter (best-effort in serverless).
 */
export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  // Lightweight cleanup on regular traffic.
  if (buckets.size > 500 || Math.random() < 0.01) {
    cleanupExpiredBuckets(now);
  }

  const currentBucket = buckets.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (currentBucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((currentBucket.resetAt - now) / 1000)
      ),
    };
  }

  currentBucket.count += 1;
  buckets.set(key, currentBucket);

  return {
    allowed: true,
    remaining: Math.max(0, limit - currentBucket.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((currentBucket.resetAt - now) / 1000)
    ),
  };
}

/**
 * DB-backed rate limiter using Supabase for critical paths (checkout).
 * Falls back to in-memory if Supabase is not configured or the table doesn't exist.
 *
 * Requires a `rate_limits` table:
 *   CREATE TABLE IF NOT EXISTS rate_limits (
 *     key TEXT PRIMARY KEY,
 *     count INTEGER DEFAULT 1,
 *     reset_at TIMESTAMPTZ NOT NULL
 *   );
 */
export async function checkRateLimitDb({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  // Always check in-memory first as a fast-path
  const memoryResult = checkRateLimit({ key, limit, windowMs });
  if (!memoryResult.allowed) return memoryResult;

  // If Supabase is not configured, rely on in-memory only
  if (!isSupabaseAdminConfigured) return memoryResult;

  try {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    // Try to get existing bucket
    const { data: existing } = await supabaseAdmin
      .from("rate_limits")
      .select("count,reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing || new Date(existing.reset_at) <= now) {
      // Expired or doesn't exist — create/reset
      await supabaseAdmin
        .from("rate_limits")
        .upsert({ key, count: 1, reset_at: resetAt.toISOString() }, { onConflict: "key" });

      return {
        allowed: true,
        remaining: Math.max(0, limit - 1),
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    if (existing.count >= limit) {
      const retryMs = new Date(existing.reset_at).getTime() - now.getTime();
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
      };
    }

    // Increment
    await supabaseAdmin
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("key", key);

    return {
      allowed: true,
      remaining: Math.max(0, limit - (existing.count + 1)),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((new Date(existing.reset_at).getTime() - now.getTime()) / 1000)
      ),
    };
  } catch {
    // If DB rate limiting fails (e.g., table doesn't exist), fall back to memory
    return memoryResult;
  }
}
