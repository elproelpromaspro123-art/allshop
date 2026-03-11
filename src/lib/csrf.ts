/**
 * CSRF token generation and validation.
 * Server-only - uses Node.js crypto module for HMAC signing.
 * Only import this in API routes / server components.
 *
 * Falls back to ORDER_LOOKUP_SECRET if CSRF_SECRET is not set.
 */
import { createHmac, randomBytes } from "crypto";

const CSRF_TOKEN_VALIDITY_MS = 2 * 60 * 60 * 1000; // 2 hours
const DEV_FALLBACK_CSRF_SECRET = randomBytes(32).toString("hex");

export function isCsrfSecretConfigured(): boolean {
  return Boolean(String(process.env.CSRF_SECRET || "").trim());
}

function getCsrfSecret(): string {
  const explicitSecret = String(process.env.CSRF_SECRET || "").trim();
  if (explicitSecret) return explicitSecret;

  // Fallback to ORDER_LOOKUP_SECRET
  const orderSecret = String(process.env.ORDER_LOOKUP_SECRET || "").trim();
  if (orderSecret) return orderSecret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing CSRF secret. Set CSRF_SECRET or ORDER_LOOKUP_SECRET in production."
    );
  }

  return DEV_FALLBACK_CSRF_SECRET;
}

/**
 * Generate a CSRF token.
 * Format: <timestamp>.<random>.<signature>
 */
export function generateCsrfToken(): string {
  const csrfSecret = getCsrfSecret();
  const timestamp = Date.now().toString(36);
  const random = randomBytes(16).toString("hex");
  const payload = `${timestamp}.${random}`;
  const signature = createHmac("sha256", csrfSecret)
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  return `${payload}.${signature}`;
}

/**
 * Validate a CSRF token.
 * Returns true if the token is valid and not expired.
 */
export function validateCsrfToken(token: string | null | undefined): boolean {
  const csrfSecret = getCsrfSecret();
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, random, providedSignature] = parts;
  if (!timestamp || !random || !providedSignature) return false;

  const payload = `${timestamp}.${random}`;
  const expectedSignature = createHmac("sha256", csrfSecret)
    .update(payload)
    .digest("hex")
    .slice(0, 32);

  if (providedSignature !== expectedSignature) return false;

  const tokenTime = parseInt(timestamp, 36);
  if (!Number.isFinite(tokenTime)) return false;

  const age = Date.now() - tokenTime;
  if (age < 0 || age > CSRF_TOKEN_VALIDITY_MS) return false;

  return true;
}

/**
 * Validate same-origin for POST requests.
 * Checks Origin and Referer headers against the expected host.
 * Returns true if the request appears to come from the same origin.
 */
export function validateSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  // Fallback to Referer if Origin is not present
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // No Origin or Referer — block in production
  return process.env.NODE_ENV !== "production";
}
