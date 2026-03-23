export interface DeliveryEstimatePayload {
  estimate: {
    department: string;
    city: string | null;
    minBusinessDays: number;
    maxBusinessDays: number;
    formattedRange: string;
  };
  location?: {
    source?: string;
    city?: string | null;
    department?: string | null;
  };
}

let cachedPromise: Promise<DeliveryEstimatePayload> | null = null;
let cachedResult: DeliveryEstimatePayload | null = null;
const DELIVERY_ESTIMATE_CACHE_KEY = "vortixy_delivery_estimate";
const DELIVERY_ESTIMATE_CACHE_TTL_MS = 15 * 60 * 1000;

interface PersistedDeliveryEstimate {
  payload: DeliveryEstimatePayload;
  savedAt: number;
}

function readPersistedEstimate(): DeliveryEstimatePayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DELIVERY_ESTIMATE_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedDeliveryEstimate;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !parsed.payload?.estimate
    ) {
      window.sessionStorage.removeItem(DELIVERY_ESTIMATE_CACHE_KEY);
      return null;
    }

    if (Date.now() - parsed.savedAt > DELIVERY_ESTIMATE_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(DELIVERY_ESTIMATE_CACHE_KEY);
      return null;
    }

    return parsed.payload;
  } catch {
    window.sessionStorage.removeItem(DELIVERY_ESTIMATE_CACHE_KEY);
    return null;
  }
}

function persistEstimate(payload: DeliveryEstimatePayload): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      DELIVERY_ESTIMATE_CACHE_KEY,
      JSON.stringify({
        payload,
        savedAt: Date.now(),
      } satisfies PersistedDeliveryEstimate),
    );
  } catch {
    // Ignore storage failures and keep runtime cache only.
  }
}

export function fetchDeliveryEstimateClient(): Promise<DeliveryEstimatePayload> {
  if (cachedResult) return Promise.resolve(cachedResult);
  const persistedEstimate = readPersistedEstimate();
  if (persistedEstimate) {
    cachedResult = persistedEstimate;
    return Promise.resolve(persistedEstimate);
  }
  if (!cachedPromise) {
    cachedPromise = fetch("/api/delivery/estimate?auto=1")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch estimate");
        return res.json() as Promise<DeliveryEstimatePayload>;
      })
      .then((data) => {
        cachedResult = data;
        persistEstimate(data);
        return data;
      })
      .catch((e) => {
        cachedPromise = null;
        throw e;
      });
  }
  return cachedPromise;
}
