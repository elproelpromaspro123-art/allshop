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
  type PricingContextPayload,
  createDefaultPricingContext,
  convertFromCop,
  formatCurrencyAmount,
} from "@/lib/pricing";

interface PricingContextType extends PricingContextPayload {
  ready: boolean;
  isDisplayDifferentFromPayment: boolean;
  formatDisplayPrice: (amountCop: number) => string;
  formatPaymentPrice: (amountCop: number) => string;
  convertDisplayAmount: (amountCop: number) => number;
}

const STORAGE_KEY = "vortixy-pricing-context";

const defaultContext = createDefaultPricingContext();

const PricingContext = createContext<PricingContextType>({
  ...defaultContext,
  ready: false,
  isDisplayDifferentFromPayment: false,
  formatDisplayPrice: (amountCop) => formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  formatPaymentPrice: (amountCop) => formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  convertDisplayAmount: (amountCop) => amountCop,
});

function isPricingPayload(value: unknown): value is PricingContextPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PricingContextPayload>;
  return (
    typeof payload.countryCode === "string" &&
    typeof payload.locale === "string" &&
    typeof payload.currency === "string" &&
    typeof payload.baseCurrency === "string" &&
    typeof payload.paymentCurrency === "string" &&
    typeof payload.rates === "object" &&
    payload.rates !== null
  );
}

export function PricingProvider({ children }: { children: ReactNode }) {
  const [pricing, setPricing] = useState<PricingContextPayload>(defaultContext);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRaw = localStorage.getItem(STORAGE_KEY);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw) as unknown;
        if (isPricingPayload(stored)) {
          setPricing(stored);
        }
      } catch {
        // Ignore invalid local cache
      }
    }

    let cancelled = false;
    const loadPricing = async () => {
      try {
        const response = await fetch("/api/pricing/context");
        const data = (await response.json()) as unknown;
        if (!cancelled && isPricingPayload(data)) {
          setPricing(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void loadPricing();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<PricingContextType>(() => {
    const isDisplayDifferentFromPayment = pricing.currency !== pricing.paymentCurrency;

    const convertDisplayAmount = (amountCop: number) =>
      convertFromCop(amountCop, pricing.currency, pricing.rates);

    const formatDisplayPrice = (amountCop: number) =>
      formatCurrencyAmount(convertDisplayAmount(amountCop), pricing.currency, pricing.locale);

    const formatPaymentPrice = (amountCop: number) =>
      formatCurrencyAmount(amountCop, pricing.paymentCurrency, pricing.locale);

    return {
      ...pricing,
      ready,
      isDisplayDifferentFromPayment,
      convertDisplayAmount,
      formatDisplayPrice,
      formatPaymentPrice,
    };
  }, [pricing, ready]);

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  return useContext(PricingContext);
}


