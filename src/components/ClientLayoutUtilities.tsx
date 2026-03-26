"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";
import {
  getRouteChromeConfig,
  isFloatingVisible,
} from "@/lib/route-chrome";
import { useCartStore } from "@/store/cart";
import { usePathname } from "next/navigation";

const CatalogUpdateWatcher = dynamic(
  () => import("@/components/CatalogUpdateWatcher").then((mod) => mod.CatalogUpdateWatcher),
  { ssr: false }
);

const AIChatButton = dynamic(
  () => import("@/components/AIChatButton").then((mod) => mod.AIChatButton),
  { ssr: false }
);

const ExitIntentPopup = dynamic(
  () => import("@/components/ExitIntentPopup").then((mod) => mod.ExitIntentPopup),
  { ssr: false }
);

const RecentPurchaseToast = dynamic(
  () => import("@/components/RecentPurchaseToast").then((mod) => mod.RecentPurchaseToast),
  { ssr: false }
);

const ScrollProgressBar = dynamic(
  () => import("@/components/ScrollProgressBar").then((mod) => mod.ScrollProgressBar),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/BackToTop").then((mod) => mod.BackToTop),
  { ssr: false }
);

const AppBootLoader = dynamic(
  () => import("@/components/AppBootLoader").then((mod) => mod.AppBootLoader),
  { ssr: false }
);

const MobileCartShortcut = dynamic(
  () => import("@/components/MobileCartShortcut").then((mod) => mod.MobileCartShortcut),
  { ssr: false }
);

const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false },
);

export function ClientLayoutUtilities() {
  const pathname = usePathname();
  const [isMobileViewport, setIsMobileViewport] = useState<boolean | null>(
    null,
  );
  const items = useCartStore((store) => store.items);
  const hasCartHydrated = useCartStore((store) => store.hasHydrated);
  const chrome = getRouteChromeConfig(pathname);
  const isViewportResolved = isMobileViewport !== null;
  const isMobile = isMobileViewport === true;
  const hasCartItems = items.some((item) => item.quantity > 0);
  const hasActiveMobileCartShortcut =
    chrome.showMobileCartShortcut &&
    isMobile &&
    hasCartHydrated &&
    hasCartItems;
  const shouldShowFloatingHelpers =
    isViewportResolved && !hasActiveMobileCartShortcut;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  return (
    <>
      {chrome.showScrollProgressBar ? <ScrollProgressBar /> : null}
      <AppBootLoader />
      <ScrollRevealObserver />
      {chrome.showCatalogWatcher ? <CatalogUpdateWatcher /> : null}
      {shouldShowFloatingHelpers &&
      isFloatingVisible(chrome.supportAssistantVisibility, isMobile) ? (
        <AIChatButton />
      ) : null}
      {chrome.showExitIntentPopup ? <ExitIntentPopup /> : null}
      {shouldShowFloatingHelpers &&
      isFloatingVisible(chrome.recentPurchaseVisibility, isMobile) ? (
        <RecentPurchaseToast />
      ) : null}
      {hasActiveMobileCartShortcut ? (
        <MobileCartShortcut />
      ) : null}
      <CartDrawer />
      {shouldShowFloatingHelpers &&
      isFloatingVisible(chrome.backToTopVisibility, isMobile) ? (
        <BackToTop />
      ) : null}
    </>
  );
}
