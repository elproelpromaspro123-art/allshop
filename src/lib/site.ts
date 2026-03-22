import { getConfiguredAppUrl, getConfiguredSupportEmail } from "@/lib/env";

const DEFAULT_SITE_URL = "https://vortixy.net";
const DEFAULT_SUPPORT_EMAIL = "vortixyoficial@gmail.com";
export const WHATSAPP_PHONE = "573142377202";

export const SUPPORT_EMAIL = (() => {
  const candidate = String(getConfiguredSupportEmail() || "")
    .trim()
    .toLowerCase();

  if (candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    return candidate;
  }

  return DEFAULT_SUPPORT_EMAIL;
})();

export function getBaseUrl(): string {
  const rawUrl = getConfiguredAppUrl() || DEFAULT_SITE_URL;
  return rawUrl.replace(/\/+$/, "");
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
