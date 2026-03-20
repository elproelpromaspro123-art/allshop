export function sanitizeText(input: string, maxLength = 255): string {
  return String(input || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(input: string): string {
  return sanitizeText(input, 320).toLowerCase();
}

export function sanitizePhone(input: string): string {
  const cleaned = sanitizeText(input, 20);
  const hasPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}
