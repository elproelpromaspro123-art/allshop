import { AdminRouteFrame } from "@/components/admin/shell/AdminRouteFrame";

export const dynamic = "force-dynamic";

export default async function PanelPrivadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminRouteFrame>{children}</AdminRouteFrame>;
}
