import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/StaticPageLayout";
import { WishlistPageClient } from "@/components/wishlist/WishlistPageClient";

export const metadata: Metadata = {
  title: "Favoritos | Vortixy",
  description:
    "Productos guardados para revisar despues, comparar opciones y retomar la compra sin perder contexto.",
  alternates: {
    canonical: "/favoritos",
  },
};

export default async function WishlistPage() {
  return (
    <StaticPageLayout
      title="Favoritos"
      subtitle="Guarda productos, vuelve a verlos rapido y construye una shortlist real antes de decidir."
      updatedAt="2026-03-25"
      type="help"
    >
      <WishlistPageClient />
    </StaticPageLayout>
  );
}
