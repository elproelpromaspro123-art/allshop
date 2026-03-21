import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Telemetry } from "@/components/Telemetry";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PricingProvider } from "@/providers/PricingProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { FacebookPixel } from "@/components/FacebookPixel";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { getBaseUrl, toAbsoluteUrl } from "@/lib/site";
import { safeJsonLd } from "@/lib/json-ld";
import { ClientLayoutUtilities } from "@/components/ClientLayoutUtilities";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  applicationName: "Vortixy",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  title: {
    default: "Vortixy | Tienda online Colombia",
    template: "%s | Vortixy",
  },
  // canonical removed from root layout — each page should set its own (fix 4.1)
  description:
    "Tienda online en Colombia con pago contra entrega, envío nacional y atención personalizada.",
  keywords: [
    "tienda online colombia",
    "comprar online colombia",
    "contra entrega colombia",
    "envio nacional colombia",
    "Vortixy",
    "productos colombia",
  ],
  openGraph: {
    type: "website",
    // url removed from root layout openGraph — each page should set its own (fix 4.2)
    locale: "es_CO",
    siteName: "Vortixy",
    title: "Vortixy | Tienda online Colombia",
    description:
      "Compra online en Colombia con contra entrega, envío nacional y soporte personalizado.",
    images: [
      {
        url: toAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "Vortixy - Tienda online Colombia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vortixy | Tienda online Colombia",
    description:
      "Compra online en Colombia con contra entrega, envío nacional y soporte personalizado.",
    images: [toAbsoluteUrl("/twitter-image")],
  },
  category: "shopping",
  creator: "Vortixy",
  publisher: "Vortixy",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "whvrMc3euWsJPuIaPfji7ddDfNiOzlxFfsnW6U7Y4mU",
  },
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#008c55",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce reading via await headers() removed — it forced entire layout to be dynamic (fix 2.1)
  // application/ld+json scripts don't need CSP nonces since they're data, not executable JS

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Vortixy",
    url: getBaseUrl(),
    logo: toAbsoluteUrl("/icon.svg"),
    description:
      "Tienda online en Colombia con pago contra entrega, envío nacional y atención personalizada.",
    foundingDate: "2026",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cúcuta",
      addressRegion: "Norte de Santander",
      addressCountry: "CO",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "vortixyoficial@gmail.com",
      contactType: "customer support",
      availableLanguage: "Spanish",
    },
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vortixy",
    url: getBaseUrl(),
    description:
      "Tienda online en Colombia con contra entrega, envío nacional y soporte directo.",
    inLanguage: "es-CO",
  };

  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      className={`${jakarta.variable} ${dmSerif.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Font preloading for LCP optimization */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@400&display=swap"
          as="style"
        />
        {/* Manual preconnects removed — next/font/google handles this automatically (fix 2.7) */}
        <meta name="format-detection" content="telephone=no" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body suppressHydrationWarning className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--foreground)] focus:shadow-lg focus:ring-2 focus:ring-[var(--accent)]"
        >
          Saltar al contenido
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd([organizationSchema, websiteSchema]),
          }}
        />
        <LanguageProvider>
          <PricingProvider>
            <ToastProvider>
              <ScrollRestoration />
              <Suspense fallback={null}>
                <FacebookPixel />
              </Suspense>
              <AnnouncementBar />
              <Header />
              <main id="main-content" className="flex-1">{children}</main>
              <ClientLayoutUtilities />
              <Footer />
              <Telemetry />
              <CookieConsentBanner />
            </ToastProvider>
          </PricingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
