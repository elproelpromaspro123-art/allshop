import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "AllShop Colombia | Tu Tienda de Confianza",
    template: "%s | AllShop Colombia",
  },
  description:
    "Productos seleccionados con garantía local en Colombia. Envío express nacional, pagos seguros con Mercado Pago y PSE. Devolución gratis 30 días.",
  keywords: [
    "tienda online colombia",
    "comprar online",
    "envío gratis colombia",
    "productos garantía",
    "allshop",
    "dropshipping colombia",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "AllShop Colombia",
    title: "AllShop Colombia | Tu Tienda de Confianza",
    description:
      "Productos seleccionados con garantía local en Colombia. Envío express, pagos seguros.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AllShop Colombia",
    description: "Tu tienda de confianza en Colombia",
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
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
