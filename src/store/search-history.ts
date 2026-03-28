"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_SEARCH_HISTORY_ITEMS = 6;

interface SearchHistoryState {
  terms: string[];
  addTerm: (term: string) => void;
  removeTerm: (term: string) => void;
  clearTerms: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set) => ({
      terms: [],
      addTerm: (term) =>
        set((state) => {
          const normalized = String(term || "").trim();
          if (normalized.length < 2) return state;
          const normalizedKey = normalized.toLocaleLowerCase("es-CO");

          return {
            terms: [
              normalized,
              ...state.terms.filter(
                (entry) => entry.toLocaleLowerCase("es-CO") !== normalizedKey,
              ),
            ].slice(0, MAX_SEARCH_HISTORY_ITEMS),
          };
        }),
      removeTerm: (term) =>
        set((state) => {
          const normalizedKey = String(term || "")
            .trim()
            .toLocaleLowerCase("es-CO");
          if (!normalizedKey) return state;
          return {
            terms: state.terms.filter(
              (entry) => entry.toLocaleLowerCase("es-CO") !== normalizedKey,
            ),
          };
        }),
      clearTerms: () => set({ terms: [] }),
    }),
    {
      name: "vortixy-search-history",
      version: 1,
    },
  ),
);
