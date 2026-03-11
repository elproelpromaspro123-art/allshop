"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

function normalizePixelId(value: string | undefined): string | null {
  const normalized = String(value || "").trim();
  if (!/^\d{6,20}$/.test(normalized)) return null;
  return normalized;
}

export const FB_PIXEL_ID = normalizePixelId(
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
);

export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
};

export const event = (name: string, options = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options);
  }
};

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!FB_PIXEL_ID || process.env.NODE_ENV !== "production") return;
    pageview();
  }, [pathname, searchParams]);

  if (!FB_PIXEL_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        id="fb-pixel-sdk"
        strategy="afterInteractive"
        src="https://connect.facebook.net/en_US/fbevents.js"
      />
      <Script
        id="fb-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
            n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[]}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
}
