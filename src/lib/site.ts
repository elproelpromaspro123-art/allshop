const DEFAULT_SITE_URL = "https://allshop.co";

export function getBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL;
  return rawUrl.replace(/\/+$/, "");
}

export function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}
