import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, Scale, ShieldCheck, Truck } from "lucide-react";
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
    title: t("policy.returns.title"),
    description: t("policy.returns.metaDescription"),
    path: "/devoluciones",
  });
}

export default async function ReturnsPage() {
  const t = await getServerT();
  const title = t("policy.returns.title");
  const description = t("policy.returns.metaDescription");
  const structuredData = [
    generateWebPageJsonLd({
      title,
      description,
      path: "/devoluciones",
    }),
    generateBreadcrumbJsonLd(
      buildStaticPageBreadcrumbs({
        title,
        path: "/devoluciones",
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
        subtitle={t("policy.returns.subtitle")}
        updatedAt="2026-03-14"
        type="help"
        path="/devoluciones"
      >
        <div className="space-y-6">
        <HelpHero
          eyebrow="Garantia y revision"
          title="Si algo sale mal, te explicamos como revisarlo."
          description="Aqui te contamos cuando aplica garantia, que datos necesitamos y como sigue la revision. Sin letra pequena ni respuestas enredadas."
          stats={[
            { label: "Ventana", value: "Segun garantia" },
            { label: "Apoyo", value: "Humano" },
            { label: "Ruta", value: "Soporte y seguimiento" },
          ]}
          actions={
            <>
              <Link
                href="/soporte#feedback-form"
                className={buttonVariants({ size: "sm", className: "gap-2" })}
              >
                  Abrir soporte
                  <Scale className="h-4 w-4" />
              </Link>
              <Link
                href="/faq"
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "gap-2",
                })}
              >
                  Revisar FAQ
                  <ShieldCheck className="h-4 w-4" />
              </Link>
              <Link
                href="/envios"
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className: "gap-2",
                })}
              >
                  Ver envios
                  <Truck className="h-4 w-4" />
              </Link>
            </>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <ContentBlock
            title={t("policy.returns.requestWindowTitle")}
            variant="highlight"
          >
            <p>{t("policy.returns.requestWindowText")}</p>
            <p className="text-xs text-slate-500">
              Si el caso necesita una validacion extra, te explicamos el
              siguiente paso con claridad.
            </p>
          </ContentBlock>

          <ContentBlock title="Que debes incluir">
            <ContentList
              items={[
                "Correo o referencia del pedido.",
                "Una explicacion corta de lo que paso.",
                "Fotos o evidencia si el producto llego con alguna novedad.",
              ]}
            />
          </ContentBlock>
        </div>

        <ContentBlock title="Como pedir revision">
          <ContentList
            items={[
              "Escribes a soporte con tu numero de pedido y nos cuentas el caso.",
              "Si hace falta, adjuntas fotos o evidencia para revisarlo mejor.",
              "Miramos si aplica cambio, revision o reembolso segun la garantia.",
              "Si falta algo, te pedimos solo lo necesario para avanzar.",
            ]}
          />
        </ContentBlock>

        <div className="grid gap-5 lg:grid-cols-2">
          <ContentBlock title={t("policy.returns.eligibilityTitle")}>
            <ContentList
              items={[
                t("policy.returns.eligibility1"),
                t("policy.returns.eligibility2"),
                t("policy.returns.eligibility3"),
              ]}
            />
          </ContentBlock>

          <ContentBlock
            title={t("policy.returns.nonEligibleTitle")}
            variant="highlight"
          >
            <ContentList
              variant="dot"
              items={[
                t("policy.returns.nonEligible1"),
                t("policy.returns.nonEligible2"),
              ]}
            />
          </ContentBlock>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <ContentBlock title={t("policy.returns.refundTitle")} variant="highlight">
            <p>{t("policy.returns.refundText")}</p>
          </ContentBlock>

          <ContentBlock title="Antes de abrir el caso">
            <ContentList
              items={[
                "Revisa que tengas el correo o referencia del pedido.",
                "Ten a mano fotos si hubo novedad al recibir.",
                "Escribe por soporte para que el caso llegue al canal correcto.",
              ]}
            />
          </ContentBlock>
        </div>

        <ContentBlock title="Ruta de respuesta">
          <ContentList
            items={[
              "Te confirmamos que recibimos tu mensaje.",
              "Revisamos la garantía y el contexto del pedido.",
              "Te contamos el resultado y el siguiente paso.",
              "Si toca seguimiento, te dejamos claro como continuar.",
            ]}
          />
        </ContentBlock>

        <HelpLinkGrid
          items={[
            {
              href: "/soporte#feedback-form",
              title: "Soporte",
              description:
                "Abre el canal correcto si quieres que revisemos tu caso.",
              cta: "Contactar soporte",
              icon: Scale,
            },
            {
              href: "/faq",
              title: "Preguntas frecuentes",
              description:
                "Repasa las dudas más comunes antes de iniciar un caso.",
              cta: "Ir a FAQ",
              icon: ShieldCheck,
            },
            {
              href: "/envios",
              title: "Envios",
              description: "Entiende como se calcula el despacho para tu pedido.",
              cta: "Ver logistica",
              icon: Truck,
            },
          ]}
        />

        <div className="rounded-[1.4rem] border border-emerald-200/60 bg-emerald-50/40 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="editorial-kicker w-fit">Revision guiada</p>
              <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">
                Si tu caso no encaja en lo tipico, igual lo revisamos. Cuentanos
                bien lo que paso y te respondemos con una salida clara.
              </p>
            </div>
            <Link
              href="/soporte#feedback-form"
              className={buttonVariants({ className: "gap-2" })}
            >
                Iniciar revision
                <RotateCcw className="h-4 w-4" />
            </Link>
          </div>
        </div>
        </div>
      </StaticPageLayout>
    </>
  );
}
