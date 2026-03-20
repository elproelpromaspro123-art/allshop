"use client";

import { useEffect, useRef } from "react";

/**
 * Sets up a global IntersectionObserver that adds the `.revealed`
 * class to every `.scroll-reveal` element when it enters the viewport.
 *
 * Must be rendered once in the layout (e.g., inside ClientLayoutUtilities).
 */
export function ScrollRevealObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // Fallback: reveal everything immediately
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        el.classList.add("revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: "0px 0px -60px 0px",
        threshold: 0.08,
      },
    );

    observerRef.current = observer;

    // Observe all existing scroll-reveal elements
    const observeAll = () => {
      document
        .querySelectorAll(
          ".scroll-reveal:not(.revealed), .scroll-reveal-up:not(.revealed), .scroll-reveal-down:not(.revealed), .scroll-reveal-left:not(.revealed), .scroll-reveal-right:not(.revealed), .scroll-reveal-scale:not(.revealed)",
        )
        .forEach((el) => observer.observe(el));
    };

    observeAll();

    // Re-observe after route transitions (Next.js soft navigations)
    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
