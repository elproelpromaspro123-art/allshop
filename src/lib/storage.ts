/**
 * Storage utilities with SSR safety and error handling
 */

/**
 * Safe wrapper for localStorage with error handling
 */
export function getFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export function setToLocalStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeFromLocalStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe wrapper for sessionStorage with error handling
 */
export function getFromSessionStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  
  try {
    const item = window.sessionStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export function setToSessionStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeFromSessionStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if storage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get remaining storage space (approximate)
 */
export function getStorageUsage(): { used: number; available: boolean } {
  if (typeof window === "undefined") return { used: 0, available: false };
  
  try {
    let used = 0;
    for (const key in window.localStorage) {
      if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
        used += window.localStorage.getItem(key)?.length || 0;
      }
    }
    return { used, available: true };
  } catch {
    return { used: 0, available: false };
  }
}