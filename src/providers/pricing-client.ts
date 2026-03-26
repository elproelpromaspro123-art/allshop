import {
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type PricingContextPayload,
} from "@/lib/pricing";

export const PRICING_CONTEXT_SESSION_KEY = "vortixy_pricing_context";
export const DISPLAY_CURRENCY_STORAGE_KEY = "vortixy_display_currency";
export const PRICING_CONTEXT_TTL_MS = 6 * 60 * 60 * 1000;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedPricingContext {
  savedAt: number;
  payload: PricingContextPayload;
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency === value);
}

function isPricingContextPayload(value: unknown): value is PricingContextPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.countryCode === "string" &&
    typeof payload.locale === "string" &&
    typeof payload.currency === "string" &&
    typeof payload.paymentCurrency === "string" &&
    typeof payload.baseCurrency === "string" &&
    typeof payload.updatedAt === "string" &&
    payload.rates !== null &&
    typeof payload.rates === "object"
  );
}

export function readPricingContextCache(
  storage: StorageLike,
  now = Date.now(),
): PricingContextPayload | null {
  try {
    const raw = storage.getItem(PRICING_CONTEXT_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedPricingContext;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !isPricingContextPayload(parsed.payload)
    ) {
      storage.removeItem(PRICING_CONTEXT_SESSION_KEY);
      return null;
    }

    if (now - parsed.savedAt > PRICING_CONTEXT_TTL_MS) {
      storage.removeItem(PRICING_CONTEXT_SESSION_KEY);
      return null;
    }

    return parsed.payload;
  } catch {
    storage.removeItem(PRICING_CONTEXT_SESSION_KEY);
    return null;
  }
}

export function writePricingContextCache(
  storage: StorageLike,
  payload: PricingContextPayload,
  now = Date.now(),
): void {
  storage.setItem(
    PRICING_CONTEXT_SESSION_KEY,
    JSON.stringify({
      savedAt: now,
      payload,
    } satisfies PersistedPricingContext),
  );
}

export function readCurrencyOverride(storage: StorageLike): CurrencyCode | null {
  try {
    const raw = String(storage.getItem(DISPLAY_CURRENCY_STORAGE_KEY) || "").trim();
    return isCurrencyCode(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeCurrencyOverride(
  storage: StorageLike,
  currency: CurrencyCode | null,
): void {
  if (!currency) {
    storage.removeItem(DISPLAY_CURRENCY_STORAGE_KEY);
    return;
  }

  storage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, currency);
}

