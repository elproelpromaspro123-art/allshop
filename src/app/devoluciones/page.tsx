import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { getServerT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.returns.title"),
    description: t("policy.returns.metaDescription"),
    alternates: {
      canonical: "/devoluciones",
    },
  };
}

export default async function ReturnsPage() {
  const t = await getServerT();

  return (
    <StaticPageLayout
      title={t("policy.returns.title")}
      subtitle={t("policy.returns.subtitle")}
      updatedAt="2026-03-14"
      type="help"
    >
      <ContentBlock title={t("policy.returns.requestWindowTitle")}>
        <p>{t("policy.returns.requestWindowText")}</p>
      </ContentBlock>

      <ContentBlock title={t("policy.returns.eligibilityTitle")}>
        <ContentList
          items={[
            t("policy.returns.eligibility1"),
            t("policy.returns.eligibility2"),
            t("policy.returns.eligibility3"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.returns.nonEligibleTitle")}>
        <ContentList
          variant="dot"
          items={[
            t("policy.returns.nonEligible1"),
            t("policy.returns.nonEligible2"),
          ]}
        />
      </ContentBlock>

      <ContentBlock title={t("policy.returns.refundTitle")}>
        <p>{t("policy.returns.refundText")}</p>
      </ContentBlock>
    </StaticPageLayout>
  );
}
