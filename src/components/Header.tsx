"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Check,
  ArrowRight,
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
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLanguageChange = (langCode: LanguageCode) => {
    setLanguage(langCode);
    setLangMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? isDark
            ? "bg-[rgba(9,13,20,0.92)] backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_24px_-6px_rgba(0,0,0,0.5)]"
            : "bg-[rgba(250,252,251,0.92)] backdrop-blur-xl border-b border-[var(--border)] shadow-[0_1px_24px_-6px_rgba(0,0,0,0.06)]"
          : isDark
            ? "bg-transparent"
            : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
              <span className="text-sm font-extrabold text-[#071a0a]">A</span>
            </div>
            <span
              className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-[var(--foreground)]"
                }`}
            >
              allshop
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 text-[13px] font-medium rounded-full transition-colors ${isDark
                    ? "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`hidden sm:flex rounded-full ${isDark
                  ? "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              aria-label={isDark ? t("theme.light") : t("theme.dark")}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isDark ? (
                    <Sun className="w-[18px] h-[18px]" />
                  ) : (
                    <Moon className="w-[18px] h-[18px]" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>

            {/* Language */}
            <div className="relative hidden md:block" ref={langRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-full ${isDark
                    ? "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-semibold">
                  {currentLanguage.code.toUpperCase()}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""
                    }`}
                />
              </Button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-52 rounded-2xl border overflow-hidden ${isDark
                        ? "bg-[#0f1622] border-white/[0.08] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
                        : "bg-white border-[var(--border)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)]"
                      }`}
                  >
                    <div
                      className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide border-b ${isDark
                          ? "text-neutral-500 border-white/[0.06]"
                          : "text-neutral-400 border-[var(--border)]"
                        }`}
                    >
                      {t("language.select")}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${language === lang.code
                              ? isDark
                                ? "bg-white/[0.06] text-white"
                                : "bg-[var(--surface-muted)] text-[var(--foreground)] font-medium"
                              : isDark
                                ? "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
                                : "text-neutral-600 hover:bg-[var(--surface-muted)]"
                            }`}
                        >
                          <span className="w-7 text-[11px] text-neutral-500 font-semibold">
                            {lang.code.toUpperCase()}
                          </span>
                          <span className="flex-1">{lang.nativeName}</span>
                          {language === lang.code && (
                            <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link href="/checkout">
              <Button
                variant="ghost"
                size="icon"
                className={`relative rounded-full ${isDark
                    ? "text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                <span
                  suppressHydrationWarning
                  className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--accent)] text-[#071a0a] transition-opacity ${itemCount > 0 ? "opacity-100" : "opacity-0"
                    }`}
                  aria-hidden={itemCount === 0}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              </Button>
            </Link>

            {/* CTA Desktop */}
            <Link href="#productos" className="hidden lg:block ml-1">
              <Button size="sm" className="gap-1.5">
                {t("hero.ctaPrimary")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden rounded-full ${isDark
                  ? "text-neutral-400 hover:text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`lg:hidden border-t overflow-hidden ${isDark
                ? "border-white/[0.06] bg-[#090d14]"
                : "border-[var(--border)] bg-[var(--background)]"
              }`}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDark
                      ? "text-neutral-300 hover:bg-white/[0.05]"
                      : "text-neutral-700 hover:bg-[var(--surface-muted)]"
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div
                className={`pt-3 mt-2 border-t ${isDark ? "border-white/[0.06]" : "border-[var(--border)]"
                  }`}
              >
                <button
                  onClick={toggleTheme}
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm font-medium flex items-center gap-2.5 transition-colors ${isDark
                      ? "text-neutral-300 hover:bg-white/[0.05]"
                      : "text-neutral-700 hover:bg-[var(--surface-muted)]"
                    }`}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  {isDark ? t("theme.light") : t("theme.dark")}
                </button>

                <div className="mt-2 px-4">
                  <p
                    className={`pb-2 text-[11px] uppercase tracking-wider font-semibold ${isDark ? "text-neutral-500" : "text-neutral-400"
                      }`}
                  >
                    {t("language.title")}
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`h-8 rounded-lg text-[11px] font-semibold transition-colors ${language === lang.code
                            ? "bg-[var(--accent)] text-[#071a0a]"
                            : isDark
                              ? "text-neutral-500 bg-white/[0.04] hover:bg-white/[0.08]"
                              : "text-neutral-500 bg-[var(--surface-muted)] hover:bg-[var(--border)]"
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
