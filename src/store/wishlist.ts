"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeLegacyImagePath } from "@/lib/image-paths";

export interface WishlistItem {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  categoryName?: string | null;
  savedAt: number;
}

export interface WishlistGroup {
  categoryName: string;
  items: WishlistItem[];
  totalValue: number;
}

export interface WishlistSummary {
  itemCount: number;
  categoryCount: number;
  totalValue: number;
  latestSavedAt: number | null;
}

export const WISHLIST_DEFAULT_CATEGORY = "Sin categoria";

type WishlistRecord = {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  price?: number;
  categoryName?: string | null;
  savedAt?: number;
};

interface WishlistState {
  items: WishlistItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  replaceItems: (items: WishlistItem[]) => void;
  addItem: (item: Omit<WishlistItem, "savedAt">) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: Omit<WishlistItem, "savedAt">) => boolean;
  clear: () => void;
  getItemCount: () => number;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isWishlistRecord(item: unknown): item is WishlistRecord {
  if (!item || typeof item !== "object") return false;
  const record = item as Record<string, unknown>;
  return hasText(record.id) && hasText(record.slug) && hasText(record.name);
}

export function normalizeWishlistItem(item: WishlistRecord): WishlistItem {
  const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : 0;
  const categoryName =
    typeof item.categoryName === "string" && item.categoryName.trim()
      ? item.categoryName.trim()
      : null;
  const image =
    typeof item.image === "string" && item.image.trim()
      ? normalizeLegacyImagePath(item.image)
      : null;

  return {
    ...item,
    price,
    categoryName,
    image,
    savedAt: typeof item.savedAt === "number" ? item.savedAt : Date.now(),
  };
}

export function normalizeWishlistItems(items: unknown): WishlistItem[] {
  if (!Array.isArray(items)) return [];

  const seenIds = new Set<string>();

  return items
    .filter(isWishlistRecord)
    .map((item) => normalizeWishlistItem(item))
    .sort((left, right) => right.savedAt - left.savedAt)
    .filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
}

export function groupWishlistItems(items: readonly WishlistItem[]): WishlistGroup[] {
  const groups = new Map<string, WishlistItem[]>();

  [...items]
    .sort((left, right) => right.savedAt - left.savedAt)
    .forEach((item) => {
      const categoryName = item.categoryName?.trim() || WISHLIST_DEFAULT_CATEGORY;
      const current = groups.get(categoryName) || [];
      current.push(item);
      groups.set(categoryName, current);
    });

  return Array.from(groups.entries())
    .map(([categoryName, groupedItems]) => ({
      categoryName,
      items: groupedItems,
      totalValue: groupedItems.reduce((total, item) => total + item.price, 0),
    }))
    .sort((left, right) => {
      const leftLatest = left.items[0]?.savedAt ?? 0;
      const rightLatest = right.items[0]?.savedAt ?? 0;
      return rightLatest - leftLatest || right.items.length - left.items.length;
    });
}

export function summarizeWishlistItems(items: readonly WishlistItem[]): WishlistSummary {
  const categoryCount = new Set(
    items.map((item) => item.categoryName?.trim() || WISHLIST_DEFAULT_CATEGORY),
  ).size;

  return {
    itemCount: items.length,
    categoryCount,
    totalValue: items.reduce((total, item) => total + item.price, 0),
    latestSavedAt:
      items.length > 0
        ? Math.max(...items.map((item) => item.savedAt))
        : null,
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),
      replaceItems: (items) => set({ items: normalizeWishlistItems(items) }),

      addItem: (item) =>
        set((state) => {
          const normalizedItem = normalizeWishlistItem(item);
          const deduped = state.items.filter((entry) => entry.id !== normalizedItem.id);
          return {
            items: [normalizedItem, ...deduped],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.id !== id),
        })),

      toggleItem: (item) => {
        let added = false;
        set((state) => {
          const exists = state.items.some((entry) => entry.id === item.id);
          added = !exists;
          if (exists) {
            return {
              items: state.items.filter((entry) => entry.id !== item.id),
            };
          }
          const normalizedItem = normalizeWishlistItem(item);
          return {
            items: [normalizedItem, ...state.items],
          };
        });
        return added;
      },

      clear: () => set({ items: [] }),

      getItemCount: () => get().items.length,
    }),
    {
      name: "vortixy-wishlist",
      version: 2,
      partialize: (state) => ({
        items: state.items,
      }),
      migrate: (persistedState: unknown) => {
        return {
          items: normalizeWishlistItems(
            (persistedState as { items?: unknown } | null)?.items,
          ),
          hasHydrated: false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          if (state?.items?.length) {
            state.replaceItems(normalizeWishlistItems(state.items));
          }
          state?.setHasHydrated(true);
        }
      },
    },
  ),
);
