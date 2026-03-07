"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

const LEGACY_IMAGE_FALLBACK = "/images/fallback-product.png";

function normalizeLegacyImagePath(path: string): string {
  if (path.startsWith("/products/") || path.startsWith("/images/realistic/")) {
    return LEGACY_IMAGE_FALLBACK;
  }
  return path;
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
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.variant === item.variant
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.variant === item.variant
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
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
            const normalizedItems = state.items.map((item) => ({
              ...item,
              image: normalizeLegacyImagePath(item.image),
            }));
            const changed = normalizedItems.some(
              (item, index) => item.image !== state.items[index]?.image
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

