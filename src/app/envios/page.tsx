import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
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
      type="help"
    >
      <ContentBlock title={t("policy.shipping.coverageTitle")}>
        <p>{t("policy.shipping.coverageText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.shipping.timesTitle")}>
        <ContentList
          variant="dot"
          items={[
            t("policy.shipping.timesNational"),
            t("policy.shipping.timesInternational"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.shipping.costsTitle")}>
        <p>{t("policy.shipping.costsText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.shipping.incidentsTitle")}>
        <p>{t("policy.shipping.incidentsText")}</p>
      </ContentBlock>
    </StaticPageLayout>
  );
}
