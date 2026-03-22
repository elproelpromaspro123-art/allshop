const STANDARD_PIXEL_EVENTS = new Set([
  "AddPaymentInfo",
  "AddToCart",
  "AddToWishlist",
  "CompleteRegistration",
  "InitiateCheckout",
  "Lead",
  "PageView",
  "Purchase",
  "Search",
  "ViewContent",
]);

type PixelPayload = Record<string, unknown>;

type ConversionOptions = {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
};

function compactPayload(payload?: PixelPayload): PixelPayload | undefined {
  if (!payload) return undefined;

  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries);
}

function normalizeEventName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized || normalized === "__missing_event") return null;

  return normalized;
}

function getTrackMethod(name: string): "track" | "trackCustom" {
  return STANDARD_PIXEL_EVENTS.has(name) ? "track" : "trackCustom";
}

function dispatchEvent(name: unknown, options?: PixelPayload): boolean {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }

  const normalizedName = normalizeEventName(name);
  if (!normalizedName) {
    return false;
  }

  const payload = compactPayload(options);
  const trackMethod = getTrackMethod(normalizedName);

  if (payload) {
    window.fbq(trackMethod, normalizedName, payload);
    return true;
  }

  window.fbq(trackMethod, normalizedName);
  return true;
}

export function normalizePixelId(value: string | undefined): string | null {
  const normalized = String(value || "").trim();
  if (!/^\d{6,20}$/.test(normalized)) return null;
  return normalized;
}

export const FB_PIXEL_ID = normalizePixelId(
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
);

export function pageview() {
  return dispatchEvent("PageView");
}

export function event(name: string, options: PixelPayload = {}) {
  return dispatchEvent(name, options);
}

export function trackConversion(eventName: string, options?: ConversionOptions) {
  return dispatchEvent(eventName, {
    value: options?.value,
    currency: options?.currency || "COP",
    content_name: options?.content_name,
    content_ids: options?.content_ids,
    content_type: options?.content_type || "product",
    num_items: options?.num_items,
    ...options,
  });
}
