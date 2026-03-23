import { test, expect, type Page } from "@playwright/test";

const adminPathToken = process.env.CATALOG_ADMIN_PATH_TOKEN?.trim() || "";
const cookieConsentState = JSON.stringify({
  analytics: false,
  marketing: false,
  acceptedAt: "2026-01-01T00:00:00.000Z",
});
const persistedCartState = JSON.stringify({
  state: {
    items: [
      {
        productId: "persisted-airpods",
        slug: "airpods-pro-3",
        name: "Airpods Pro 3",
        price: 159900,
        image: "/productos/airpods-pro-3/1.webp",
        variant: null,
        quantity: 1,
        freeShipping: false,
        shippingCost: null,
        stockLocation: "nacional",
      },
    ],
    hasHydrated: true,
  },
  version: 2,
});

function wirePageGuards(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("requestfailed", (request) => {
    const failureText = request.failure()?.errorText || "failed";
    const url = request.url();

    if (failureText === "net::ERR_ABORTED") {
      return;
    }

    requestFailures.push(`${request.method()} ${url} :: ${failureText}`);
  });

  return () => {
    expect(pageErrors, "page errors").toEqual([]);
    expect(consoleErrors, "console errors").toEqual([]);
    expect(requestFailures, "request failures").toEqual([]);
  };
}

async function ensureAdminSession(page: Page) {
  if (!adminPathToken) return;

  const response = await page.request.post("/api/internal/panel/session", {
    data: { token: adminPathToken },
    headers: {
      Origin: "http://127.0.0.1:3100",
      Referer: "http://127.0.0.1:3100/panel-privado",
    },
  });

  expect(response.ok()).toBeTruthy();

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.some((cookie) => cookie.name === "catalog_admin_session");
    })
    .toBe(true);
}

async function seedPersistedCart(page: Page) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("vortixy-cart", value);
  }, persistedCartState);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem("vortixy_cookie_consent", value);
  }, cookieConsentState);
});

async function getVisibleFixedTestIds(page: Page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("body *"));

    return nodes
      .map((node) => {
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const testId = node.getAttribute("data-testid");

        return {
          position: style.position,
          visible:
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity || 1) > 0 &&
            rect.width > 0 &&
            rect.height > 0,
          testId,
        };
      })
      .filter((item) => item.position === "fixed" && item.visible)
      .map((item) => item.testId)
      .filter((value): value is string => Boolean(value));
  });
}

test("home renders cleanly", async ({ page }) => {
  const assertClean = wirePageGuards(page);

  await page.goto("/");

  await expect(page.locator('a[href^="/producto/"]').first()).toBeVisible();
  assertClean();
});

test("category renders cleanly", async ({ page }) => {
  const assertClean = wirePageGuards(page);

  await page.goto("/categoria/tecnologia");

  await expect(page.locator('a[href^="/producto/"]').first()).toBeVisible();
  assertClean();
});

test("product route keeps a single mobile CTA and loads without client errors", async ({ page }, testInfo) => {
  const assertClean = wirePageGuards(page);

  await page.goto("/producto/airpods-pro-3");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect(page.getByTestId("product-sticky-bar")).toBeVisible();
    await expect(page.getByTestId("product-purchase-panel")).toBeVisible();
    await expect.poll(() => getVisibleFixedTestIds(page)).toEqual(["product-sticky-bar"]);
  }

  assertClean();
});

test("product ad landing keeps buy-now primary even with persisted cart", async ({ page }, testInfo) => {
  const assertClean = wirePageGuards(page);

  await seedPersistedCart(page);
  await page.goto("/producto/airpods-pro-3?fbclid=meta-ad-test");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect(page.getByTestId("product-sticky-primary")).toContainText(/comprar|ahora/i);
    await expect(page.getByTestId("product-sticky-bag-shortcut")).toBeVisible();
  } else {
    await expect(page.getByTestId("product-buy-now-desktop")).toBeVisible();
    await expect(page.getByTestId("product-checkout-shortcut")).toBeVisible();
  }

  assertClean();
});

test("checkout route stays focused and keeps one sticky action on mobile", async ({ page }, testInfo) => {
  const assertClean = wirePageGuards(page);

  await page.goto("/producto/airpods-pro-3");

  if (testInfo.project.name === "mobile-390") {
    await page.getByTestId("product-sticky-primary").click();
  } else {
    await page.getByTestId("product-add-to-cart-desktop").click();
    await page.getByTestId("product-checkout-shortcut").click();
  }

  await page.waitForURL("**/checkout");

  await expect(page.getByTestId("checkout-summary")).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect(page.getByTestId("checkout-sticky-bar")).toBeVisible();
    await expect.poll(() => getVisibleFixedTestIds(page)).toEqual(["checkout-sticky-bar"]);
  }

  assertClean();
});

test("dashboard renders without storefront chrome collisions", async ({ page }, testInfo) => {
  test.skip(!adminPathToken, "CATALOG_ADMIN_PATH_TOKEN no esta configurado para smoke auth.");
  const assertClean = wirePageGuards(page);

  await ensureAdminSession(page);
  await page.goto("/panel-privado/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect.poll(() => getVisibleFixedTestIds(page)).toEqual([]);
  }

  assertClean();
});

test("inventory renders without storefront chrome collisions", async ({ page }, testInfo) => {
  test.skip(!adminPathToken, "CATALOG_ADMIN_PATH_TOKEN no esta configurado para smoke auth.");
  const assertClean = wirePageGuards(page);

  await ensureAdminSession(page);
  await page.goto("/panel-privado/inventory");

  await expect(page.getByRole("heading", { name: "Inventario" })).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect.poll(() => getVisibleFixedTestIds(page)).toEqual([]);
  }

  assertClean();
});

test("orders renders without storefront chrome collisions", async ({ page }, testInfo) => {
  test.skip(!adminPathToken, "CATALOG_ADMIN_PATH_TOKEN no esta configurado para smoke auth.");
  const assertClean = wirePageGuards(page);

  await ensureAdminSession(page);
  await page.goto("/panel-privado/orders");

  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

  if (testInfo.project.name === "mobile-390") {
    await expect.poll(() => getVisibleFixedTestIds(page)).toEqual([]);
  }

  assertClean();
});
