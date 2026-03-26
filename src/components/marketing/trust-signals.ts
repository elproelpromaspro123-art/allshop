import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  ShieldEllipsis,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { MarketingTone } from "./MarketingPrimitives";

export interface TrustSignal {
  Icon: LucideIcon;
  title: string;
  description: string;
  tone: MarketingTone;
}

export function buildTrustSignals(
  t: (key: string) => string,
): TrustSignal[] {
  return [
    {
      Icon: ShieldCheck,
      title: t("trustbar.guaranteeTitle"),
      description: t("trustbar.guaranteeDesc"),
      tone: "emerald",
    },
    {
      Icon: CreditCard,
      title: t("trustbar.paymentTitle"),
      description: t("trustbar.paymentDesc"),
      tone: "sky",
    },
    {
      Icon: RotateCcw,
      title: t("trustbar.returnsTitle"),
      description: t("trustbar.returnsDesc"),
      tone: "amber",
    },
    {
      Icon: ShieldEllipsis,
      title: t("trustbar.securityTitle"),
      description: t("trustbar.securityDesc"),
      tone: "violet",
    },
    {
      Icon: Headset,
      title: t("trustbar.supportTitle"),
      description: t("trustbar.supportDesc"),
      tone: "slate",
    },
  ];
}

export function buildStorefrontTrustSignals(
  t: (key: string) => string,
): TrustSignal[] {
  return [
    {
      Icon: ShieldCheck,
      title: t("trustbar.guaranteeTitle"),
      description: t("trustbar.guaranteeDesc"),
      tone: "emerald",
    },
    {
      Icon: Truck,
      title: t("shipping.nationalLabel"),
      description: t("shipping.nationalSublabel"),
      tone: "sky",
    },
    {
      Icon: RotateCcw,
      title: t("trustbar.returnsTitle"),
      description: t("trustbar.returnsDesc"),
      tone: "amber",
    },
    {
      Icon: Headset,
      title: t("trustbar.supportTitle"),
      description: t("trustbar.supportDesc"),
      tone: "violet",
    },
  ];
}
