/**
 * UUID and ID generation utilities
 */

export function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateShortId(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function generateOrderId() {
  const prefix = "VRT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateShortId(6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function isValidShortId(id: string, length = 8) {
  return /^[a-z0-9]{8,}$/.test(id);
}