import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/orden",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function OrderLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
