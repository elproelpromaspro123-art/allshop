import type { Metadata } from "next";
import Link from "next/link";
import {
  MailQuestion,
  PackageSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { buttonVariants } from "@/components/ui/button-variants";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { FaqAccordion } from "@/components/help/FaqAccordion";
import { HelpHero } from "@/components/help/HelpHero";
import { HelpLinkGrid } from "@/components/help/HelpLinkGrid";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateFaqPageJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return buildStaticPageMetadata({
    title: t("policy.faq.title"),
    description: t("policy.faq.metaDescription"),
    path: "/faq",
  });
}

export default async function FaqPage() {
  const t = await getServerT();
  const title = t("policy.faq.title");
  const description = t("policy.faq.metaDescription");
  const faqEntries = [
    { question: t("policy.faq.q1"), answer: t("policy.faq.a1") },
    { question: t("policy.faq.q2"), answer: t("policy.faq.a2") },
    { question: t("policy.faq.q3"), answer: t("policy.faq.a3") },
    { question: t("policy.faq.q4"), answer: t("policy.faq.a4") },
  ];
  const structuredData = [
    generateFaqPageJsonLd({
      title,
      description,
      path: "/faq",
      entries: faqEntries,
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/faq",
        type: "help",
      }),
    ),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }}
      />
      <StaticPageLayout
        title={title}
        subtitle={t("policy.faq.subtitle")}
        updatedAt="2026-03-14"
        type="help"
        path="/faq"
      >
        <div className="space-y-6">
          <HelpHero
            eyebrow="Respuestas claras"
            title="Todo claro antes de comprar."
            description="Aquí respondemos lo que más nos preguntan para que no tengas que ir de una página a otra. Si tu caso es puntual, también tienes soporte directo y seguimiento del pedido."
            stats={[
              { label: "Pago", value: "Contra entrega" },
              { label: "Cobertura", value: "Colombia" },
              { label: "Apoyo", value: "Humano" },
            ]}
            actions={
              <>
                <Link
                  href="/soporte#feedback-form"
                  className={buttonVariants({ size: "sm", className: "gap-2" })}
                >
                    Abrir soporte
                    <MailQuestion className="h-4 w-4" />
                </Link>
                <Link
                  href="/seguimiento"
                  className={buttonVariants({
                    size: "sm",
                    variant: "outline",
                    className: "gap-2",
                  })}
                >
                    Ver seguimiento
                    <PackageSearch className="h-4 w-4" />
                </Link>
                <Link
                  href="/envios"
                  className={buttonVariants({
                    size: "sm",
                    variant: "outline",
                    className: "gap-2",
                  })}
                >
                    Revisar envíos
                    <Truck className="h-4 w-4" />
                </Link>
              </>
            }
          />

          <FaqAccordion
            items={[
              { question: t("policy.faq.q1"), answer: t("policy.faq.a1"), open: true },
              { question: t("policy.faq.q2"), answer: t("policy.faq.a2") },
              { question: t("policy.faq.q3"), answer: t("policy.faq.a3") },
              { question: t("policy.faq.q4"), answer: t("policy.faq.a4") },
            ]}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <ContentBlock title="Antes de escribirnos" variant="highlight">
              <p>
                Si tu duda es sobre un pedido, envianos el correo, el telefono
                y la referencia. Si es por tiempos o cobertura, primero revisa
                envios.
              </p>
            </ContentBlock>

            <ContentBlock title="Que encuentras aqui">
              <ContentList
                items={[
                  "Respuestas cortas y faciles de entender.",
                  "Menos vueltas antes de comprar.",
                  "El camino más rápido al canal correcto.",
                ]}
              />
            </ContentBlock>
          </div>

          <HelpLinkGrid
            items={[
              {
                href: "/envios",
                title: "Envios",
                description: "Cobertura, tiempos y lo que debes revisar antes de confirmar.",
                cta: "Ver envios",
                icon: Truck,
              },
              {
                href: "/devoluciones",
                title: "Devoluciones",
                description: "Cuando aplica garantía y cómo pedir una revisión.",
                cta: "Ver politica",
                icon: ShieldCheck,
              },
              {
                href: "/soporte#feedback-form",
                title: "Soporte",
                description: "Si tu caso es puntual, te respondemos por el canal correcto.",
                cta: "Contactar ahora",
                icon: MailQuestion,
              },
            ]}
          />
        </div>
      </StaticPageLayout>
    </>
  );
}
