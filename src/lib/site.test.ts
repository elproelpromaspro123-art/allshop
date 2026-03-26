import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBaseUrl, toAbsoluteUrl, WHATSAPP_PHONE } from "./site";

vi.mock("@/lib/env", () => ({
  getConfiguredAppUrl: vi.fn(),
}));

import { getConfiguredAppUrl } from "@/lib/env";

describe("getBaseUrl", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns configured URL", () => {
    vi.mocked(getConfiguredAppUrl).mockReturnValue("https://example.com");
    expect(getBaseUrl()).toBe("https://example.com");
  });

  it("returns default URL when not configured", () => {
    vi.mocked(getConfiguredAppUrl).mockReturnValue(null);
    expect(getBaseUrl()).toBe("https://vortixy.net");
  });

  it("removes trailing slashes", () => {
    vi.mocked(getConfiguredAppUrl).mockReturnValue("https://example.com///");
    expect(getBaseUrl()).toBe("https://example.com");
  });
});

describe("toAbsoluteUrl", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getConfiguredAppUrl).mockReturnValue("https://example.com");
  });

  it("converts relative path to absolute", () => {
    expect(toAbsoluteUrl("/producto/test")).toBe("https://example.com/producto/test");
  });

  it("adds leading slash if missing", () => {
    expect(toAbsoluteUrl("producto/test")).toBe("https://example.com/producto/test");
  });

  it("handles root path", () => {
    expect(toAbsoluteUrl("/")).toBe("https://example.com/");
  });
});

describe("WHATSAPP_PHONE", () => {
  it("contains country code", () => {
    expect(WHATSAPP_PHONE).toBe("573142377202");
    expect(WHATSAPP_PHONE.startsWith("57")).toBe(true);
  });
});