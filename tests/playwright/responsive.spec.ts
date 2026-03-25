import { test, expect } from "@playwright/test";

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

test("home page keeps visible content inside the viewport", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const overflowInfo = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const bodyScrollWidth = body.scrollWidth;
    const htmlScrollWidth = html.scrollWidth;
    const viewportWidth = window.innerWidth;
    const overflowingElements: { tag: string; className: string; rect: { left: number; right: number; width: number; top: number; height: number } }[] = [];
    const isClippedByAncestor = (node: HTMLElement) => {
      let current: HTMLElement | null = node;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowX = `${style.overflowX} ${style.overflow}`.toLowerCase();

        if (overflowX.includes("hidden") || overflowX.includes("clip")) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    };

    document.querySelectorAll("body *").forEach((el) => {
      const node = el as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      const isDecorativeAbsolute =
        style.position === "absolute" && style.pointerEvents === "none";

      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        isDecorativeAbsolute ||
        isClippedByAncestor(node)
      ) {
        return;
      }

      if (rect.right > viewportWidth + 2 || rect.left < -2) {
        overflowingElements.push({
          tag: el.tagName,
          className: node.className?.toString().slice(0, 120) || "",
          rect: { left: rect.left, right: rect.right, width: rect.width, top: rect.top, height: rect.height },
        });
      }
    });

    return {
      viewportWidth,
      bodyScrollWidth,
      htmlScrollWidth,
      hasHorizontalScroll: bodyScrollWidth > viewportWidth || htmlScrollWidth > viewportWidth,
      overflowingCount: overflowingElements.length,
      overflowingElements: overflowingElements.slice(0, 10),
    };
  });

  console.log("Mobile overflow diagnostic:", JSON.stringify(overflowInfo, null, 2));

  expect(overflowInfo.hasHorizontalScroll, "Page should not have horizontal scroll on mobile").toBe(false);
  expect(overflowInfo.overflowingCount, "No elements should overflow viewport horizontally").toBe(0);
});

test("spotlight card renders correctly across viewports", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const spotlightInfo = await page.getByTestId("home-spotlight-card").evaluate((element) => {
    const viewportWidth = window.innerWidth;
    const spotlightPanel = element as HTMLElement;

    const panelRect = spotlightPanel.getBoundingClientRect();
    const gridContainer = spotlightPanel.querySelector(".grid");
    const gridRect = gridContainer?.getBoundingClientRect();

    const gridChildren = gridContainer
      ? Array.from(gridContainer.children).map((child) => {
          const rect = child.getBoundingClientRect();
          return {
            tag: child.tagName,
            className: (child as HTMLElement).className?.toString().slice(0, 100) || "",
            rect: {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              top: Math.round(rect.top),
              height: Math.round(rect.height),
            },
            overflows: rect.right > viewportWidth + 2,
          };
        })
      : [];

    // Check the image area
    const imageContainer = spotlightPanel.querySelector('[class*="aspect-square"]');
    const imageRect = imageContainer?.getBoundingClientRect();

    return {
      viewportWidth,
      panelRect: {
        left: Math.round(panelRect.left),
        right: Math.round(panelRect.right),
        width: Math.round(panelRect.width),
      },
      panelOverflows: panelRect.right > viewportWidth + 2,
      gridRect: gridRect
        ? {
            left: Math.round(gridRect.left),
            right: Math.round(gridRect.right),
            width: Math.round(gridRect.width),
            display: getComputedStyle(gridContainer!).display,
            gridTemplateColumns: getComputedStyle(gridContainer!).gridTemplateColumns,
          }
        : null,
      gridChildren,
      imageRect: imageRect
        ? {
            left: Math.round(imageRect.left),
            right: Math.round(imageRect.right),
            width: Math.round(imageRect.width),
          }
        : null,
    };
  });

  console.log("Spotlight diagnostic:", JSON.stringify(spotlightInfo, null, 2));

  expect(spotlightInfo.panelOverflows, "Spotlight panel should not overflow viewport").toBe(false);
  for (const child of spotlightInfo.gridChildren || []) {
    expect(child.overflows, `Grid child should not overflow: ${child.className}`).toBe(false);
  }
});

test("check all sections for responsive issues on mobile", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const report = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const issues: string[] = [];

    // Check body scroll width
    if (document.body.scrollWidth > viewportWidth) {
      issues.push(`Body scrollWidth (${document.body.scrollWidth}) > viewport (${viewportWidth})`);
    }

    // Check all visible sections
    document.querySelectorAll("section").forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      if (rect.width > viewportWidth + 2) {
        issues.push(`Section ${i} width (${rect.width}) exceeds viewport (${viewportWidth})`);
      }
      if (rect.right > viewportWidth + 2) {
        issues.push(`Section ${i} right (${rect.right}) exceeds viewport (${viewportWidth})`);
      }
    });

    // Check all images
    document.querySelectorAll("img").forEach((img, i) => {
      const rect = img.getBoundingClientRect();
      if (rect.right > viewportWidth + 2 && rect.width > 0) {
        issues.push(`Image ${i} right (${Math.round(rect.right)}) exceeds viewport (${viewportWidth}): ${img.src.slice(-60)}`);
      }
    });

    // Check for fixed elements that might overlap
    document.querySelectorAll('[class*="fixed"], [class*="sticky"]').forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 2) {
        issues.push(`Fixed/sticky element ${i} right (${Math.round(rect.right)}) exceeds viewport (${viewportWidth})`);
      }
    });

    // Check the product grid
    const productGrid = document.getElementById("productos-grid");
    if (productGrid) {
      const rect = productGrid.getBoundingClientRect();
      if (rect.right > viewportWidth + 2) {
        issues.push(`Product grid right (${Math.round(rect.right)}) exceeds viewport (${viewportWidth})`);
      }
    }

    return {
      viewportWidth,
      bodyScrollWidth: document.body.scrollWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      issues,
    };
  });

  console.log("Responsive report:", JSON.stringify(report, null, 2));

  expect(report.issues, `Found ${report.issues.length} responsive issues`).toEqual([]);
});
