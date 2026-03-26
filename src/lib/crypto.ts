/**
 * Cryptographic utilities for the application
 * Used for generating tokens, hashing, and secure random values
 */

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length = 32): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

/**
 * Generate a short alphanumeric ID
 */
export function generateId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
  }
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `ses_${generateId(24)}`;
}

/**
 * Generate a checkout idempotency key
 */
export function generateIdempotencyKey(): string {
  return `idk_${generateId(32)}`;
}

/**
 * Hash a string (simple, not cryptographic - for non-sensitive use)
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Generate a time-based sort key for DynamoDB-style ordering
 */
export function generateTimeSortKey(): string {
  const now = Date.now();
  const reversed = (Number.MAX_SAFE_INTEGER - now).toString(36);
  return reversed;
}

/**
 * Check if two tokens match (timing-safe comparison)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
