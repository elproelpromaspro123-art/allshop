/**
 * CSRF Token Client-Side Management
 * Utility functions for handling CSRF tokens in client-side code
 */

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get CSRF token from cache or fetch from server
 * Returns null if failed to fetch
 */
export async function getCsrfToken(): Promise<string | null> {
  // Return cached token if still valid (tokens valid for 2 hours)
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

    const data = await response.json();
    const token = data.csrfToken;

    if (!token) {
      console.warn("[CSRF] No token in response");
      return null;
    }

    // Cache token for 1 hour 50 minutes (slightly less than 2 hour validity)
    cachedToken = token;
    tokenExpiry = Date.now() + 110 * 60 * 1000;

    return token;
  } catch (error) {
    console.error("[CSRF] Error fetching token:", error);
    return null;
  }
}

/**
 * Clear cached CSRF token
 * Useful for forcing a refresh
 */
export function clearCsrfToken(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

/**
 * Get CSRF token synchronously from cache
 * Returns null if no cached token available
 */
export function getCachedCsrfToken(): string | null {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return null;
}

/**
 * Check if a valid CSRF token is available in cache
 */
export function hasValidCsrfToken(): boolean {
  return cachedToken !== null && Date.now() < tokenExpiry;
}

/**
 * Fetch CSRF token and return headers object for fetch requests
 */
export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  if (!token) {
    return {};
  }
  return {
    "x-csrf-token": token,
  };
}

/**
 * Make a POST request with CSRF token automatically included
 */
export async function postWithCsrf<T = unknown>(
  url: string,
  data: unknown,
  options?: RequestInit
): Promise<T | null> {
  const token = await getCsrfToken();
  
  if (!token) {
    console.error("[CSRF] Cannot make POST request: no token available");
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
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
