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

  const menuRef = useRef<HTMLDivElement>(null);
  const prevItemCountRef = useRef(itemCount);
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (hasHydrated && itemCount > prevItemCountRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Cart bounce is intentional animation trigger, not cascading render
      setCartBounce(true);
      timer = setTimeout(() => setCartBounce(false), 600);
    }
    prevItemCountRef.current = itemCount;
    return () => {
      if (timer) clearTimeout(timer);
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
    [t],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;

      const focusables = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
      return;
    }
    setMobileMenuPath(pathname);
    setMobileMenuOpen(true);
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
          "sticky top-0 z-[70] px-0 sm:px-3 transition-all duration-500 ease-out",
          scrolled ? "pt-0 sm:pt-2.5" : "pt-0",
        )}
      >
        <div
          className={cn(
            "transition-all duration-500 ease-out",
            scrolled
              ? "bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(10,15,30,0.08)] ring-1 ring-black/[0.04] sm:rounded-2xl"
              : "bg-transparent",
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
                  <div className="absolute inset-0 rounded-xl blur-lg transition-opacity duration-300 group-hover:opacity-60 opacity-0 bg-[var(--accent)]/40" />
                  <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dim)] flex items-center justify-center shadow-[0_2px_8px_rgba(0,143,88,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                    <span className="text-sm font-black text-white tracking-widest">
                      V
                    </span>
                  </div>
                </div>
                <span
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
                        "relative px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200",
                        isActive
                          ? "text-[var(--accent-strong)] bg-[var(--accent-surface)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-black/[0.03]",
                      )}
                    >
                      {link.label}
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
                      "relative rounded-full text-[var(--muted)] hover:text-[var(--foreground)] !overflow-visible transition-all duration-300",
                      cartBounce && "scale-110",
                    ),
                  })}
                >
                  <ShoppingBag className="w-[18px] h-[18px]" />
                  {hasHydrated && itemCount > 0 ? (
                    <span className="animate-fade-in-up absolute -top-1 -right-1 z-10 min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.4)] font-semibold">
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
                  className="lg:hidden rounded-full text-[var(--muted)] hover:text-[var(--foreground)] min-h-11 min-w-11"
                  onClick={toggleMobileMenu}
                  aria-label={
                    isMobileMenuOpen
                      ? t("header.menuClose")
                      : t("header.menuOpen")
                  }
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-dialog"
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
        id="mobile-menu-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={cn(
          "fixed inset-0 z-[65] lg:hidden bg-white/98 backdrop-blur-2xl transition-all duration-300",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div
          ref={menuRef}
          className={cn(
            "flex flex-col h-full px-6 pt-24 pb-12 overflow-y-auto transition-transform duration-300",
            isMobileMenuOpen ? "translate-y-0" : "-translate-y-4",
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
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all duration-200 hover:bg-[var(--accent-surface)] active:bg-[var(--accent-surface)]",
                      isActive
                        ? "text-[var(--foreground)] bg-black/[0.04]"
                        : "text-[var(--foreground)]",
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
              className={buttonVariants({
                size: "lg",
                className: "w-full gap-2 flex btn-interact",
              })}
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
