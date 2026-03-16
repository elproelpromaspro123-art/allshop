import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
} from "@/lib/catalog-admin-auth";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Panel Privado",
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

  redirect("/panel-privado");
}
