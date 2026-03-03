import { NextRequest, NextResponse } from "next/server";
import {
  BASE_CURRENCY,
  PAYMENT_CURRENCY,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type PricingContextPayload,
  getFallbackRates,
  resolveCurrency,
  resolveLocaleFromAcceptLanguage,
  sanitizeCountryCode,
} from "@/lib/pricing";

interface RatesCache {
  timestamp: number;
  source: "remote" | "fallback";
  rates: Record<CurrencyCode, number>;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
let ratesCache: RatesCache | null = null;

function getCountryCode(request: NextRequest): string {
  const headers = request.headers;
  return sanitizeCountryCode(
    headers.get("x-vercel-ip-country") ||
      headers.get("cf-ipcountry") ||
      headers.get("x-country-code")
  );
}

async function getRates(): Promise<RatesCache> {
  const now = Date.now();
  if (ratesCache && now - ratesCache.timestamp < CACHE_TTL_MS) {
    return ratesCache;
  }

  const fallback = getFallbackRates();

  try {
    const response = await fetch("https://open.er-api.com/v6/latest/COP", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Rates API returned ${response.status}`);
    }

    const data = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };

    if (!data?.rates || data.result !== "success") {
      throw new Error("Rates API payload invalid");
    }

    const safeRates = { ...fallback };
    for (const currency of SUPPORTED_CURRENCIES) {
      const value = Number(data.rates[currency]);
      if (Number.isFinite(value) && value > 0) {
        safeRates[currency] = value;
      }
    }
    safeRates.COP = 1;

    ratesCache = {
      timestamp: now,
      source: "remote",
      rates: safeRates,
    };
    return ratesCache;
  } catch {
    ratesCache = {
      timestamp: now,
      source: "fallback",
      rates: fallback,
    };
    return ratesCache;
  }
}

export async function GET(request: NextRequest) {
  const countryCode = getCountryCode(request);
  const locale = resolveLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  const currency = resolveCurrency(countryCode, locale);
  const { rates, source, timestamp } = await getRates();

  const payload: PricingContextPayload = {
    countryCode,
    locale,
    currency,
    baseCurrency: BASE_CURRENCY,
    paymentCurrency: PAYMENT_CURRENCY,
    rates,
    rateToDisplay: rates[currency] ?? 1,
    source,
    updatedAt: new Date(timestamp).toISOString(),
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
    },
  });
}

