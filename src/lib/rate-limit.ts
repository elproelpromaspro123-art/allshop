/**
 * Granular rate limiting by endpoint type.
 * Uses in-memory storage (suitable for serverless/Vercel).
 */

import { getClientIp } from "./utils";

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
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

/**
 * Check if request is within rate limit (in-memory version)
 */
export function checkRateLimit(
  ip: string,
  endpoint: string,
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
  const now = Date.now();
  const key = `${endpoint}:${ip}`;

  const record = requestCounts.get(key);

  // Reset if expired or no record
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { allowed: true, remaining: limit.requests - 1 };
  }

  // Check if over limit
  if (record.count >= limit.requests) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: limit.requests - record.count };
}

/**
 * Check rate limit using Supabase (database-backed version)
 * Legacy compatibility function - uses in-memory storage
 */
export async function checkRateLimitDb(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}> {
  const { key, limit, windowMs } = input;
  const now = Date.now();

  const record = requestCounts.get(key);

  // Reset if expired or no record
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  // Check if over limit
  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: limit - record.count };
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
if (typeof global !== "undefined" && typeof process !== "undefined") {
  if (
    process.env.NODE_ENV === "production" &&
    typeof setInterval !== "undefined"
  ) {
    setInterval(cleanupRateLimitStorage, 5 * 60 * 1000);
  }
}
