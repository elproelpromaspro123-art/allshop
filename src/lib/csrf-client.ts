let cachedToken: string | null = null;
let tokenExpiry = 0;

const CSRF_RETRYABLE_CODES = new Set(["CSRF_MISSING", "CSRF_INVALID"]);
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class CsrfClientError extends Error {
  readonly code = "CSRF_TOKEN_UNAVAILABLE";

  constructor(message = "No se pudo obtener el token CSRF.") {
    super(message);
    this.name = "CsrfClientError";
  }
}

function normalizeMethod(method?: string): string {
  return String(method || "GET")
    .trim()
    .toUpperCase();
}

function isSameOriginRequest(url: string): boolean {
  if (typeof window === "undefined") return true;
  if (url.startsWith("/")) return true;

  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

function mergeHeaders(
  headers?: HeadersInit,
  extra?: Record<string, string>,
): Headers {
  const merged = new Headers(headers);

  if (!extra) return merged;

  for (const [key, value] of Object.entries(extra)) {
    merged.set(key, value);
  }

  return merged;
}

async function withCsrfHeader(
  url: string,
  options: RequestInit = {},
  forceRefresh = false,
): Promise<RequestInit> {
  const method = normalizeMethod(options.method);
  const sameOrigin = isSameOriginRequest(url);

  if (!sameOrigin || !UNSAFE_METHODS.has(method)) {
    return options;
  }

  if (forceRefresh) {
    clearCsrfToken();
  }

  const token = await getCsrfToken();
  if (!token) {
    throw new CsrfClientError(
      "No se pudo obtener el token de seguridad. Verifica tu conexión a internet e intenta nuevamente."
    );
  }

  return {
    ...options,
    credentials: options.credentials ?? "same-origin",
    headers: mergeHeaders(options.headers, {
      "x-csrf-token": token,
    }),
  };
}

async function shouldRetryCsrf(response: Response): Promise<boolean> {
  if (response.status !== 403) return false;

  try {
    const payload = (await response.clone().json()) as { code?: string };
    return CSRF_RETRYABLE_CODES.has(String(payload.code || ""));
  } catch {
    return false;
  }
}

export async function getCsrfToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/internal/csrf", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      console.warn("[CSRF] Failed to fetch token:", response.status);
      return null;
    }

    const data = (await response.json()) as { csrfToken?: string };
    const token = data.csrfToken;

    if (!token) {
      console.warn("[CSRF] No token in response");
      return null;
    }

    cachedToken = token;
    tokenExpiry = Date.now() + 110 * 60 * 1000;

    return token;
  } catch (error) {
    console.error("[CSRF] Error fetching token:", error);
    return null;
  }
}

export function clearCsrfToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

export function getCachedCsrfToken(): string | null {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return null;
}

export function hasValidCsrfToken(): boolean {
  return cachedToken !== null && Date.now() < tokenExpiry;
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  if (!token) {
    return {};
  }
  return {
    "x-csrf-token": token,
  };
}

export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = normalizeMethod(options.method);
  const shouldProtect = isSameOriginRequest(url) && UNSAFE_METHODS.has(method);
  const firstOptions = await withCsrfHeader(url, options);
  const response = await fetch(url, firstOptions);

  if (!shouldProtect || !(await shouldRetryCsrf(response))) {
    return response;
  }

  const retryOptions = await withCsrfHeader(url, options, true);
  return fetch(url, retryOptions);
}

export function isCsrfClientError(error: unknown): error is CsrfClientError {
  return error instanceof CsrfClientError;
}

export async function postWithCsrf<T = unknown>(
  url: string,
  data: unknown,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const response = await fetchWithCsrf(url, {
      ...options,
      method: "POST",
      headers: mergeHeaders(options?.headers, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("[CSRF] Request failed:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[CSRF] Request error:", error);
    return null;
  }
}
