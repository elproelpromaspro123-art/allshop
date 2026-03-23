export const BASE_CURRENCY = "COP" as const;
export const PAYMENT_CURRENCY = "COP" as const;

export const SUPPORTED_CURRENCIES = [
  "COP",
  "USD",
  "EUR",
  "MXN",
  "BRL",
  "PEN",
  "CLP",
  "ARS",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "CNY",
  "INR",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface PricingContextPayload {
  countryCode: string;
  locale: string;
  currency: CurrencyCode;
  baseCurrency: typeof BASE_CURRENCY;
  paymentCurrency: typeof PAYMENT_CURRENCY;
  rates: Record<CurrencyCode, number>;
  rateToDisplay: number;
  source: "remote" | "fallback";
  updatedAt: string;
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  CO: "COP",
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CL: "CLP",
  PE: "PEN",
  GB: "GBP",
  AU: "AUD",
  JP: "JPY",
  IN: "INR",
  CN: "CNY",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  PT: "EUR",
  NL: "EUR",
  CH: "CHF",
};

const LANGUAGE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  es: "COP",
  en: "USD",
  pt: "BRL",
  fr: "EUR",
  de: "EUR",
  it: "EUR",
  ja: "JPY",
  hi: "INR",
  zh: "CNY",
};

export function sanitizeCountryCode(value: string | null | undefined): string {
  if (!value) return "CO";
  const normalized = value.trim().toUpperCase();
  return normalized.length === 2 ? normalized : "CO";
}

export function resolveLocaleFromAcceptLanguage(
  value: string | null | undefined,
): string {
  if (!value) return "es-CO";
  const firstToken = value.split(",")[0]?.trim();
  if (!firstToken) return "es-CO";
  const clean = firstToken.split(";")[0]?.trim();
  return clean || "es-CO";
}

export function resolveCurrency(
  countryCode: string,
  locale: string,
): CurrencyCode {
  const fromCountry = COUNTRY_CURRENCY_MAP[countryCode];
  if (fromCountry) return fromCountry;

  const langCode = locale.toLowerCase().split("-")[0];
  return LANGUAGE_CURRENCY_MAP[langCode] || "COP";
}

export function getFallbackRates(): Record<CurrencyCode, number> {
  return {
    COP: 1,
    USD: 0.00026,
    EUR: 0.00024,
    MXN: 0.0044,
    BRL: 0.0015,
    PEN: 0.00098,
    CLP: 0.25,
    ARS: 0.26,
    GBP: 0.0002,
    CAD: 0.00035,
    AUD: 0.0004,
    JPY: 0.038,
    CHF: 0.00023,
    CNY: 0.0019,
    INR: 0.022,
  };
}

export function createDefaultPricingContext(): PricingContextPayload {
  const rates = getFallbackRates();
  return {
    countryCode: "CO",
    locale: "es-CO",
    currency: "COP",
    baseCurrency: BASE_CURRENCY,
    paymentCurrency: PAYMENT_CURRENCY,
    rates,
    rateToDisplay: rates.COP,
    source: "fallback",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export function convertFromCop(
  amountCop: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number>,
): number {
  const safeAmount = Number.isFinite(amountCop) ? amountCop : 0;
  const rate = rates[currency] ?? 1;
  return safeAmount * rate;
}

export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
  locale: string,
): string {
  const maxDecimals = currency === "COP" || currency === "JPY" || currency === "CLP" ? 0 : 2;
  return new Intl.NumberFormat(locale || "es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: maxDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  }).format(amount);
}
