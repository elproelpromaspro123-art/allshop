"use client";

import { useEffect } from "react";

const SELECTORS =
  ".scroll-reveal, .scroll-reveal-up, .scroll-reveal-down, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale";

export function useScrollRevealGlobal() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let raf1 = 0;
    let raf2 = 0;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        document
          .querySelectorAll(SELECTORS)
          .forEach((el) => el.classList.add("revealed"));
        return;
      }

      // Wait two frames so React has committed hydration before we touch classNames.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("revealed");
                  observer?.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
          );

          document.querySelectorAll(SELECTORS).forEach((el) => {
            if (!el.classList.contains("revealed")) {
              observer!.observe(el);
            }
          });
        });
      });
    };

    const scheduleInit = () => {
      const run = () => {
        if (cancelled) return;
        if (document.readyState !== "complete") {
          timeoutId = window.setTimeout(run, 50);
          return;
        }
        init();
      };

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(run, { timeout: 1500 });
      } else {
        timeoutId = (window as Window).setTimeout(run, 150);
      }
    };

    scheduleInit();

    return () => {
      cancelled = true;
      if (idleId !== null) {
        window.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      observer?.disconnect();
    };
  }, []);
}

export function ScrollRevealInit() {
  useScrollRevealGlobal();
  return null;
}
