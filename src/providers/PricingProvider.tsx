"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type PricingContextPayload,
  createDefaultPricingContext,
  convertFromCop,
  formatCurrencyAmount,
} from "@/lib/pricing";
import {
  readCurrencyOverride,
  readPricingContextCache,
  writeCurrencyOverride,
  writePricingContextCache,
} from "./pricing-client";

interface PricingContextType extends PricingContextPayload {
  ready: boolean;
  isDisplayDifferentFromPayment: boolean;
  formatDisplayPrice: (amountCop: number) => string;
  formatPaymentPrice: (amountCop: number) => string;
  convertDisplayAmount: (amountCop: number) => number;
  selectedCurrency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  clearCurrencyOverride: () => void;
  availableCurrencies: readonly CurrencyCode[];
}

const PricingContext = createContext<PricingContextType>({
  ...createDefaultPricingContext(),
  ready: false,
  isDisplayDifferentFromPayment: false,
  formatDisplayPrice: (amountCop) =>
    formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  formatPaymentPrice: (amountCop) =>
    formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  convertDisplayAmount: (amountCop) => amountCop,
  selectedCurrency: "COP",
  setCurrency: () => {},
  clearCurrencyOverride: () => {},
  availableCurrencies: SUPPORTED_CURRENCIES,
});

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricing, setPricing] = useState<PricingContextPayload>(() =>
    createDefaultPricingContext(),
  );
  const [ready, setReady] = useState(false);
  const [currencyOverride, setCurrencyOverride] = useState<CurrencyCode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cachedPricing = readPricingContextCache(window.sessionStorage);
    const storedCurrency = readCurrencyOverride(window.localStorage);
    if (storedCurrency) {
      setCurrencyOverride(storedCurrency);
    }
    if (cachedPricing) {
      setPricing(cachedPricing);
      setReady(true);
    }

    let cancelled = false;

    const loadPricingContext = async () => {
      try {
        const response = await fetch("/api/pricing/context", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch pricing context");

        const payload = (await response.json()) as
          | (PricingContextPayload & { ok?: boolean })
          | ({ ok?: boolean } & Record<string, unknown>);

        const context = {
          ...createDefaultPricingContext(),
          ...payload,
        } as PricingContextPayload;

        if (cancelled) return;
        setPricing(context);
        writePricingContextCache(window.sessionStorage, context);
      } catch {
        // Keep cached/default pricing.
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void loadPricingContext();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PricingContextType>(() => {
    const selectedCurrency = currencyOverride || pricing.currency;
    const isDisplayDifferentFromPayment =
      selectedCurrency !== pricing.paymentCurrency;

    const convertDisplayAmount = (amountCop: number) =>
      convertFromCop(amountCop, selectedCurrency, pricing.rates);

    const formatDisplayPrice = (amountCop: number) =>
      formatCurrencyAmount(
        convertDisplayAmount(amountCop),
        selectedCurrency,
        pricing.locale,
      );

    const formatPaymentPrice = (amountCop: number) =>
      formatCurrencyAmount(amountCop, pricing.paymentCurrency, pricing.locale);

    const setCurrency = (currency: CurrencyCode) => {
      setCurrencyOverride(currency);
      if (typeof window !== "undefined") {
        writeCurrencyOverride(window.localStorage, currency);
      }
    };

    const clearCurrencyOverride = () => {
      setCurrencyOverride(null);
      if (typeof window !== "undefined") {
        writeCurrencyOverride(window.localStorage, null);
      }
    };

    return {
      ...pricing,
      currency: selectedCurrency,
      ready,
      isDisplayDifferentFromPayment,
      convertDisplayAmount,
      formatDisplayPrice,
      formatPaymentPrice,
      selectedCurrency,
      setCurrency,
      clearCurrencyOverride,
      availableCurrencies: SUPPORTED_CURRENCIES,
    };
  }, [currencyOverride, pricing, ready]);

  return (
    <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
  );
}

export function usePricing() {
  return useContext(PricingContext);
}
