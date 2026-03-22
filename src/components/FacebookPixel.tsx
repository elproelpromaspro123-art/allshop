"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import {
  FB_PIXEL_ID,
  event,
  pageview,
} from "@/lib/facebook-pixel";

export { FB_PIXEL_ID, event, pageview, trackConversion } from "@/lib/facebook-pixel";

export function FacebookPixel() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !FB_PIXEL_ID || process.env.NODE_ENV !== "production") return;

    // Track PageView on every route change
    pageview();

    // Track specific events based on route
    if (pathname === "/checkout") {
      event("InitiateCheckout");
    } else if (
      pathname.includes("/orden/confirmacion") ||
      pathname.includes("/order/")
    ) {
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
  }, [pathname, searchParams, mounted]);

  if (!mounted || !FB_PIXEL_ID || process.env.NODE_ENV !== "production") return null;

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
