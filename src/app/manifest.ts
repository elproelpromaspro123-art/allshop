import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vortixy - Tu Tienda Online en Colombia",
    short_name: "Vortixy",
    description:
      "Productos seleccionados con pago contra entrega en toda Colombia. Sin tarjeta, sin anticipos.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafbfc",
    theme_color: "#00b87d",
    categories: ["shopping", "ecommerce"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
