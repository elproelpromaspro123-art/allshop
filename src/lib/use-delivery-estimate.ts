"use client";

import { useEffect, useState } from "react";
import { fetchDeliveryEstimateClient } from "./delivery-estimate-client";

export interface DeliveryEstimateRange {
  min: number;
  max: number;
}

let cachedEstimate: DeliveryEstimateRange | null = null;
let cachedPromise: Promise<DeliveryEstimateRange | null> | null = null;

export function useDeliveryEstimate() {
  const [estimate, setEstimate] = useState<DeliveryEstimateRange | null>(
    cachedEstimate,
  );

  useEffect(() => {
    if (cachedEstimate) return;

    if (!cachedPromise) {
      cachedPromise = fetchDeliveryEstimateClient()
        .then((data) => {
          if (data?.estimate) {
            cachedEstimate = {
              min: data.estimate.minBusinessDays,
              max: data.estimate.maxBusinessDays,
            };
            return cachedEstimate;
          }
          return null;
        })
        .catch(() => {
          cachedPromise = null;
          return null;
        });
    }

    let active = true;
    cachedPromise.then((value) => {
      if (active) setEstimate(value);
    });

    return () => {
      active = false;
    };
  }, []);

  return estimate;
}
