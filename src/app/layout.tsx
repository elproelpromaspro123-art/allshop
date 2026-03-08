import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PricingProvider } from "@/providers/PricingProvider";
import { CatalogUpdateWatcher } from "@/components/CatalogUpdateWatcher";
import { ToastProvider } from "@/components/ui/Toast";
import { getBaseUrl, toAbsoluteUrl } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
    "Tienda online en Colombia con pago contra entrega, envio nacional y atencion personalizada.",
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
      "Compra online en Colombia con contra entrega, envio nacional y soporte personalizado.",
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
      "Compra online en Colombia con contra entrega, envio nacional y soporte personalizado.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vortixy",
    url: getBaseUrl(),
    logo: toAbsoluteUrl("/icon.svg"),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vortixy",
    url: getBaseUrl(),
    inLanguage: "es-CO",
  };

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={jakarta.variable}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        <ThemeProvider>
          <LanguageProvider>
            <PricingProvider>
              <ToastProvider>
                <Header />
                <main suppressHydrationWarning className="flex-1">
                  {children}
                </main>
                <CatalogUpdateWatcher />
                <Footer />
              </ToastProvider>
            </PricingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
