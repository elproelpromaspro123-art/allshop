"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
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

const PricingContext = createContext<PricingContextType>({
  ...createDefaultPricingContext(),
  ready: true,
  isDisplayDifferentFromPayment: false,
  formatDisplayPrice: (amountCop) =>
    formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  formatPaymentPrice: (amountCop) =>
    formatCurrencyAmount(amountCop, BASE_CURRENCY, "es-CO"),
  convertDisplayAmount: (amountCop) => amountCop,
});

export function PricingProvider({ children }: { children: ReactNode }) {
  const value = useMemo<PricingContextType>(() => {
    const pricing = createDefaultPricingContext();
    const isDisplayDifferentFromPayment =
      pricing.currency !== pricing.paymentCurrency;

    const convertDisplayAmount = (amountCop: number) =>
      convertFromCop(amountCop, pricing.currency, pricing.rates);

    const formatDisplayPrice = (amountCop: number) =>
      formatCurrencyAmount(
        convertDisplayAmount(amountCop),
        pricing.currency,
        pricing.locale,
      );

    const formatPaymentPrice = (amountCop: number) =>
      formatCurrencyAmount(amountCop, pricing.paymentCurrency, pricing.locale);

    return {
      ...pricing,
      ready: true,
      isDisplayDifferentFromPayment,
      convertDisplayAmount,
      formatDisplayPrice,
      formatPaymentPrice,
    };
  }, []);

  return (
    <PricingContext.Provider value={value}>{children}</PricingContext.Provider>
  );
}

export function usePricing() {
  return useContext(PricingContext);
}
