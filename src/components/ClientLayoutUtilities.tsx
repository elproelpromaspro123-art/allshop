"use client";

import dynamic from "next/dynamic";
import { ScrollRevealObserver } from "@/components/ScrollRevealObserver";

const CatalogUpdateWatcher = dynamic(
  () => import("@/components/CatalogUpdateWatcher").then((mod) => mod.CatalogUpdateWatcher),
  { ssr: false }
);

const WhatsAppButton = dynamic(
  () => import("@/components/WhatsAppButton").then((mod) => mod.WhatsAppButton),
  { ssr: false }
);

const ExitIntentPopup = dynamic(
  () => import("@/components/ExitIntentPopup").then((mod) => mod.ExitIntentPopup),
  { ssr: false }
);

const RecentPurchaseToast = dynamic(
  () => import("@/components/RecentPurchaseToast").then((mod) => mod.RecentPurchaseToast),
  { ssr: false }
);

export function ClientLayoutUtilities() {
  return (
    <>
      <ScrollRevealObserver />
      <CatalogUpdateWatcher />
      <WhatsAppButton />
      <ExitIntentPopup />
      <RecentPurchaseToast />
    </>
  );
}
