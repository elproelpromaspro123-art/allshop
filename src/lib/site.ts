const DEFAULT_SITE_URL = "https://vortixy.net";
const DEFAULT_SUPPORT_EMAIL = "vortixyoficial@gmail.com";

export const SUPPORT_EMAIL = (() => {
  const candidate = String(process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "")
    .trim()
    .toLowerCase();

  if (candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
    return candidate;
  }

  return DEFAULT_SUPPORT_EMAIL;
})();

export function getBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL;
  return rawUrl.replace(/\/+$/, "");
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
