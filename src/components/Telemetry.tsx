"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  // This check is now safe because we only check it after mount (though it will likely be false in browser anyway)
  // Actually, Vercel analytics/speed-insights are designed to work in production automatically.
  
  const shouldSkip = TELEMETRY_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (shouldSkip) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
