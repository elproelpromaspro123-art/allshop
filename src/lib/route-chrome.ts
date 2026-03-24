export type FloatingVisibility = "all" | "desktop" | "hidden";

export interface RouteChromeConfig {
  showAnnouncementBar: boolean;
  showFooter: boolean;
  showScrollProgressBar: boolean;
  showCatalogWatcher: boolean;
  showExitIntentPopup: boolean;
  showMobileCartShortcut: boolean;
  supportAssistantVisibility: FloatingVisibility;
  recentPurchaseVisibility: FloatingVisibility;
  backToTopVisibility: FloatingVisibility;
}

const DEFAULT_CHROME: RouteChromeConfig = {
  showAnnouncementBar: true,
  showFooter: true,
  showScrollProgressBar: true,
  showCatalogWatcher: true,
  showExitIntentPopup: true,
  showMobileCartShortcut: true,
  supportAssistantVisibility: "all",
  recentPurchaseVisibility: "all",
  backToTopVisibility: "all",
};

export function getRouteChromeConfig(pathname: string | null | undefined): RouteChromeConfig {
  const safePath = pathname || "/";
  const isCheckout = safePath === "/checkout";
  const isProduct = safePath.startsWith("/producto/");
  const isSupportFlow =
    safePath.startsWith("/seguimiento") ||
    safePath.startsWith("/soporte") ||
    safePath.startsWith("/orden/");
  const isAdmin = safePath.startsWith("/panel-privado");

  if (isAdmin) {
    return {
      showAnnouncementBar: false,
      showFooter: false,
      showScrollProgressBar: false,
      showCatalogWatcher: false,
      showExitIntentPopup: false,
      showMobileCartShortcut: false,
      supportAssistantVisibility: "hidden",
      recentPurchaseVisibility: "hidden",
      backToTopVisibility: "hidden",
    };
  }

  if (isCheckout) {
    return {
      showAnnouncementBar: false,
      showFooter: false,
      showScrollProgressBar: false,
      showCatalogWatcher: false,
      showExitIntentPopup: false,
      showMobileCartShortcut: false,
      supportAssistantVisibility: "hidden",
      recentPurchaseVisibility: "hidden",
      backToTopVisibility: "hidden",
    };
  }

  if (isProduct) {
    return {
      ...DEFAULT_CHROME,
      showExitIntentPopup: false,
      showCatalogWatcher: false,
      showMobileCartShortcut: false,
      supportAssistantVisibility: "desktop",
      recentPurchaseVisibility: "hidden",
      backToTopVisibility: "desktop",
    };
  }

  if (isSupportFlow) {
    return {
      ...DEFAULT_CHROME,
      showExitIntentPopup: false,
      showMobileCartShortcut: false,
      recentPurchaseVisibility: "desktop",
    };
  }

  return DEFAULT_CHROME;
}

export function isFloatingVisible(
  visibility: FloatingVisibility,
  isMobileViewport: boolean,
): boolean {
  if (visibility === "hidden") return false;
  if (visibility === "desktop" && isMobileViewport) return false;
  return true;
}
