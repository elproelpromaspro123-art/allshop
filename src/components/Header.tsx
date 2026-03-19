"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded Header client component.
 * Keeping this split out helps reduce main bundle cost on first paint.
 */
const HeaderLazy = dynamic(
  () => import("./HeaderClient").then((mod) => ({ default: mod.HeaderClient })),
  {
    loading: () => (
      <header className="sticky top-0 z-[70] px-0 sm:px-3 pt-0">
        <div className="bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 sm:h-[4.5rem] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-strong)] flex items-center justify-center">
                  <span className="text-sm font-extrabold text-white">V</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                  Vortixy
                </span>
              </div>
              <div className="h-8 w-8" />
            </div>
          </div>
        </div>
      </header>
    ),
  },
);

export function Header() {
  return <HeaderLazy />;
}
