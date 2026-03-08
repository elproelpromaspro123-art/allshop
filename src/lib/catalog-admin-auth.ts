import { timingSafeEqual } from "crypto";

function safeCompare(secret: string, provided: string): boolean {
  const normalizedSecret = String(secret || "").trim();
  const normalizedProvided = String(provided || "").trim();
  if (!normalizedSecret || !normalizedProvided) return false;

  const a = Buffer.from(normalizedSecret, "utf8");
  const b = Buffer.from(normalizedProvided, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

function readCatalogAdminCode(): string {
  return String(process.env.CATALOG_ADMIN_ACCESS_CODE || "").trim();
}

function readCatalogAdminPathToken(): string {
  return String(process.env.CATALOG_ADMIN_PATH_TOKEN || "").trim();
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
