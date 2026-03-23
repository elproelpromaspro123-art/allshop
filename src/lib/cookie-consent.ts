export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string | null;
}

export const COOKIE_CONSENT_STORAGE_KEY = "vortixy_cookie_consent";

export const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  analytics: false,
  marketing: false,
  acceptedAt: null,
};

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }

    return {
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      acceptedAt:
        typeof parsed.acceptedAt === "string" || parsed.acceptedAt === null
          ? parsed.acceptedAt
          : null,
    };
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(consent),
  );
}

export function hasAnalyticsConsent(consent: CookieConsent | null): boolean {
  return Boolean(consent?.analytics);
}

export function hasMarketingConsent(consent: CookieConsent | null): boolean {
  return Boolean(consent?.marketing);
}
