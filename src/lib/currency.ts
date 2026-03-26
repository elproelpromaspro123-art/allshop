/**
 * Currency and mathematical utilities
 */

export interface Money {
  amount: number;
  currency: string;
}

/**
 * Format currency amount with proper decimal handling
 */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: money.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/**
 * Add percentage to amount
 */
export function addPercentage(amount: number, percentage: number): number {
  return Math.round(amount * (1 + percentage / 100));
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return Math.round(amount * (percentage / 100));
}

/**
 * Round to specified decimal places
 */
export function roundTo(num: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/**
 * Calculate tax (IVA in Colombia is 19%)
 */
export function calculateTax(amount: number, taxRate: number = 19): number {
  return Math.round(amount * (taxRate / 100));
}

/**
 * Calculate amount with tax included
 */
export function amountWithTax(amount: number, taxRate: number = 19): number {
  return amount + calculateTax(amount, taxRate);
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(
  amount: number,
  discountValue: number,
  isPercentage: boolean,
): number {
  if (isPercentage) {
    return calculatePercentage(amount, discountValue);
  }
  return Math.min(discountValue, amount);
}

/**
 * Apply discount to amount safely
 */
export function applyDiscount(
  amount: number,
  discountValue: number,
  isPercentage: boolean,
): number {
  const discount = calculateDiscountAmount(amount, discountValue, isPercentage);
  return Math.max(0, amount - discount);
}

/**
 * Calculate cart total with shipping
 */
export function calculateCartTotal(
  subtotal: number,
  shippingCost: number,
  discount: number = 0,
): number {
  return Math.max(0, subtotal + shippingCost - discount);
}

/**
 * Format price without currency symbol
 */
export function formatPriceOnly(price: number): string {
  return new Intl.NumberFormat("es-CO").format(price);
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("es-CO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Clamp a number between min and max
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if number is within range
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Calculate average of array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

/**
 * Sum array of numbers
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}