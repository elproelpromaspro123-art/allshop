import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PanelSessionLogin } from "@/components/admin/PanelSessionLogin";
import {
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminSessionValid,
} from "@/lib/catalog-admin-auth";

export const dynamic = "force-dynamic";

export default async function PanelPrivadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCatalogAdminPathTokenConfigured()) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("catalog_admin_session")?.value || "";

  if (!isCatalogAdminSessionValid(sessionToken)) {
    return <PanelSessionLogin />;
  }

  return <>{children}</>;
}
