"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AppLoadScreen } from "@/components/AppLoadScreen";

const INITIAL_MIN_DURATION = 200;
const RETURN_MIN_DURATION = 120;
const MAX_BOOT_DURATION = 4500;
const PHASES = [
  "Curando el catálogo y los accesos rápidos",
  "Ajustando la experiencia para tu pantalla",
  "Sincronizando soporte, carrito y navegación",
];

export function AppBootLoader() {
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
  const routePendingRef = useRef(false);
  const routeStartedAtRef = useRef(0);
  const releaseTimerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [bootReady, setBootReady] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const isBackNavigationRef = useRef(false);

  useEffect(() => {
    if (!visible) return;

    const interval = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % PHASES.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    let hasSeenBootLoader = false;

    try {
      hasSeenBootLoader = sessionStorage.getItem("vortixy_boot_seen") === "1";
    } catch {
      hasSeenBootLoader = false;
    }

    const minDuration = hasSeenBootLoader ? 360 : INITIAL_MIN_DURATION;

    const completeBoot = () => {
      if (cancelled) return;

      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, minDuration - elapsed);

      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }

      releaseTimerRef.current = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        setBootReady(true);
        try {
          sessionStorage.setItem("vortixy_boot_seen", "1");
        } catch {
          // ignore
        }
      }, remaining);
    };

    if (document.readyState === "complete") {
      completeBoot();
    } else {
      window.addEventListener("load", completeBoot, { once: true });
    }

    const fallback = window.setTimeout(completeBoot, MAX_BOOT_DURATION);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      window.removeEventListener("load", completeBoot);
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!bootReady) return;

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) return;

      const sameRoute =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (sameRoute && nextUrl.hash) return;
      if (sameRoute && nextUrl.hash === currentUrl.hash) return;

      isBackNavigationRef.current = false;
      routePendingRef.current = true;
      routeStartedAtRef.current = performance.now();
      setVisible(true);

      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }

      releaseTimerRef.current = window.setTimeout(() => {
        routePendingRef.current = false;
        setVisible(false);
      }, MAX_BOOT_DURATION);
    };

    const onPopState = () => {
      // Back/forward navigation - don't show loader, just restore scroll
      isBackNavigationRef.current = true;
      routePendingRef.current = false;
      // Don't show the loader for back navigation
      // The browser will handle scroll restoration natively
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [bootReady]);

  useEffect(() => {
    if (!bootReady) return;
    if (previousPathRef.current === pathname) return;

    previousPathRef.current = pathname;

    // If this is a back navigation, don't show the loader
    if (isBackNavigationRef.current) {
      isBackNavigationRef.current = false;
      routePendingRef.current = false;
      setVisible(false);
      return;
    }

    if (!routePendingRef.current) return;

    routePendingRef.current = false;

    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
    }

    const elapsed = performance.now() - routeStartedAtRef.current;
    const remaining = Math.max(0, RETURN_MIN_DURATION - elapsed);

    releaseTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, remaining);
  }, [pathname, bootReady]);

  if (!visible) return null;

  return <AppLoadScreen overlay phase={PHASES[phaseIndex]} />;
}
