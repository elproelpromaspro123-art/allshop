"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Handles scroll restoration and back button navigation behavior.
 * Ensures proper scroll position when navigating back/forward.
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const scrollPositionRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const lastScrollRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isManualScrollRef = useRef(false);

  useEffect(() => {
    // Restore scroll position on mount (initial load)
    try {
      const saved = sessionStorage.getItem(`scroll:${window.location.pathname}`);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        window.scrollTo(x, y);
      }
    } catch {
      // Ignore sessionStorage errors
    }

    let scrollTimeout: NodeJS.Timeout | undefined;

    const handleScroll = () => {
      isManualScrollRef.current = true;
      lastScrollRef.current = { x: window.scrollX, y: window.scrollY };

      // Debounce scroll position saving
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        try {
          sessionStorage.setItem(
            `scroll:${window.location.pathname}`,
            JSON.stringify({ x: window.scrollX, y: window.scrollY })
          );
        } catch {
          // Ignore sessionStorage errors
        }
        isManualScrollRef.current = false;
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    // Scroll to top on route change (but not on back/forward)
    const savedScroll = scrollPositionRef.current.get(pathname);
    
    if (savedScroll) {
      // Restore saved scroll position for this route
      window.scrollTo(savedScroll.x, savedScroll.y);
    } else {
      // No saved position - check if we have session storage
      try {
        const saved = sessionStorage.getItem(`scroll:${pathname}`);
        if (saved) {
          const { x, y } = JSON.parse(saved);
          window.scrollTo(x, y);
        } else {
          // First visit to this route - scroll to top
          window.scrollTo(0, 0);
        }
      } catch {
        window.scrollTo(0, 0);
      }
    }

    // Save current position before leaving
    const currentPosition = { x: window.scrollX, y: window.scrollY };
    scrollPositionRef.current.set(pathname, currentPosition);

    return () => {
      // Save position when leaving - use captured pathname
      const currentPathname = pathname;
      const scrollPos = { x: window.scrollX, y: window.scrollY };
      scrollPositionRef.current.set(currentPathname, scrollPos);
    };
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      // Let the browser handle native scroll restoration for back/forward
      // but ensure we restore properly after a short delay
      setTimeout(() => {
        try {
          const saved = sessionStorage.getItem(`scroll:${window.location.pathname}`);
          if (saved) {
            const { x, y } = JSON.parse(saved);
            window.scrollTo(x, y);
          }
        } catch {
          // Ignore sessionStorage errors
        }
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}

export function ScrollRestoration() {
  useScrollRestoration();
  return null;
}
