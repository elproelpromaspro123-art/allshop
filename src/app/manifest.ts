import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vortixy",
    short_name: "Vortixy",
    description:
      "Productos seleccionados para Colombia con pago contra entrega y envio nacional.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafbfc",
    theme_color: "#008c55",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

