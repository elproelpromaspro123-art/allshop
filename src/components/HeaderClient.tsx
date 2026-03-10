"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, useMemo, useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button, buttonVariants } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { SearchDialog } from "./SearchDialog";
import { SecurityBadge } from "./SecurityBadge";

export function HeaderClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const { t } = useLanguage();

  const navLinks = useMemo(
    () => [
      { href: "/categoria/cocina", label: t("nav.kitchen") },
      { href: "/categoria/tecnologia", label: t("nav.tech") },
      { href: "/categoria/hogar", label: t("nav.home") },
      { href: "/categoria/belleza", label: t("nav.beauty") },
      { href: "/categoria/fitness", label: t("nav.fitness") },
      { href: "/seguimiento", label: t("footer.track") },
      { href: "/soporte#feedback-form", label: "Feedback" },
    ],
    [t]
  );

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

  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-[60] animate-fade-in-up">
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(250,251,252,0.85)] backdrop-blur-2xl border-b border-black/[0.05] shadow-[0_1px_20px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
              onClick={handleBrandClick}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 group-hover:opacity-100 opacity-15 bg-[var(--accent)]/30" />
                <div className="relative w-9 h-9 rounded-xl bg-[var(--accent-strong)] flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,169,104,0.3)]">
                  <span className="text-sm font-extrabold text-white">V</span>
                </div>
              </div>
              <span
                suppressHydrationWarning
                className="block text-lg font-bold tracking-tight text-[var(--foreground)]"
              >
                Vortixy
              </span>
            </Link>
            <SecurityBadge className="hidden md:inline-flex" />

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-200 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/[0.03]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
              >
                <Search className="w-[18px] h-[18px]" />
              </Button>

              <Link
                href="/checkout"
                aria-label="Carrito de compras"
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className:
                    "relative rounded-full text-[var(--muted)] hover:text-[var(--foreground)]",
                })}
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {hasHydrated && itemCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--accent-strong)] text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                ) : null}
              </Link>

              <div className="hidden lg:block">
                <Link
                  href="/#productos"
                  className={buttonVariants({
                    size: "sm",
                    className: "ml-1.5 gap-1.5",
                  })}
                >
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
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

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>

    {mobileMenuOpen ? (
      <div className="fixed inset-0 z-50 lg:hidden bg-white backdrop-blur-md animate-fade-in-up">
        <div className="flex flex-col h-full px-6 pt-24 pb-12 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <div key={link.href} className="animate-fade-in-up">
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium transition-colors text-neutral-800 hover:bg-black/[0.03] active:bg-black/[0.06]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                  <ArrowRight className="w-4 h-4 text-neutral-300" />
                </Link>
                {i < navLinks.length - 1 ? (
                  <div className="mx-4 h-px bg-black/[0.04]" />
                ) : null}
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-6 animate-fade-in-up">
            <Link
              href="/#productos"
              onClick={() => setMobileMenuOpen(false)}
              className={buttonVariants({ size: "lg", className: "w-full gap-2 flex" })}
            >
              {t("hero.ctaPrimary")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    ) : null}
  </>
  );
}
