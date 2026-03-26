/**
 * Network and URL utilities
 */

/**
 * Get base URL from window location
 */
export function getWindowBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if running in development
 */
export function isDevEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in production
 */
export function isProdEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in test
 */
export function isTestEnv(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Parse URL query parameters
 */
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Build URL with query parameters
 */
export function buildUrlWithParams(
  baseUrl: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

/**
 * Get UTM parameters from current URL
 */
export function getUtmParams(search: string): {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
} {
  const params = parseQueryParams(search);
  return {
    source: params.utm_source || null,
    medium: params.utm_medium || null,
    campaign: params.utm_campaign || null,
    content: params.utm_content || null,
    term: params.utm_term || null,
  };
}

/**
 * Check if page was accessed via Facebook click
 */
export function isFromFacebook(search: string): boolean {
  const params = parseQueryParams(search);
  return !!(params.fbclid);
}

/**
 * Check if page was accessed via Google
 */
export function isFromGoogle(search: string): boolean {
  const params = parseQueryParams(search);
  return !!(params.gclid);
}

/**
 * Get referrer information
 */
export function getReferrerInfo(): {
  hostname: string | null;
  isInternal: boolean;
  isFacebook: boolean;
  isGoogle: boolean;
} {
  if (typeof document === "undefined") {
    return { hostname: null, isInternal: false, isFacebook: false, isGoogle: false };
  }
  
  const referrer = document.referrer;
  const hostname = referrer ? new URL(referrer).hostname : null;
  const isInternal = hostname === window.location.hostname;
  
  return {
    hostname,
    isInternal,
    isFacebook: referrer?.includes("facebook.com") || isFromFacebook(window.location.search),
    isGoogle: referrer?.includes("google.") || isFromGoogle(window.location.search),
  };
}