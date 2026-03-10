import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Telemetry } from "@/components/Telemetry";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PricingProvider } from "@/providers/PricingProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { FacebookPixel } from "@/components/FacebookPixel";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { CatalogUpdateWatcher } from "@/components/CatalogUpdateWatcher";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getBaseUrl, toAbsoluteUrl } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
  alternates: {
    canonical: "/",
  },
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
    url: "/",
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

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
    potentialAction: {
      "@type": "SearchAction",
      target: `${getBaseUrl()}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      className={jakarta.variable}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        <ThemeProvider>
          <LanguageProvider>
            <PricingProvider>
              <ToastProvider>
                <Suspense fallback={null}>
                  <FacebookPixel />
                </Suspense>
                <AnnouncementBar />
                <Header />
                <main suppressHydrationWarning className="flex-1">
                  {children}
                </main>
                <CatalogUpdateWatcher />
                <WhatsAppButton />
                <Footer />
                <Telemetry />
              </ToastProvider>
            </PricingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
