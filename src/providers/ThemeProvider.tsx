"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    try {
      window.localStorage.setItem("theme", "light");
    } catch {
      // ignore storage errors
    }
  }, []);

  const setTheme = () => {
    // Dark mode permanently disabled.
  };

  const toggleTheme = () => {
    // Dark mode permanently disabled.
  };

  return (
    <ThemeContext.Provider
      value={{ theme: "light", resolvedTheme: "light", setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
