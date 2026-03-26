import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Route, ShieldCheck, Truck } from "lucide-react";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { buttonVariants } from "@/components/ui/button-variants";
import { ContentBlock, ContentList } from "@/components/ContentBlock";
import { HelpHero } from "@/components/help/HelpHero";
import { HelpLinkGrid } from "@/components/help/HelpLinkGrid";
import { getServerT } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";
import {
  buildStaticPageBreadcrumbs,
  buildStaticPageMetadata,
  generateBreadcrumbJsonLd,
  generateWebPageJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return buildStaticPageMetadata({
    title: t("policy.shipping.title"),
    description: t("policy.shipping.metaDescription"),
    path: "/envios",
  });
}

export default async function ShippingPolicyPage() {
  const t = await getServerT();
  const title = t("policy.shipping.title");
  const description = t("policy.shipping.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/envios",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/envios",
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
        subtitle={t("policy.shipping.subtitle")}
        updatedAt="2026-03-14"
        type="help"
        path="/envios"
      >
        <div className="space-y-6">
        <HelpHero
          eyebrow="Logística clara"
          title="Cobertura nacional, tiempos visibles y costos explicados antes de confirmar."
          description="La página de envíos resume cómo operamos, qué ventana estimada puedes esperar y qué pasa si surge una novedad logística. El objetivo es reducir dudas antes de llegar al checkout."
          stats={[
            { label: "Cobertura", value: "Toda Colombia" },
            { label: "Tiempo", value: "2 a 7 días" },
            { label: "Pago", value: "Contra entrega" },
          ]}
          actions={
            <>
              <Link
                href="/#productos"
                className={buttonVariants({ size: "sm", className: "gap-2" })}
              >
                  Explorar catálogo
                  <Truck className="h-4 w-4" />
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
                  <Route className="h-4 w-4" />
              </Link>
              <Link
                href="/soporte#feedback-form"
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "gap-2",
                })}
              >
                  Hablar con soporte
                  <ShieldCheck className="h-4 w-4" />
              </Link>
            </>
          }
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <ContentBlock title={t("policy.shipping.coverageTitle")} variant="highlight">
            <p>{t("policy.shipping.coverageText")}</p>
            <p className="text-xs text-slate-500">
              Recomendamos revisar ciudad, departamento y referencia final antes
              de confirmar para evitar demoras.
            </p>
          </ContentBlock>

          <ContentBlock title={t("policy.shipping.timesTitle")}>
            <ContentList
              items={[
                t("policy.shipping.timesNational"),
                t("policy.shipping.timesInternational"),
                "La ventana final se ajusta según cobertura y validación operativa.",
              ]}
            />
          </ContentBlock>
        </div>

        <ContentBlock title="Cómo se mueve tu pedido">
          <ContentList
            items={[
              "Confirmamos la dirección y revisamos cobertura.",
              "Calculamos la ventana estimada antes de cerrar.",
              "Despachamos de forma manual cuando el pedido queda validado.",
              "Compartimos novedades por seguimiento y soporte cuando aplica.",
            ]}
          />
        </ContentBlock>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <ContentBlock title={t("policy.shipping.costsTitle")}>
            <p>{t("policy.shipping.costsText")}</p>
          </ContentBlock>

          <ContentBlock title={t("policy.shipping.incidentsTitle")} variant="highlight">
            <p>{t("policy.shipping.incidentsText")}</p>
          </ContentBlock>
        </div>

        <HelpLinkGrid
          items={[
            {
              href: "/faq",
              title: "Preguntas frecuentes",
              description: "Resolvemos dudas generales antes de llegar a soporte.",
              cta: "Leer FAQ",
              icon: Clock3,
            },
            {
              href: "/devoluciones",
              title: "Devoluciones",
              description: "Entiende cómo funciona la revisión de casos y garantías.",
              cta: "Ver política",
              icon: ShieldCheck,
            },
            {
              href: "/soporte#feedback-form",
              title: "Soporte",
              description: "Si tu dirección o cobertura requiere ayuda, te acompañamos.",
              cta: "Abrir soporte",
              icon: Truck,
            },
          ]}
        />
        </div>
      </StaticPageLayout>
    </>
  );
}
