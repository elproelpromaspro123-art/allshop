import { beforeEach, describe, expect, it } from "vitest";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  DEFAULT_COOKIE_CONSENT,
  hasAnalyticsConsent,
  hasMarketingConsent,
  readCookieConsent,
  writeCookieConsent,
} from "./cookie-consent";

describe("cookie-consent helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when consent was never stored", () => {
    expect(readCookieConsent()).toBeNull();
    expect(hasAnalyticsConsent(readCookieConsent())).toBe(false);
    expect(hasMarketingConsent(readCookieConsent())).toBe(false);
  });

  it("persists and reads consent consistently", () => {
    const consent = {
      analytics: true,
      marketing: false,
      acceptedAt: "2026-03-22T00:00:00.000Z",
    };

    writeCookieConsent(consent);

    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toContain(
      "\"analytics\":true",
    );
    expect(readCookieConsent()).toEqual(consent);
    expect(hasAnalyticsConsent(readCookieConsent())).toBe(true);
    expect(hasMarketingConsent(readCookieConsent())).toBe(false);
  });

  it("rejects malformed storage payloads", () => {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify({
        analytics: "yes",
        marketing: 1,
      }),
    );

    expect(readCookieConsent()).toBeNull();
    expect(DEFAULT_COOKIE_CONSENT.analytics).toBe(false);
    expect(DEFAULT_COOKIE_CONSENT.marketing).toBe(false);
  });
});
