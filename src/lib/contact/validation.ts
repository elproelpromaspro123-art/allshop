import { sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactText(value: string, maxLength: number): string {
  return sanitizeText(value, maxLength);
}

export function normalizeContactEmail(value: string): string {
  return sanitizeEmail(value);
}

export function normalizeContactPhone(value: string): string {
  return sanitizePhone(value);
}

export function isValidContactEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 120;
}

export function isAllowedContactValue<T extends string>(
  value: string,
  allowedValues: readonly T[],
): value is T {
  return allowedValues.includes(value as T);
}

export function hasExceededBodySize(
  headers: Headers,
  maxBodySize: number,
): boolean {
  const contentLength = headers.get("content-length");
  return Boolean(contentLength && Number(contentLength) > maxBodySize);
}
