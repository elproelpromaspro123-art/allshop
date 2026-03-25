"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { SearchDialog } from "./SearchDialog";
import { SecurityBadge } from "./SecurityBadge";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";

export function HeaderClient() {
  const pathname = usePathname();
  const isAdminPanel = pathname.startsWith("/panel-privado");
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((store) => store.getItemCount());
  const hasHydrated = useCartStore((store) => store.hasHydrated);
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const prevItemCountRef = useRef(itemCount);
  const [cartBounce, setCartBounce] = useState(false);

  const isMobileMenuOpen = mobileMenuOpen && mobileMenuPath === pathname;
  const shouldShowCartBadge = isMounted && hasHydrated && itemCount > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag avoids SSR/client badge drift
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (hasHydrated && itemCount > prevItemCountRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bounce flag is an intentional animation trigger
      setCartBounce(true);
      timer = setTimeout(() => setCartBounce(false), 600);
    }
    prevItemCountRef.current = itemCount;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [hasHydrated, itemCount]);

  const navLinks = useMemo(
    () =>
      isAdminPanel
        ? [
            { href: "/panel-privado", label: "Control" },
            { href: "/panel-privado/dashboard", label: "Dashboard" },
            { href: "/panel-privado/orders", label: "Pedidos" },
            { href: "/panel-privado/inventory", label: "Inventario" },
            { href: "/", label: "Tienda" },
          ]
        : [
            { href: "/categoria/cocina", label: t("nav.kitchen") },
            { href: "/categoria/tecnologia", label: t("nav.tech") },
            { href: "/categoria/hogar", label: t("nav.home") },
            { href: "/categoria/belleza", label: t("nav.beauty") },
            { href: "/categoria/fitness", label: t("nav.fitness") },
            { href: "/seguimiento", label: t("footer.track") },
            { href: "/soporte#feedback-form", label: t("nav.feedback") },
          ],
    [isAdminPanel, t],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useScrollLock(isMobileMenuOpen);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isMobileMenuOpen || !menuRef.current) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
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
      <header className="sticky top-0 z-[70] px-0 sm:px-3">
        <div
          className="shell-header__surface"
          data-scrolled={scrolled}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[4.6rem] items-center justify-between gap-3 py-2.5 sm:min-h-[5rem]">
              <Link
                href="/"
                onClick={handleBrandClick}
                className="group flex min-w-0 items-center gap-3"
              >
                <div className="shell-brand-mark">
                  <span className="text-sm font-black tracking-[0.26em]">V</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.62rem] font-black uppercase tracking-[0.34em] text-slate-500">
                    Editorial Commerce
                  </p>
                  <p className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">
                    Vortixy
                  </p>
                </div>
              </Link>

              <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex">
                <nav className="shell-header__nav-rail">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="shell-header__nav-link"
                        data-active={isActive}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="hidden items-center gap-2 xl:flex">
                <SecurityBadge className="!rounded-full !border-[rgba(23,19,15,0.08)] !bg-white/68 !text-slate-700 !shadow-none" />
              </div>

              <div className="flex items-center gap-2">
                {!isAdminPanel ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className="shell-header__shortcut hidden md:inline-flex"
                      aria-label={t("header.search")}
                    >
                      <Search className="h-4 w-4 text-slate-700" />
                      <span className="text-xs font-semibold text-slate-700">
                        Buscar
                      </span>
                      <kbd>⌘K</kbd>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full border border-[rgba(23,19,15,0.08)] bg-white/72 text-slate-700 shadow-[0_12px_30px_rgba(23,19,15,0.05)] md:hidden"
                      onClick={() => setSearchOpen(true)}
                      aria-label={t("header.search")}
                    >
                      <Search className="h-[18px] w-[18px]" />
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={cn(
                        "relative gap-2 rounded-full border-[rgba(23,19,15,0.08)] bg-white/72 px-3.5 text-slate-800 shadow-[0_12px_30px_rgba(23,19,15,0.05)]",
                        cartBounce && "scale-[1.04]",
                      )}
                      aria-label={t("header.cart")}
                    >
                      <Link href="/checkout">
                        <ShoppingBag className="h-4 w-4" />
                        <span className="hidden text-xs font-semibold sm:inline">
                          Bolsa
                        </span>
                        {shouldShowCartBadge ? (
                          <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-slate-950 px-1.5 py-0.5 text-[0.65rem] font-black text-white">
                            {itemCount > 99 ? "99+" : itemCount}
                          </span>
                        ) : null}
                      </Link>
                    </Button>
                  </>
                ) : null}

                <div className="hidden lg:block">
                  <Button asChild size="sm" className="gap-1.5 px-5">
                    <Link href={isAdminPanel ? "/" : "/#productos"}>
                      {isAdminPanel ? "Ver tienda" : t("hero.ctaPrimary")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11 rounded-full border border-[rgba(23,19,15,0.08)] bg-white/72 text-slate-700 shadow-[0_12px_30px_rgba(23,19,15,0.05)] lg:hidden"
                  onClick={toggleMobileMenu}
                  aria-label={
                    isMobileMenuOpen ? t("header.menuClose") : t("header.menuOpen")
                  }
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-dialog"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {!isAdminPanel ? (
          <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
        ) : null}
      </header>

      {isMobileMenuOpen ? (
        <>
          <div
            className="fixed inset-0 z-[64] bg-[rgba(11,12,17,0.42)] backdrop-blur-md lg:hidden"
            onClick={closeMobileMenu}
          />
          <div
            id="mobile-menu-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed inset-y-0 right-0 z-[65] w-full max-w-[24rem] lg:hidden"
          >
            <div
              ref={menuRef}
              className="shell-header__drawer flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6"
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="editorial-kicker">Navegación Vortixy</div>
                  <div>
                    <p className="text-2xl font-black tracking-[-0.05em] text-slate-950">
                      Catálogo y soporte en una sola capa.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Accede rápido a categorías, seguimiento, feedback y al
                      flujo principal de compra.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-[rgba(23,19,15,0.08)] bg-white/80 text-slate-700"
                  onClick={closeMobileMenu}
                  aria-label={t("header.menuClose")}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mb-6 grid gap-2 rounded-[1.6rem] border border-[rgba(23,19,15,0.08)] bg-white/78 p-2 shadow-[0_18px_44px_rgba(23,19,15,0.06)]">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(true);
                    closeMobileMenu();
                  }}
                  className="flex items-center justify-between rounded-[1.1rem] px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-900">
                      Buscar productos
                    </span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    ⌘K
                  </span>
                </button>

                <div className="rounded-[1.1rem] border border-[rgba(23,19,15,0.08)] bg-[rgba(248,245,240,0.9)] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Pago contraentrega y soporte real
                      </p>
                      <p className="text-xs leading-5 text-slate-600">
                        Mantuvimos la promesa principal del storefront y la
                        llevamos a una navegación más clara.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "group flex items-center justify-between rounded-[1.2rem] border px-4 py-4 transition-all",
                        isActive
                          ? "border-[rgba(13,138,99,0.18)] bg-[rgba(13,138,99,0.08)] text-slate-950 shadow-[0_16px_38px_rgba(13,138,99,0.12)]"
                          : "border-[rgba(23,19,15,0.08)] bg-white/72 text-slate-800 shadow-[0_12px_32px_rgba(23,19,15,0.04)]",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Compass className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-semibold">{link.label}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 pt-8">
                <Button asChild size="lg" className="w-full gap-2">
                  <Link
                    href={isAdminPanel ? "/" : "/#productos"}
                    onClick={closeMobileMenu}
                  >
                    {isAdminPanel ? "Ver tienda" : t("hero.ctaPrimary")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {!isAdminPanel ? (
                  <Button asChild variant="outline" size="lg" className="w-full gap-2">
                    <Link href="/checkout" onClick={closeMobileMenu}>
                      Ir al checkout
                      <ShoppingBag className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
