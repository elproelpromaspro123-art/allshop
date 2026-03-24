"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";
import {
  getRouteChromeConfig,
  isFloatingVisible,
} from "@/lib/route-chrome";
import { ENGAGEMENT_WIDGET_DELAY_MS } from "@/lib/polling-intervals";
import { useCartStore } from "@/store/cart";
import { usePathname } from "next/navigation";

const CatalogUpdateWatcher = dynamic(
  () => import("@/components/CatalogUpdateWatcher").then((mod) => mod.CatalogUpdateWatcher),
  { ssr: false }
);

const WhatsAppButton = dynamic(
  () => import("@/components/WhatsAppButton").then((mod) => mod.WhatsAppButton),
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

interface DeferredFloatingUtilitiesProps {
  chrome: ReturnType<typeof getRouteChromeConfig>;
  hasActiveMobileCartShortcut: boolean;
  isMobileViewport: boolean;
}

function DeferredFloatingUtilities({
  chrome,
  hasActiveMobileCartShortcut,
  isMobileViewport,
}: DeferredFloatingUtilitiesProps) {
  const [engagementReady, setEngagementReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isActive = true;
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const enableEngagement = () => {
      if (!isActive) return;
      setEngagementReady(true);
    };

    const handleInteraction = () => enableEngagement();

    timeoutId = window.setTimeout(enableEngagement, ENGAGEMENT_WIDGET_DELAY_MS);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(enableEngagement, {
        timeout: ENGAGEMENT_WIDGET_DELAY_MS,
      });
    }

    window.addEventListener("pointerdown", handleInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("scroll", handleInteraction, {
      once: true,
      passive: true,
    });

    return () => {
      isActive = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
    };
  }, []);

  return (
    <>
      {chrome.showCatalogWatcher && engagementReady ? (
        <CatalogUpdateWatcher />
      ) : null}
      {isFloatingVisible(chrome.supportAssistantVisibility, isMobileViewport) &&
      !hasActiveMobileCartShortcut &&
      engagementReady ? (
        <WhatsAppButton />
      ) : null}
      {chrome.showExitIntentPopup && engagementReady ? <ExitIntentPopup /> : null}
      {isFloatingVisible(chrome.recentPurchaseVisibility, isMobileViewport) &&
      !hasActiveMobileCartShortcut &&
      engagementReady ? (
        <RecentPurchaseToast />
      ) : null}
      {hasActiveMobileCartShortcut ? <MobileCartShortcut /> : null}
      {isFloatingVisible(chrome.backToTopVisibility, isMobileViewport) &&
      !hasActiveMobileCartShortcut &&
      engagementReady ? (
        <BackToTop />
      ) : null}
    </>
  );
}

export function ClientLayoutUtilities() {
  const pathname = usePathname();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const items = useCartStore((store) => store.items);
  const hasCartHydrated = useCartStore((store) => store.hasHydrated);
  const chrome = getRouteChromeConfig(pathname);
  const hasActiveMobileCartShortcut =
    chrome.showMobileCartShortcut &&
    isMobileViewport &&
    hasCartHydrated &&
    items.some((item) => item.quantity > 0);

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
      <DeferredFloatingUtilities
        key={pathname || "/"}
        chrome={chrome}
        hasActiveMobileCartShortcut={hasActiveMobileCartShortcut}
        isMobileViewport={isMobileViewport}
      />
    </>
  );
}
