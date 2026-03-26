/**
 * Shopping/e-commerce utilities
 */

import type { CartItem } from "@/types";

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

export function calculateCartSummary(
  items: CartItem[],
  shippingCost = 0,
  discountAmount = 0,
): CartSummary {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shipping: shippingCost,
    discount: discountAmount,
    total: Math.max(0, subtotal + shippingCost - discountAmount),
  };
}

export function formatInstallments(amount: number, installments = 12) {
  const monthly = Math.ceil(amount / installments);
  return `${installments}x de $${monthly}`;
}

export function isFreeShippingEligible(subtotal: number, freeThreshold = 150000) {
  return subtotal >= freeThreshold;
}

export function calculateSavings(original: number, sale: number) {
  return Math.max(0, original - sale);
}

export function getDiscountPercentage(original: number, sale: number) {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}