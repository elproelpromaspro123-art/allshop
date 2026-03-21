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
  const [estimate, setEstimate] = useState<DeliveryEstimateRange | null>(null);

  useEffect(() => {
    if (cachedEstimate) {
      const frame = window.requestAnimationFrame(() => {
        setEstimate(cachedEstimate);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    let active = true;

    const applyEstimate = (value: DeliveryEstimateRange | null) => {
      if (active) {
        setEstimate(value);
      }
    };

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

    cachedPromise.then(applyEstimate);

    return () => {
      active = false;
    };
  }, []);

  return estimate;
}
