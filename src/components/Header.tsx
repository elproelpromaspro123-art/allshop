"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Check,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "@/providers/languages";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t, currentLanguage } = useLanguage();

  const isDark = resolvedTheme === "dark";

  const navLinks = [
    { href: "/categoria/cocina", label: t("nav.kitchen") },
    { href: "/categoria/tecnologia", label: t("nav.tech") },
    { href: "/categoria/hogar", label: t("nav.home") },
    { href: "/categoria/belleza", label: t("nav.beauty") },
    { href: "/categoria/fitness", label: t("nav.fitness") },
  ];

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setLangMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
        isDark
          ? "bg-[rgba(9,13,20,0.9)] border-white/10"
          : "bg-[rgba(245,248,247,0.9)] border-[var(--border)]"
      }`}
    >
      <div
        className={`hidden sm:block border-b ${
          isDark ? "bg-[rgba(15,22,34,0.8)] border-white/10" : "bg-[#edf4f0] border-[var(--border)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-[11px]">
          <p className={isDark ? "text-neutral-300" : "text-[#3f4f47]"}>
            {t("header.secure")}
          </p>
          <p className={isDark ? "text-neutral-400" : "text-[#4c5f56]"}>
            {t("header.freeShipping")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-[#06280f] flex items-center justify-center shadow-[0_8px_24px_-12px_rgba(73,204,104,0.9)]">
              <span className="text-sm font-bold">A</span>
            </div>
            <div className="min-w-0">
              <p
                className={`text-base sm:text-lg font-semibold leading-none ${
                  isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
              >
                AllShop
              </p>
              <p className={`text-[10px] tracking-[0.18em] uppercase mt-1 ${isDark ? "text-neutral-500" : "text-[#4f6259]"}`}>
                {t("header.tagline")}
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  isDark
                    ? "text-neutral-300 hover:text-white hover:bg-white/10"
                    : "text-[#4f6259] hover:text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`hidden sm:flex ${
                isDark
                  ? "text-neutral-300 hover:text-white hover:bg-white/10"
                  : "text-[#4f6259] hover:text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]"
              }`}
              aria-label={isDark ? t("theme.light") : t("theme.dark")}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ rotate: -60, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 60, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </Button>

            <div className="relative hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 ${
                  isDark
                    ? "text-neutral-300 hover:text-white hover:bg-white/10"
                    : "text-[#4f6259] hover:text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold">{currentLanguage.code.toUpperCase()}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </Button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden ${
                      isDark ? "bg-[#111418] border-white/10" : "bg-[var(--surface)] border-[var(--border)]"
                    }`}
                  >
                    <div className={`px-3 py-2 text-xs font-semibold border-b ${isDark ? "text-neutral-400 border-white/10" : "text-[#5b6d64] border-[var(--border)]"}`}>
                      {t("language.select")}
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                            language === lang.code
                              ? isDark
                                ? "bg-white/10 text-white"
                                : "bg-[color-mix(in_oklab,var(--surface-muted),var(--accent)_18%)] text-[var(--foreground)]"
                              : isDark
                              ? "text-neutral-300 hover:bg-white/5"
                              : "text-[#41544b] hover:bg-[color-mix(in_oklab,var(--surface-muted),var(--accent)_10%)]"
                          }`}
                        >
                          <span className="w-8 text-[11px] text-neutral-500 font-semibold">
                            {lang.code.toUpperCase()}
                          </span>
                          <span className="flex-1">{lang.nativeName}</span>
                          {language === lang.code && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/checkout">
              <Button
                variant="ghost"
                size="icon"
              className={`relative ${
                isDark
                  ? "text-neutral-300 hover:text-white hover:bg-white/10"
                  : "text-[#4f6259] hover:text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_11%)]"
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span
                  suppressHydrationWarning
                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--accent)] text-[#06280f] transition-opacity ${
                    itemCount > 0 ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={itemCount === 0}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden ${
                isDark ? "text-neutral-300 hover:text-white" : "text-[#4f6259] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`lg:hidden border-t ${isDark ? "border-white/10 bg-[#0b0d10]" : "border-[var(--border)] bg-[var(--background)]"}`}
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-3 rounded-xl text-sm font-medium ${
                    isDark
                      ? "text-neutral-200 hover:bg-white/10"
                      : "text-[#42554c] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_12%)]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className={`pt-3 mt-3 border-t ${isDark ? "border-white/10" : "border-neutral-200"}`}>
                <button
                  onClick={toggleTheme}
                  className={`w-full px-3 py-3 rounded-xl text-left text-sm font-medium flex items-center gap-2 ${
                    isDark ? "text-neutral-200 hover:bg-white/10" : "text-[#42554c] hover:bg-[color-mix(in_oklab,var(--surface),var(--accent)_12%)]"
                  }`}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? t("theme.light") : t("theme.dark")}
                </button>

                <div className="mt-2">
                  <p className={`px-3 pb-2 text-[11px] uppercase tracking-wider ${isDark ? "text-neutral-500" : "text-neutral-500"}`}>
                    {t("language.title")}
                  </p>
                  <div className="grid grid-cols-5 gap-2 px-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`h-8 rounded-lg text-[11px] font-semibold ${
                          language === lang.code
                            ? isDark
                              ? "bg-white/15 text-white"
                              : "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]"
                            : isDark
                              ? "text-neutral-400 bg-white/5"
                              : "text-[#4e6158] bg-[var(--surface)] border border-[var(--border)]"
                        }`}
                      >
                        {lang.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
