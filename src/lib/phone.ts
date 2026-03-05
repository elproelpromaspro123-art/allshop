export function normalizePhone(value: string): string | null {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.length === 12 && digits.startsWith("57")) {
    return digits;
  }

  if (digits.length === 10 && digits.startsWith("3")) {
    return `57${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("03")) {
    return `57${digits.slice(1)}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function getPhoneLookupCandidates(value: string): string[] {
  const normalized = normalizePhone(value);
  if (!normalized) return [];

  const candidates = new Set<string>([normalized]);
  if (normalized.startsWith("57") && normalized.length === 12) {
    candidates.add(normalized.slice(2));
  }

  return Array.from(candidates);
}
