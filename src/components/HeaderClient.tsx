"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, useMemo, useRef, useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button, buttonVariants } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { SearchDialog } from "./SearchDialog";
import { SecurityBadge } from "./SecurityBadge";
import { cn } from "@/lib/utils";

export function HeaderClient() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const { t } = useLanguage();
  const isMobileMenuOpen = mobileMenuOpen && mobileMenuPath === pathname;

  const prevItemCountRef = useRef(itemCount);
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout | undefined;
    let timer2: NodeJS.Timeout | undefined;
    if (hasHydrated && itemCount > prevItemCountRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCartBounce(true);
      timer2 = setTimeout(() => setCartBounce(false), 600);
    }
    prevItemCountRef.current = itemCount;
    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [itemCount, hasHydrated]);

  const navLinks = useMemo(
    () => [
      { href: "/categoria/cocina", label: t("nav.kitchen") },
      { href: "/categoria/tecnologia", label: t("nav.tech") },
      { href: "/categoria/hogar", label: t("nav.home") },
      { href: "/categoria/belleza", label: t("nav.beauty") },
      { href: "/categoria/fitness", label: t("nav.fitness") },
      { href: "/seguimiento", label: t("footer.track") },
      { href: "/soporte#feedback-form", label: t("nav.feedback") },
    ],
    [t]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const openMobileMenu = () => {
    setMobileMenuPath(pathname);
    setMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
      return;
    }
    openMobileMenu();
  };

  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu();
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[70] px-0 sm:px-3 transition-[padding] duration-300",
          scrolled ? "pt-0 sm:pt-2.5" : "pt-0"
        )}
      >
      <div
        className={cn(
          "transition-all duration-300",
          scrolled
            ? "bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgba(10,15,30,0.08)] ring-1 ring-black/[0.04] sm:rounded-2xl"
            : "bg-transparent"
        )}
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
                <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center shadow-[0_2px_8px_rgba(0,143,88,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <span className="text-sm font-black text-white tracking-widest">V</span>
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
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 text-[13px] font-medium transition-all duration-200 group/navlink",
                      isActive
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <>
                      {link.label}
                      {isActive ? (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--accent)] animate-[underline-grow_300ms_ease-out]" />
                      ) : (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full bg-[var(--accent)] group-hover/navlink:w-4 transition-all duration-300" />
                      )}
                    </>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-[var(--muted)] hover:text-[var(--foreground)]"
                onClick={() => setSearchOpen(true)}
                aria-label={t("header.search")}
              >
                <Search className="w-[18px] h-[18px]" />
              </Button>

              <Link
                href="/checkout"
                aria-label={t("header.cart")}
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className: cn(
                    "relative rounded-full text-[var(--muted)] hover:text-[var(--foreground)] !overflow-visible",
                    cartBounce && "animate-bounce-subtle"
                  ),
                })}
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {hasHydrated && itemCount > 0 ? (
                  <span className="animate-fade-in-up absolute -top-0.5 -right-0.5 z-10 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-[var(--accent-strong)] text-white shadow-sm">
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
                onClick={toggleMobileMenu}
                aria-label={isMobileMenuOpen ? t("header.menuClose") : t("header.menuOpen")}
              >
                {isMobileMenuOpen ? (
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

    <div
      className={cn(
        "fixed inset-0 z-[65] lg:hidden bg-white/98 backdrop-blur-2xl transition-all duration-300",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex flex-col h-full px-6 pt-24 pb-12 overflow-y-auto transition-transform duration-300",
          isMobileMenuOpen ? "translate-y-0" : "-translate-y-4"
        )}
      >
        <nav className="flex flex-col gap-1">
          {navLinks.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-4 rounded-2xl text-base font-medium transition-colors hover:bg-black/[0.03] active:bg-black/[0.06]",
                    isActive ? "text-[var(--foreground)] bg-black/[0.04]" : "text-[var(--foreground)]"
                  )}
                  onClick={closeMobileMenu}
                >
                  {link.label}
                  <ArrowRight className="w-4 h-4 text-[var(--muted-faint)]" />
                </Link>
                {i < navLinks.length - 1 ? (
                  <div className="mx-4 h-px bg-black/[0.04]" />
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <Link
            href="/#productos"
            onClick={closeMobileMenu}
            className={buttonVariants({ size: "lg", className: "w-full gap-2 flex btn-interact" })}
          >
            {t("hero.ctaPrimary")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  </>
  );
}
