import { test, expect, type Page } from "@playwright/test";

const cookieConsentState = JSON.stringify({
  analytics: false,
  marketing: false,
  acceptedAt: "2026-01-01T00:00:00.000Z",
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("vortixy_cookie_consent", value);
  }, cookieConsentState);
});

test("deep diagnostic of spotlight overflow on mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Scroll to the spotlight section
  await page.evaluate(() => {
    const el = document.querySelector(".surface-panel-dark");
    if (el) el.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(500);

  const diagnostic = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const results: Record<string, unknown>[] = [];

    // Find the overflowing image container
    const imageWrapper = document.querySelector(
      '.rounded-\\[var\\(--product-image-radius-xl\\)\\].border.border-white\\/10.bg-white\\/\\[0\\.06\\]'
    );
    if (!imageWrapper) return { error: "Image wrapper not found" };

    // Walk up the DOM tree and collect computed styles
    let current: HTMLElement | null = imageWrapper as HTMLElement;
    let depth = 0;
    while (current && depth < 12) {
      const computed = window.getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      results.push({
        depth,
        tag: current.tagName,
        className: current.className?.toString().slice(0, 80) || "",
        rect: {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        },
        computed: {
          display: computed.display,
          width: computed.width,
          maxWidth: computed.maxWidth,
          minWidth: computed.minWidth,
          boxSizing: computed.boxSizing,
          overflow: computed.overflow,
          overflowX: computed.overflowX,
          position: computed.position,
          padding: computed.padding,
          flex: computed.flex,
          gridTemplateColumns: computed.gridTemplateColumns,
        },
      });
      current = current.parentElement;
      depth++;
    }

    return { viewportWidth, chain: results };
  });

  // eslint-disable-next-line no-console
  console.log("Deep diagnostic:", JSON.stringify(diagnostic, null, 2));
});

test("deep diagnostic of inner grid overflow", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const diagnostic = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;

    // Find all elements with overflow beyond viewport
    const overflowing: { tag: string; className: string; width: number; parentWidth: number; grandParentWidth: number }[] = [];

    document.querySelectorAll(".surface-panel-dark *").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 2) {
        const parent = el.parentElement;
        const grandParent = parent?.parentElement;
        overflowing.push({
          tag: el.tagName,
          className: (el as HTMLElement).className?.toString().slice(0, 100) || "",
          width: Math.round(rect.width),
          parentWidth: parent ? Math.round(parent.getBoundingClientRect().width) : 0,
          grandParentWidth: grandParent ? Math.round(grandParent.getBoundingClientRect().width) : 0,
        });
      }
    });

    // Find the grid inside the spotlight
    const grids = document.querySelectorAll(".surface-panel-dark .grid");
    const gridInfo = Array.from(grids).map((grid) => {
      const rect = grid.getBoundingClientRect();
      const computed = window.getComputedStyle(grid);
      const children = Array.from(grid.children).map((child) => {
        const childRect = child.getBoundingClientRect();
        const childComputed = window.getComputedStyle(child);
        return {
          className: (child as HTMLElement).className?.toString().slice(0, 80),
          width: Math.round(childRect.width),
          computedWidth: childComputed.width,
          computedMinWidth: childComputed.minWidth,
          computedMaxWidth: childComputed.maxWidth,
          computedFlex: childComputed.flex,
        };
      });

      return {
        className: (grid as HTMLElement).className?.toString().slice(0, 100),
        width: Math.round(rect.width),
        gridTemplateColumns: computed.gridTemplateColumns,
        display: computed.display,
        children,
      };
    });

    return { viewportWidth, overflowing, gridInfo };
  });

  // eslint-disable-next-line no-console
  console.log("Grid diagnostic:", JSON.stringify(diagnostic, null, 2));
});
