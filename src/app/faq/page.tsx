import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { ContentBlock } from "@/components/ContentBlock";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t("policy.faq.title"),
    description: t("policy.faq.metaDescription"),
    alternates: {
      canonical: "/faq",
    },
  };
}

export default async function FaqPage() {
  const t = await getServerT();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("policy.faq.q1"),
        acceptedAnswer: { "@type": "Answer", text: t("policy.faq.a1") },
      },
      {
        "@type": "Question",
        name: t("policy.faq.q2"),
        acceptedAnswer: { "@type": "Answer", text: t("policy.faq.a2") },
      },
      {
        "@type": "Question",
        name: t("policy.faq.q3"),
        acceptedAnswer: { "@type": "Answer", text: t("policy.faq.a3") },
      },
      {
        "@type": "Question",
        name: t("policy.faq.q4"),
        acceptedAnswer: { "@type": "Answer", text: t("policy.faq.a4") },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <StaticPageLayout
        title={t("policy.faq.title")}
        subtitle={t("policy.faq.subtitle")}
        updatedAt="2026-03-14"
        type="help"
      >
        <ContentBlock title={t("policy.faq.q1")}>
          <p>{t("policy.faq.a1")}</p>
        </ContentBlock>

        <ContentBlock title={t("policy.faq.q2")}>
          <p>{t("policy.faq.a2")}</p>
        </ContentBlock>

        <ContentBlock title={t("policy.faq.q3")}>
          <p>{t("policy.faq.a3")}</p>
        </ContentBlock>

        <ContentBlock title={t("policy.faq.q4")}>
          <p>{t("policy.faq.a4")}</p>
        </ContentBlock>
      </StaticPageLayout>
    </>
  );
}
