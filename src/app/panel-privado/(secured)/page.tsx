import type { Metadata } from "next";
import CatalogControlClient from "../[token]/CatalogControlClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel Privado | Vortixy",
  description:
    "Centro operativo protegido para catalogo, pedidos e inventario de Vortixy.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CatalogPrivatePage() {
  return <CatalogControlClient />;
}
