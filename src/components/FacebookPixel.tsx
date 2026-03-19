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

/**
 * Track custom conversion events
 * Usage: trackConversion('Purchase', { value: 50000, currency: 'COP' })
 */
export const trackConversion = (eventName: string, options?: {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, {
      value: options?.value,
      currency: options?.currency || "COP",
      content_name: options?.content_name,
      content_ids: options?.content_ids,
      content_type: options?.content_type || "product",
      num_items: options?.num_items,
      ...options,
    });
  }
};

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!FB_PIXEL_ID || process.env.NODE_ENV !== "production") return;
    
    // Track PageView on every route change
    pageview();

    // Track specific events based on route
    if (pathname === "/checkout") {
      event("InitiateCheckout");
    } else if (pathname.includes("/orden/confirmacion") || pathname.includes("/order/")) {
      // Purchase event on order confirmation page
      // Value should be passed from the page component
      event("Purchase");
    } else if (pathname.startsWith("/producto/")) {
      // ViewContent on product pages
      event("ViewContent");
    } else if (pathname === "/carrito" || pathname === "/cart") {
      // AddToCart on cart page (triggered when user views cart)
      event("AddToCart");
    }
  }, [pathname, searchParams]);

  if (!FB_PIXEL_ID || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', '${FB_PIXEL_ID}');
            window.fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
}
