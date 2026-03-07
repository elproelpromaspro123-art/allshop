"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { normalizeLegacyImagePath as normalizeLegacyProductImagePath } from "@/lib/image-paths";
import { normalizeProductSlug } from "@/lib/legacy-product-slugs";

const LEGACY_IMAGE_FALLBACK = "/images/fallback-product.png";
const LEGACY_RETIRED_IMAGE_PREFIXES = [
  "/productos/xiaomi-redmi-airdots-s/",
  "/productos/arctic-air-ice-jet/",
];
const CART_IMAGE_FALLBACK_BY_SLUG: Record<string, string> = {
  "audifonos-xiaomi-redmi-buds-4-lite":
    "/productos/audifonos-xiaomi-redmi-buds-4-lite/1743447396buds4-1.png",
  "camara-seguridad-bombillo-360-wifi":
    "/productos/camara-seguridad-bombillo-360-wifi/1771863986CAMARA-IP-1.png",
};

function normalizeLegacyImagePath(path: string): string {
  const normalized = normalizeLegacyProductImagePath(path);
  if (LEGACY_RETIRED_IMAGE_PREFIXES.some((prefix) => normalized.includes(prefix))) {
    return LEGACY_IMAGE_FALLBACK;
  }
  if (normalized.startsWith("/products/") || normalized.startsWith("/images/realistic/")) {
    return LEGACY_IMAGE_FALLBACK;
  }
  return normalized;
}

function normalizeCartItem(item: CartItem): CartItem {
  const normalizedSlug = normalizeProductSlug(item.slug) || item.slug;
  const normalizedImage = normalizeLegacyImagePath(item.image);
  const image =
    normalizedImage === LEGACY_IMAGE_FALLBACK
      ? CART_IMAGE_FALLBACK_BY_SLUG[String(normalizedSlug || "").trim().toLowerCase()] ||
        LEGACY_IMAGE_FALLBACK
      : normalizedImage;

  return {
    ...item,
    slug: normalizedSlug || undefined,
    image,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  };
}

function normalizeCartItems(items: CartItem[]): CartItem[] {
  return items
    .map((item) => normalizeCartItem(item))
    .filter((item) => Boolean(item.productId));
}

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  replaceItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant: string | null) => void;
  updateQuantity: (productId: string, variant: string | null, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getShippingType: () => "nacional" | "internacional" | "mixto";
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),
      replaceItems: (items) => set({ items }),

      addItem: (item) =>
        set((state) => {
          const normalizedItem = normalizeCartItem(item);
          const existing = state.items.find(
            (i) =>
              i.productId === normalizedItem.productId &&
              i.variant === normalizedItem.variant
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === normalizedItem.productId &&
                i.variant === normalizedItem.variant
                  ? { ...i, quantity: i.quantity + normalizedItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, normalizedItem] };
        }),

      removeItem: (productId, variant) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variant === variant)
          ),
        })),

      updateQuantity: (productId, variant, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.variant === variant)
                )
              : state.items.map((i) =>
                  i.productId === productId && i.variant === variant
                    ? { ...i, quantity }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getShippingType: () => {
        const items = get().items;
        const hasNacional = items.some(
          (i) => i.stockLocation === "nacional" || i.stockLocation === "ambos"
        );
        const hasInternacional = items.some(
          (i) => i.stockLocation === "internacional"
        );
        if (hasNacional && hasInternacional) return "mixto";
        if (hasInternacional) return "internacional";
        return "nacional";
      },
    }),
    {
      name: "vortixy-cart",
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          if (state?.items?.length) {
            const normalizedItems = normalizeCartItems(state.items);
            const changed =
              normalizedItems.length !== state.items.length ||
              normalizedItems.some(
                (item, index) => item.image !== state.items[index]?.image
                || item.slug !== state.items[index]?.slug
                || item.quantity !== state.items[index]?.quantity
              );
            if (changed) {
              state.replaceItems(normalizedItems);
            }
          }
          state?.setHasHydrated(true);
        }
      },
    }
  )
);

