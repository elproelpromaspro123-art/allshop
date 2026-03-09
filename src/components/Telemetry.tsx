"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const TELEMETRY_EXCLUDED_PREFIXES = ["/panel-privado", "/bloqueado"];

export function Telemetry() {
  const pathname = usePathname() || "";

  if (process.env.NODE_ENV !== "production") return null;

  const shouldSkip = TELEMETRY_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (shouldSkip) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
