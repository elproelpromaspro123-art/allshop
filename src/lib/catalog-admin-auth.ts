import { createHmac, timingSafeEqual } from "crypto";

function safeCompare(secret: string, provided: string): boolean {
  const normalizedSecret = String(secret || "").trim();
  const normalizedProvided = String(provided || "").trim();
  if (!normalizedSecret || !normalizedProvided) return false;

  // Hash both values to prevent timing attacks on length comparison
  const hmac = createHmac("sha256", "safe-compare-salt");
  const a = hmac.update(normalizedSecret, "utf8").digest();
  const b = createHmac("sha256", "safe-compare-salt")
    .update(normalizedProvided, "utf8")
    .digest();

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readCatalogAdminCode(): string {
  return String(process.env.CATALOG_ADMIN_ACCESS_CODE || "").trim();
}

function readCatalogAdminPathToken(): string {
  return String(process.env.CATALOG_ADMIN_PATH_TOKEN || "").trim();
}

function readSessionSigningSecret(): string {
  return String(process.env.CSRF_SECRET || "fallback").trim() || "fallback";
}

/**
 * Admin action secret for block-ip and order cancel endpoints.
 * Uses ADMIN_BLOCK_SECRET if set, otherwise falls back to ORDER_LOOKUP_SECRET.
 */
function readAdminActionSecret(): string {
  const explicit = String(process.env.ADMIN_BLOCK_SECRET || "").trim();
  if (explicit) return explicit;
  return String(process.env.ORDER_LOOKUP_SECRET || "").trim();
}

export function isCatalogAdminCodeConfigured(): boolean {
  return readCatalogAdminCode().length >= 24;
}

export function isCatalogAdminPathTokenConfigured(): boolean {
  return readCatalogAdminPathToken().length >= 12;
}

export function isCatalogAdminCodeValid(value: string): boolean {
  return safeCompare(readCatalogAdminCode(), value);
}

export function isCatalogAdminPathTokenValid(value: string): boolean {
  return safeCompare(readCatalogAdminPathToken(), value);
}

export function createCatalogAdminSessionToken(value: string): string {
  const token = String(value || "").trim();
  if (!token) return "";

  return createHmac("sha256", readSessionSigningSecret())
    .update(token)
    .digest("hex");
}

export function isCatalogAdminSessionValid(value: string): boolean {
  const expectedSessionToken = createCatalogAdminSessionToken(
    readCatalogAdminPathToken(),
  );

  return safeCompare(expectedSessionToken, value);
}

export function isCatalogAdminAuthorized(options: {
  bearerToken?: string | null;
  sessionToken?: string | null;
}): boolean {
  const bearerToken = String(options.bearerToken || "").trim();
  const sessionToken = String(options.sessionToken || "").trim();

  return (
    isCatalogAdminCodeValid(bearerToken) ||
    isCatalogAdminSessionValid(sessionToken)
  );
}

export function isAdminActionSecretConfigured(): boolean {
  return readAdminActionSecret().length >= 24;
}

export function isAdminActionSecretValid(value: string): boolean {
  return safeCompare(readAdminActionSecret(), value);
}

export function parseBearerToken(
  headerValue: string | null | undefined,
): string {
  const value = String(headerValue || "").trim();
  if (!value) return "";

  const match = /^Bearer\s+(.+)$/i.exec(value);
  if (!match?.[1]) return "";
  return match[1].trim();
}
