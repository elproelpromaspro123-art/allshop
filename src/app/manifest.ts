import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AllShop Premium",
    short_name: "AllShop",
    description:
      "Premium selected products with secure checkout and global shipping options.",
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
