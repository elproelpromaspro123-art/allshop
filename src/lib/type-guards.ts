/**
 * Type guard utilities
 */

import type { Product, Category, Order, CartItem } from "@/types";

/**
 * Check if value is a valid Product
 */
export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const obj = value as Partial<Product>;
  return typeof obj.id === "string" && typeof obj.name === "string";
}

/**
 * Check if value is a valid Category
 */
export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const obj = value as Partial<Category>;
  return typeof obj.id === "string" && typeof obj.name === "string";
}

/**
 * Check if value is a valid Order
 */
export function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const obj = value as Partial<Order>;
  return typeof obj.id === "string" && typeof obj.payment_id === "string";
}

/**
 * Check if value is a valid CartItem
 */
export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const obj = value as Partial<CartItem>;
  return typeof obj.productId === "string" && typeof obj.quantity === "number";
}

/**
 * Check if array contains only Products
 */
export function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

/**
 * Check if array contains only Categories
 */
export function isCategoryArray(value: unknown): value is Category[] {
  return Array.isArray(value) && value.every(isCategory);
}

/**
 * Check if array contains only Orders
 */
export function isOrderArray(value: unknown): value is Order[] {
  return Array.isArray(value) && value.every(isOrder);
}

/**
 * Type guard for unknown error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const Proto = Object.getPrototypeOf(value);
  return Proto === Object.prototype || Proto === null;
}

/**
 * Type guard for non-null, non-undefined value
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Type guard for boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard for array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Type guard for non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}