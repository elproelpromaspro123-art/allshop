import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { PricingProvider } from "@/providers/PricingProvider";
import { getServerLanguage } from "@/lib/i18n";
import { getBaseUrl, toAbsoluteUrl } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  applicationName: "AllShop Premium",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  title: {
    default: "AllShop Premium | Global Shopping Destination",
    template: "%s | AllShop Premium",
  },
  alternates: {
    canonical: "/",
  },
  description:
    "Curated products with secure checkout through Mercado Pago, transparent shipping windows, and clear return policies.",
  keywords: [
    "premium shopping",
    "online store",
    "express shipping worldwide",
    "quality products",
    "allshop premium",
    "global dropshipping",
  ],
  openGraph: {
    type: "website",
    url: "/",
    locale: "en_US",
    siteName: "AllShop Premium",
    title: "AllShop Premium | Global Shopping Destination",
    description:
      "Curated products with secure checkout, transparent shipping, and clear support channels.",
    images: [
      {
        url: toAbsoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "AllShop Premium global storefront",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AllShop Premium | Global Shopping Destination",
    description:
      "Curated products with secure checkout, transparent shipping, and clear support channels.",
    images: [toAbsoluteUrl("/twitter-image")],
  },
  category: "shopping",
  creator: "AllShop Premium",
  publisher: "AllShop Premium",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLanguage = await getServerLanguage();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AllShop Premium",
    url: getBaseUrl(),
    logo: toAbsoluteUrl("/icon.svg"),
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AllShop Premium",
    url: getBaseUrl(),
    inLanguage: "en",
  };

  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body className="antialiased min-h-screen flex flex-col overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <PricingProvider>
              <Header />
              <main suppressHydrationWarning className="flex-1">{children}</main>
              <Footer />
            </PricingProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
