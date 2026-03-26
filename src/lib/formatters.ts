/**
 * String manipulation utilities
 */

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(text: string): string {
  return text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(text: string): string {
  return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Remove all extra whitespace and normalize to single spaces
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Generate a short ID from a string (for URLs, etc.)
 */
export function generateShortId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 32);
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return "*".repeat(data.length);
  const masked = "*".repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
}

/**
 * Check if a string contains only letters (with accented characters)
 */
export function isAlphabetic(text: string): boolean {
  return /^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(text);
}

/**
 * Check if a string contains only numbers
 */
export function isNumeric(text: string): boolean {
  return /^\d+$/.test(text);
}

/**
 * Format phone number to standard Colombian format
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith("57")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

/**
 * Format document number (CEDULA/NIT)
 */
export function formatDocumentNumber(doc: string): string {
  const digits = doc.replace(/\D/g, "");
  if (digits.length >= 9) {
    return `${digits.slice(0, digits.length - 6)}.${digits.slice(digits.length - 6, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
  }
  return doc;
}