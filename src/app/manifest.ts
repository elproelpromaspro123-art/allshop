import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Vortixy - Tu Tienda Online en Colombia",
    short_name: "Vortixy",
    description:
      "Productos seleccionados con pago contra entrega en toda Colombia. Sin tarjeta, sin anticipos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#fafbfc",
    theme_color: "#00b87d",
    lang: "es-CO",
    dir: "ltr",
    categories: ["shopping", "ecommerce"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Buscar productos",
        short_name: "Buscar",
        url: "/#productos",
      },
      {
        name: "Ir al checkout",
        short_name: "Checkout",
        url: "/checkout",
      },
      {
        name: "Rastrear pedido",
        short_name: "Seguimiento",
        url: "/seguimiento",
      },
      {
        name: "Soporte",
        short_name: "Soporte",
        url: "/soporte",
      },
    ],
  };
}
