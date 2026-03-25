"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  categoryName?: string | null;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clear: () => void;
}

const MAX_ITEMS = 8;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const deduped = state.items.filter((entry) => entry.id !== item.id);
          return {
            items: [
              {
                ...item,
                viewedAt: Date.now(),
              },
              ...deduped,
            ].slice(0, MAX_ITEMS),
          };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "vortixy-recently-viewed",
      version: 1,
    },
  ),
);
