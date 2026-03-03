import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.terms.title"),
    description: t("policy.terms.metaDescription"),
    alternates: {
      canonical: "/terminos",
    },
  };
}

export default async function TermsPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.terms.title")}
      subtitle={t("policy.terms.subtitle")}
      updatedAt="2026-03-03"
    >
      <h2>{t("policy.terms.useSiteTitle")}</h2>
      <p>{t("policy.terms.useSiteText")}</p>

      <h2>{t("policy.terms.availabilityTitle")}</h2>
      <p>{t("policy.terms.availabilityText")}</p>

      <h2>{t("policy.terms.pricingTitle")}</h2>
      <p>{t("policy.terms.pricingText")}</p>

      <h2>{t("policy.terms.liabilityTitle")}</h2>
      <p>{t("policy.terms.liabilityText")}</p>
    </StaticPageLayout>
  );
}
