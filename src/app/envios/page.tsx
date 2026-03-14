import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.shipping.title"),
    description: t("policy.shipping.metaDescription"),
    alternates: {
      canonical: "/envios",
    },
  };
}

export default async function ShippingPolicyPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.shipping.title")}
      subtitle={t("policy.shipping.subtitle")}
      updatedAt="2026-03-14"
    >
      <h2>{t("policy.shipping.coverageTitle")}</h2>
      <p>{t("policy.shipping.coverageText")}</p>

      <h2>{t("policy.shipping.timesTitle")}</h2>
      <ul>
        <li>{t("policy.shipping.timesNational")}</li>
        <li>{t("policy.shipping.timesInternational")}</li>
      </ul>

      <h2>{t("policy.shipping.costsTitle")}</h2>
      <p>{t("policy.shipping.costsText")}</p>

      <h2>{t("policy.shipping.incidentsTitle")}</h2>
      <p>{t("policy.shipping.incidentsText")}</p>
    </StaticPageLayout>
  );
}
