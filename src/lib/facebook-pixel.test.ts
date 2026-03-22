import { afterEach, describe, expect, it, vi } from "vitest";
import {
  event,
  normalizePixelId,
  pageview,
  trackConversion,
} from "@/lib/facebook-pixel";

describe("facebook pixel helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "fbq");
  });

  it("normalizes valid pixel ids", () => {
    expect(normalizePixelId(" 123456789012 ")).toBe("123456789012");
    expect(normalizePixelId("abc")).toBeNull();
  });

  it("tracks standard page views with Meta track", () => {
    const fbqMock = vi.fn();
    Object.assign(window, { fbq: fbqMock });

    expect(pageview()).toBe(true);
    expect(fbqMock).toHaveBeenCalledWith("track", "PageView");
  });

  it("uses trackCustom for non-standard events", () => {
    const fbqMock = vi.fn();
    Object.assign(window, { fbq: fbqMock });

    expect(event("PromoBannerClick", { slot: "hero" })).toBe(true);
    expect(fbqMock).toHaveBeenCalledWith("trackCustom", "PromoBannerClick", {
      slot: "hero",
    });
  });

  it("blocks invalid event names so __missing_event is not sent", () => {
    const fbqMock = vi.fn();
    Object.assign(window, { fbq: fbqMock });

    expect(event("   ")).toBe(false);
    expect(event("__missing_event")).toBe(false);
    expect(fbqMock).not.toHaveBeenCalled();
  });

  it("compacts conversion payloads before sending purchase events", () => {
    const fbqMock = vi.fn();
    Object.assign(window, { fbq: fbqMock });

    expect(
      trackConversion("Purchase", {
        value: 89000,
        content_ids: ["sku-1"],
      }),
    ).toBe(true);

    expect(fbqMock).toHaveBeenCalledWith("track", "Purchase", {
      value: 89000,
      currency: "COP",
      content_ids: ["sku-1"],
      content_type: "product",
    });
  });
});
