import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock } from "@/components/ContentBlock";
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
      updatedAt="2026-03-14"
      type="legal"
    >
      <ContentBlock title={t("policy.terms.useSiteTitle")}>
        <p>{t("policy.terms.useSiteText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.terms.availabilityTitle")}>
        <p>{t("policy.terms.availabilityText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.terms.pricingTitle")}>
        <p>{t("policy.terms.pricingText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.terms.liabilityTitle")}>
        <p>{t("policy.terms.liabilityText")}</p>
      </ContentBlock>
    </StaticPageLayout>
  );
}
