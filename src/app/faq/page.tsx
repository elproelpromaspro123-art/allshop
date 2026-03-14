import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { getServerT } from "@/lib/i18n";

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <StaticPageLayout
        title={t("policy.faq.title")}
        subtitle={t("policy.faq.subtitle")}
        updatedAt="2026-03-14"
      >
        <h2>{t("policy.faq.q1")}</h2>
        <p>{t("policy.faq.a1")}</p>

        <h2>{t("policy.faq.q2")}</h2>
        <p>{t("policy.faq.a2")}</p>

        <h2>{t("policy.faq.q3")}</h2>
        <p>{t("policy.faq.a3")}</p>

        <h2>{t("policy.faq.q4")}</h2>
        <p>{t("policy.faq.a4")}</p>
      </StaticPageLayout>
    </>
  );
}
