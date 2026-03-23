"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  hasAnalyticsConsent,
  readCookieConsent,
} from "@/lib/cookie-consent";

const TELEMETRY_EXCLUDED_PREFIXES = ["/panel-privado", "/bloqueado"];

export function Telemetry() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() || "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional SSR-safety mount detection
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (process.env.NODE_ENV !== "production") return null;

  const shouldSkip = TELEMETRY_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const hostname = window.location.hostname;
  const isLocalRuntime = hostname === "localhost" || hostname === "127.0.0.1";
  const analyticsAllowed = hasAnalyticsConsent(readCookieConsent());

  if (shouldSkip || isLocalRuntime || !analyticsAllowed) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
