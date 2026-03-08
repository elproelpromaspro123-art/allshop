import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vortixy",
    short_name: "Vortixy",
    description:
      "Productos seleccionados para Colombia con pago contra entrega y envio nacional.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8f7",
    theme_color: "#49cc68",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

