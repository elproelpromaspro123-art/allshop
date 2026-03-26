"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent, useMemo, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Button } from "./ui/Button";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cart-ui";
import { useLanguage } from "@/providers/LanguageProvider";
import { SearchDialog } from "./SearchDialog";
import { SecurityBadge } from "./SecurityBadge";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWishlistStore } from "@/store/wishlist";
import {
  NavigationBrandLockup,
  NavigationDrawer,
  NavigationLinkRail,
  buildAdminNavigation,
  buildDrawerActions,
  buildDrawerShortcuts,
  buildStorefrontNavigation,
} from "@/components/navigation/SiteNavigation";

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
  const wishlistCount = useWishlistStore((store) => store.getItemCount());
  const wishlistHydrated = useWishlistStore((store) => store.hasHydrated);
  const openDrawer = useCartUiStore((store) => store.openDrawer);
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const prevItemCountRef = useRef(itemCount);
  const [cartBounce, setCartBounce] = useState(false);

  const navLinks = useMemo(
    () => (isAdminPanel ? buildAdminNavigation() : buildStorefrontNavigation(t)),
    [isAdminPanel, t],
  );
  const drawerShortcuts = useMemo(
    () => buildDrawerShortcuts(t, isAdminPanel),
    [isAdminPanel, t],
  );
  const drawerActions = useMemo(
    () => buildDrawerActions(t, isAdminPanel),
    [isAdminPanel, t],
  );

  const isMobileMenuOpen = mobileMenuOpen && mobileMenuPath === pathname;
  const shouldShowCartBadge = isMounted && hasHydrated && itemCount > 0;
  const shouldShowWishlistBadge =
    isMounted && wishlistHydrated && wishlistCount > 0;

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
        <div className="shell-header__surface" data-scrolled={scrolled}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[4.6rem] items-center justify-between gap-3 py-2.5 sm:min-h-[5rem]">
              <NavigationBrandLockup
                tone="light"
                onClick={handleBrandClick}
                className="shrink-0"
              />

              <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex">
                <NavigationLinkRail pathname={pathname} links={navLinks} />
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
                      className="relative hidden gap-2 rounded-full border-[rgba(23,19,15,0.08)] bg-white/72 px-3.5 text-slate-800 shadow-[0_12px_30px_rgba(23,19,15,0.05)] md:inline-flex"
                    >
                      <Link href="/favoritos" aria-label={t("header.favorites")}>
                        <Heart className="h-4 w-4" />
                        <span className="hidden text-xs font-semibold sm:inline">
                          {t("header.favorites")}
                        </span>
                        {shouldShowWishlistBadge ? (
                          <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[0.65rem] font-black text-white">
                            {wishlistCount > 99 ? "99+" : wishlistCount}
                          </span>
                        ) : null}
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="relative rounded-full border border-[rgba(23,19,15,0.08)] bg-white/72 text-slate-700 shadow-[0_12px_30px_rgba(23,19,15,0.05)] md:hidden"
                    >
                      <Link href="/favoritos" aria-label={t("header.favorites")}>
                        <Heart className="h-[18px] w-[18px]" />
                        {shouldShowWishlistBadge ? (
                          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-rose-600 px-1 py-0.5 text-[0.6rem] font-black text-white">
                            {wishlistCount > 9 ? "9+" : wishlistCount}
                          </span>
                        ) : null}
                      </Link>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "relative gap-2 rounded-full border-[rgba(23,19,15,0.08)] bg-white/72 px-3.5 text-slate-800 shadow-[0_12px_30px_rgba(23,19,15,0.05)]",
                        cartBounce && "scale-[1.04]",
                      )}
                      onClick={() => openDrawer("header")}
                      aria-label={t("header.cart")}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span className="hidden text-xs font-semibold sm:inline">
                        Bolsa
                      </span>
                      {shouldShowCartBadge ? (
                        <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-slate-950 px-1.5 py-0.5 text-[0.65rem] font-black text-white">
                          {itemCount > 99 ? "99+" : itemCount}
                        </span>
                      ) : null}
                    </Button>
                  </>
                ) : null}

                <div className="hidden lg:block">
                  <Button asChild size="sm" className="gap-1.5 px-5">
                    <Link href={isAdminPanel ? "/" : "/#productos"}>
                      {isAdminPanel ? "Ver tienda" : t("hero.ctaPrimary")}
                      <span className="text-sm leading-none">→</span>
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
          <NavigationDrawer
            actions={drawerActions}
            isAdminPanel={isAdminPanel}
            links={navLinks}
            menuRef={menuRef}
            onClose={closeMobileMenu}
            onOpenSearch={() => setSearchOpen(true)}
            pathname={pathname}
            shortcuts={drawerShortcuts}
          />
        </>
      ) : null}
    </>
  );
}
