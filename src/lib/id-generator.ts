/**
 * ID generation and validation
 */

export function generateNumericId(length = 10) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export function generateAlphabeticId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function isNumericId(id: string) {
  return /^\d+$/.test(id);
}

export function parseId(idString: string) {
  const numberPart = idString.replace(/\D/g, "");
  return numberPart ? parseInt(numberPart, 10) : null;
}