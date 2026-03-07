"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Menu,
  ShoppingBag,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === "dark";

  const navLinks = [
    { href: "/categoria/cocina", label: t("nav.kitchen") },
    { href: "/categoria/tecnologia", label: t("nav.tech") },
    { href: "/categoria/hogar", label: t("nav.home") },
    { href: "/categoria/belleza", label: t("nav.beauty") },
    { href: "/categoria/fitness", label: t("nav.fitness") },
    { href: "/seguimiento", label: t("footer.track") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const mobileItemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
    exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
  };

  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      suppressHydrationWarning
      className="sticky top-0 z-50"
    >
      <div
        className={`transition-all duration-500 ${scrolled
          ? isDark
            ? "bg-[rgba(11,13,20,0.85)] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_20px_rgba(0,0,0,0.3)]"
            : "bg-[rgba(250,251,252,0.85)] backdrop-blur-2xl border-b border-black/[0.05] shadow-[0_1px_20px_rgba(0,0,0,0.04)]"
          : isDark
            ? "bg-transparent"
            : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
              onClick={handleBrandClick}
            >
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 group-hover:opacity-100 ${isDark ? "opacity-30 bg-[var(--accent)]/40" : "opacity-15 bg-[var(--accent)]/30"
                    }`}
                />
                <div className="relative w-9 h-9 rounded-xl bg-[var(--accent-strong)] flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,169,104,0.3)]">
                  <span className="text-sm font-extrabold text-white">V</span>
                </div>
              </div>
              <div className="leading-tight">
                <span
                  suppressHydrationWarning
                  className={`block text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-[var(--foreground)]"
                    }`}
                >
                  Vortixy
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${isDark
                    ? "text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/[0.03]"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
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
                  <AnimatePresence>
                    {hasHydrated && itemCount > 0 && (
                      <motion.span
                        key={`cart-badge-${itemCount}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          scale: { duration: 0.35, ease: "easeOut" },
                          opacity: { duration: 0.15 },
                        }}
                        suppressHydrationWarning
                        className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--accent-strong)] text-white"
                      >
                        {itemCount > 99 ? "99+" : itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Link>

              {/* CTA button */}
              <Link href="/#productos" className="hidden lg:block ml-1.5">
                <Button size="sm" className="gap-1.5">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>

              {/* Mobile menu toggle */}
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
      </div>

      {/* Full-screen mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`fixed inset-0 top-16 sm:top-[4.5rem] z-50 lg:hidden ${isDark
              ? "bg-[rgba(11,13,20,0.98)] backdrop-blur-2xl"
              : "bg-[rgba(250,251,252,0.98)] backdrop-blur-2xl"
              }`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full px-6 pt-8 pb-12 overflow-y-auto"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    custom={i}
                    variants={mobileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium transition-colors ${isDark
                        ? "text-neutral-200 hover:bg-white/[0.05] active:bg-white/[0.08]"
                        : "text-neutral-800 hover:bg-black/[0.03] active:bg-black/[0.06]"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                      <ArrowRight
                        className={`w-4 h-4 ${isDark ? "text-neutral-600" : "text-neutral-300"
                          }`}
                      />
                    </Link>
                    {i < navLinks.length - 1 && (
                      <div
                        className={`mx-4 h-px ${isDark ? "bg-white/[0.04]" : "bg-black/[0.04]"
                          }`}
                      />
                    )}
                  </motion.div>
                ))}
              </nav>

              <motion.div
                custom={navLinks.length}
                variants={mobileItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-auto pt-6"
              >
                <Link
                  href="/#productos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button size="lg" className="w-full gap-2">
                    {t("hero.ctaPrimary")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
