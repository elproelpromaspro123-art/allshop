/**
 * Granular rate limiting by endpoint type.
 * Uses database-backed storage when Supabase admin is available.
 */

import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase-admin";
import { getClientIp } from "./utils";

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Critical endpoints - strict limits
  checkout: { requests: 5, windowMs: 60000 }, // 5 per minute
  "order-history": { requests: 5, windowMs: 60000 }, // 5 per minute

  // Standard API endpoints
  search: { requests: 20, windowMs: 60000 }, // 20 per minute
  feedback: { requests: 10, windowMs: 60000 }, // 10 per minute
  chat: { requests: 15, windowMs: 60000 }, // 15 per minute

  // Admin endpoints - higher limits
  admin: { requests: 100, windowMs: 60000 }, // 100 per minute
  "panel-session": { requests: 10, windowMs: 10 * 60000 }, // 10 per 10 minutes

  // General API fallback
  api: { requests: 30, windowMs: 60000 }, // 30 per minute
};

// In-memory storage for rate limit tracking
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
  };
}

/**
 * Check if request is within rate limit (in-memory version)
 */
export function checkRateLimit(ip: string, endpoint: string): RateLimitResult {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
  const key = `${endpoint}:${ip}`;
  return checkRateLimitInMemory(key, limit.requests, limit.windowMs);
}

/**
 * Check rate limit using Supabase (database-backed version)
 */
export async function checkRateLimitDb(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = input;
  if (!key || limit <= 0 || windowMs <= 0) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    };
  }

  if (!isSupabaseAdminConfigured) {
    return checkRateLimitInMemory(key, limit, windowMs);
  }

  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit_bucket", {
    p_key: key,
    p_limit: limit,
    p_window_ms: windowMs,
  });

  if (error) {
    // Silent fail for missing function - will use in-memory fallback
    // Function needs to be created in Supabase: supabase/functions/rate-limit.sql
    const isMissingFunction = error.message?.includes("Could not find the function") ||
                              error.message?.includes("consume_rate_limit_bucket");
    
    if (!isMissingFunction) {
      console.error("[RateLimit] DB error:", error.message);
    }
    
    return checkRateLimitInMemory(key, limit, windowMs);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result !== "object") {
    return checkRateLimitInMemory(key, limit, windowMs);
  }

  const allowed = Boolean((result as { allowed?: unknown }).allowed);
  const remaining = Math.max(
    0,
    Number((result as { remaining?: unknown }).remaining) || 0,
  );
  const retryAfterSecondsValue = Number(
    (result as { retry_after_seconds?: unknown }).retry_after_seconds,
  );

  return {
    allowed,
    remaining,
    retryAfterSeconds: Number.isFinite(retryAfterSecondsValue)
      ? Math.max(0, retryAfterSecondsValue)
      : undefined,
  };
}

/**
 * Set standard rate-limit headers on a response.
 */
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  endpoint: string,
) {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
  headers.set("X-RateLimit-Limit", String(limit.requests));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  if (!result.allowed && result.retryAfterSeconds) {
    headers.set("Retry-After", String(result.retryAfterSeconds));
  }
}

/**
 * Create a rate limit checker for a specific endpoint
 */
export function createRateLimitMiddleware(endpoint: string) {
  return (request: Request) => {
    const ip = getClientIp(request.headers);
    return checkRateLimit(ip, endpoint);
  };
}

/**
 * Clean up old entries (call periodically in long-running processes)
 */
export function cleanupRateLimitStorage() {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes in Node.js environments
// Store interval ID to prevent memory leaks
let cleanupIntervalId: NodeJS.Timeout | null = null;

if (typeof global !== "undefined" && typeof process !== "undefined") {
  if (
    process.env.NODE_ENV === "production" &&
    typeof setInterval !== "undefined" &&
    !cleanupIntervalId
  ) {
    cleanupIntervalId = setInterval(cleanupRateLimitStorage, 5 * 60 * 1000);
  }
}

// Cleanup function for graceful shutdown
export function cleanupRateLimitInterval() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}
