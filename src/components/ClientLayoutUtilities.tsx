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

const ScrollProgressBar = dynamic(
  () => import("@/components/ScrollProgressBar").then((mod) => mod.ScrollProgressBar),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import("@/components/BackToTop").then((mod) => mod.BackToTop),
  { ssr: false }
);

const AppBootLoader = dynamic(
  () => import("@/components/AppBootLoader").then((mod) => mod.AppBootLoader),
  { ssr: false }
);

export function ClientLayoutUtilities() {
  return (
    <>
      <ScrollProgressBar />
      <AppBootLoader />
      <ScrollRevealObserver />
      <CatalogUpdateWatcher />
      <WhatsAppButton />
      <ExitIntentPopup />
      <RecentPurchaseToast />
      <BackToTop />
    </>
  );
}
