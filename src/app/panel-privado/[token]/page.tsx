import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PanelTokenBridge } from "@/components/admin/PanelTokenBridge";
import {
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
} from "@/lib/catalog-admin-auth";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Panel Privado | Vortixy",
  description:
    "Acceso protegido al panel operativo de catalogo y pedidos con control manual.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CatalogSecretPage({ params }: Props) {
  const { token } = await params;

  if (!isCatalogAdminPathTokenConfigured()) {
    notFound();
  }

  if (!isCatalogAdminPathTokenValid(token)) {
    notFound();
  }

  return <PanelTokenBridge token={token} />;
}
