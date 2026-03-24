"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * SSR-safe wrapper for useReducedMotion.
 * Returns false on server and first client render (consistent).
 * Returns real value after mount.
 */
export function useReducedMotionSafe(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount flag avoids SSR/client reduced-motion mismatch
    setMounted(true);
  }, []);

  return mounted ? (prefersReducedMotion ?? false) : false;
}
