"use client";

import type { ReactNode } from "react";

/**
 * ThemeProvider — simplified to pass-through (fix 2.2)
 * This provider only ever returns "light" and nobody consumes useTheme()
 * outside this file. Removed the Context wrapper to eliminate unnecessary
 * client-side overhead from React.createContext + Provider.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** @deprecated Theme is always "light". No consumer uses this hook. */
export function useTheme() {
  return {
    theme: "light" as const,
    resolvedTheme: "light" as const,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
