/**
 * CSRF token generation and validation.
 * Server-only — uses Node.js crypto module for HMAC signing.
 * Only import this in API routes / server components.
 */
import { randomBytes, createHmac } from "crypto";

const CSRF_SECRET =
    process.env.CSRF_SECRET || process.env.ORDER_LOOKUP_SECRET || "vortixy-csrf-fallback-key";
const CSRF_TOKEN_VALIDITY_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Generate a CSRF token.
 * Format: <timestamp>.<random>.<signature>
 */
export function generateCsrfToken(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(16).toString("hex");
    const payload = `${timestamp}.${random}`;
    const signature = createHmac("sha256", CSRF_SECRET)
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
    if (!token || typeof token !== "string") return false;

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [timestamp, random, providedSignature] = parts;
    if (!timestamp || !random || !providedSignature) return false;

    // Verify signature
    const payload = `${timestamp}.${random}`;
    const expectedSignature = createHmac("sha256", CSRF_SECRET)
        .update(payload)
        .digest("hex")
        .slice(0, 32);

    if (providedSignature !== expectedSignature) return false;

    // Check expiry
    const tokenTime = parseInt(timestamp, 36);
    if (!Number.isFinite(tokenTime)) return false;

    const age = Date.now() - tokenTime;
    if (age < 0 || age > CSRF_TOKEN_VALIDITY_MS) return false;

    return true;
}
