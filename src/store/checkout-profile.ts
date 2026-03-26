"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COLOMBIA_DEPARTMENTS, normalizeDepartment } from "@/lib/delivery";
import {
  formatCheckoutDocumentInput,
  formatCheckoutPhoneInput,
  formatCheckoutZipInput,
} from "@/lib/checkout-input-format";
import type { CheckoutFormData } from "@/lib/validation";

export interface CheckoutProfile extends CheckoutFormData {
  lastUsedAt: number;
}

type CheckoutProfileDraft = Omit<CheckoutProfile, "lastUsedAt">;

interface CheckoutProfileState {
  profile: CheckoutProfile | null;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  saveProfile: (profile: CheckoutProfileDraft) => void;
  clearProfile: () => void;
}

function normalizeCheckoutProfile(
  profile: CheckoutProfileDraft & { lastUsedAt?: number },
): CheckoutProfile {
  const canonicalDepartment =
    COLOMBIA_DEPARTMENTS.find(
      (department) =>
        normalizeDepartment(department) === normalizeDepartment(profile.department),
    ) || profile.department.trim();

  return {
    name: profile.name.trim(),
    email: profile.email.trim().toLowerCase(),
    phone: formatCheckoutPhoneInput(profile.phone),
    document: formatCheckoutDocumentInput(profile.document),
    address: profile.address.trim(),
    reference: profile.reference.trim(),
    city: profile.city.trim(),
    department: canonicalDepartment,
    zip: formatCheckoutZipInput(profile.zip),
    lastUsedAt:
      typeof profile.lastUsedAt === "number" ? profile.lastUsedAt : Date.now(),
  };
}

function hasMeaningfulCheckoutProfile(
  profile: CheckoutProfileDraft | CheckoutProfile | null | undefined,
): profile is CheckoutProfileDraft | CheckoutProfile {
  if (!profile) return false;
  return Boolean(
    profile.name?.trim() &&
      profile.email?.trim() &&
      profile.phone?.trim() &&
      profile.address?.trim() &&
      profile.city?.trim() &&
      profile.department?.trim(),
  );
}

export const useCheckoutProfileStore = create<CheckoutProfileState>()(
  persist(
    (set) => ({
      profile: null,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      saveProfile: (profile) => {
        if (!hasMeaningfulCheckoutProfile(profile)) return;
        set({ profile: normalizeCheckoutProfile(profile) });
      },

      clearProfile: () => set({ profile: null }),
    }),
    {
      name: "vortixy-checkout-profile",
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as
          | { profile?: CheckoutProfile | CheckoutProfileDraft | null }
          | null;

        return {
          ...state,
          profile: hasMeaningfulCheckoutProfile(state?.profile)
            ? normalizeCheckoutProfile(state.profile)
            : null,
          hasHydrated: false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        }
      },
    },
  ),
);
