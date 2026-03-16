import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CatalogControlClient from "./[token]/CatalogControlClient";
import {
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
} from "@/lib/catalog-admin-auth";

export const dynamic = "force-dynamic";

export default function CatalogPrivatePage() {
  if (!isCatalogAdminPathTokenConfigured()) {
    notFound();
  }

  const sessionToken =
    cookies().get("catalog_admin_session")?.value || "";

  if (!isCatalogAdminPathTokenValid(sessionToken)) {
    notFound();
  }

  return <CatalogControlClient />;
}
