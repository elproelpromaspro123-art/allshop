import { describe, expect, it } from "vitest";
import { getRouteChromeConfig } from "./route-chrome";

describe("route chrome", () => {
  it("keeps the mobile cart shortcut enabled on storefront browsing routes", () => {
    expect(getRouteChromeConfig("/").showMobileCartShortcut).toBe(true);
    expect(
      getRouteChromeConfig("/categoria/tecnologia").showMobileCartShortcut,
    ).toBe(true);
    expect(getRouteChromeConfig("/").supportAssistantVisibility).toBe(
      "desktop",
    );
    expect(getRouteChromeConfig("/").recentPurchaseVisibility).toBe("desktop");
  });

  it("disables the mobile cart shortcut on focused flows", () => {
    expect(getRouteChromeConfig("/checkout").showMobileCartShortcut).toBe(
      false,
    );
    expect(
      getRouteChromeConfig("/producto/airpods-pro-3").showMobileCartShortcut,
    ).toBe(false);
    expect(
      getRouteChromeConfig("/panel-privado/dashboard").showMobileCartShortcut,
    ).toBe(false);
  });
});
