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
