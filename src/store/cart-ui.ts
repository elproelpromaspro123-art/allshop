"use client";

import { create } from "zustand";

type CartDrawerSource =
  | "header"
  | "mobile-shortcut"
  | "product-banner"
  | "product-sticky"
  | "unknown";

interface CartUiState {
  isDrawerOpen: boolean;
  lastDrawerSource: CartDrawerSource | null;
  openDrawer: (source?: CartDrawerSource) => void;
  closeDrawer: () => void;
  toggleDrawer: (source?: CartDrawerSource) => void;
}

export const useCartUiStore = create<CartUiState>((set, get) => ({
  isDrawerOpen: false,
  lastDrawerSource: null,

  openDrawer: (source = "unknown") =>
    set({
      isDrawerOpen: true,
      lastDrawerSource: source,
    }),

  closeDrawer: () =>
    set({
      isDrawerOpen: false,
    }),

  toggleDrawer: (source = "unknown") =>
    set({
      isDrawerOpen: !get().isDrawerOpen,
      lastDrawerSource: source,
    }),
}));
