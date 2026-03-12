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

export function fetchDeliveryEstimateClient(): Promise<DeliveryEstimatePayload> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (!cachedPromise) {
    cachedPromise = fetch("/api/delivery/estimate?auto=1", {
      cache: "force-cache",
      next: { revalidate: 3600 },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch estimate");
        return res.json() as Promise<DeliveryEstimatePayload>;
      })
      .then((data) => {
        cachedResult = data;
        return data;
      })
      .catch((e) => {
        cachedPromise = null;
        throw e;
      });
  }
  return cachedPromise;
}
