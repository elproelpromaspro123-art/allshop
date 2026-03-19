import { describe, expect, it, vi } from "vitest";

const storefrontFixtures = vi.hoisted(() => ({
  categories: [
    {
      id: "cat-audio",
      name: "Audio",
      slug: "audio",
      description: "Audifonos y accesorios de sonido.",
      image_url: null,
      icon: null,
      color: null,
      created_at: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "cat-seguridad",
      name: "Seguridad",
      slug: "seguridad",
      description: "Camaras y monitoreo.",
      image_url: null,
      icon: null,
      color: null,
      created_at: "2026-03-01T00:00:00.000Z",
    },
  ],
  products: [
    {
      id: "prod-buds",
      name: "Audifonos xiaomi Redmi Buds 4 Lite",
      slug: "audifonos-xiaomi-redmi-buds-4-lite",
      description: "Audifonos bluetooth livianos con estuche de carga y buen sonido.",
      price: 85000,
      compare_at_price: null,
      category_id: "cat-audio",
      images: ["/images/buds.webp"],
      variants: [],
      stock_location: "nacional" as const,
      free_shipping: false,
      shipping_cost: 10000,
      provider_api_url: null,
      is_featured: true,
      is_active: true,
      is_bestseller: true,
      meta_title: null,
      meta_description: null,
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-12T00:00:00.000Z",
      reviews_count: 34,
      average_rating: 4.7,
    },
    {
      id: "prod-cam",
      name: "Camara de Seguridad Bombillo 360 WiFi Inteligente",
      slug: "camara-de-seguridad-bombillo-360-wifi-inteligente",
      description: "Camara con vision 360, monitoreo remoto y conexion WiFi.",
      price: 129900,
      compare_at_price: null,
      category_id: "cat-seguridad",
      images: ["/images/camara.webp"],
      variants: [],
      stock_location: "nacional" as const,
      free_shipping: true,
      shipping_cost: 0,
      provider_api_url: null,
      is_featured: false,
      is_active: true,
      is_bestseller: false,
      meta_title: null,
      meta_description: null,
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-10T00:00:00.000Z",
      reviews_count: 18,
      average_rating: 4.3,
    },
  ],
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("@/lib/db", () => ({
  getCategories: vi.fn(async () => storefrontFixtures.categories),
  getProducts: vi.fn(async () => storefrontFixtures.products),
}));

import { getChatbotStorefrontContext } from "./chatbot-storefront";

describe("chatbot storefront context", () => {
  it("keeps the current product for generic add-to-cart requests", async () => {
    const context = await getChatbotStorefrontContext({
      latestUserMessage: "agregalo al carrito",
      pageUrl: "https://vortixy.net/producto/audifonos-xiaomi-redmi-buds-4-lite",
      conversationMessages: [
        { role: "assistant", content: "Te muestro Camara de Seguridad Bombillo 360 WiFi Inteligente." },
        { role: "user", content: "agregalo al carrito" },
      ],
    });

    expect(context.action).toMatchObject({
      type: "add_to_cart",
      targetType: "cart",
      path: "/producto/audifonos-xiaomi-redmi-buds-4-lite",
    });

    if (!context.action || !("product" in context.action)) {
      throw new Error("Expected cart action with product payload.");
    }

    expect(context.action.product.slug).toBe("audifonos-xiaomi-redmi-buds-4-lite");
    expect(context.fallbackAnswer).toContain("Audifonos xiaomi Redmi Buds 4 Lite");
  });

  it("prioritizes checkout navigation over stale product carryover", async () => {
    const context = await getChatbotStorefrontContext({
      latestUserMessage: "llevame al checkout",
      pageUrl: "https://vortixy.net/producto/audifonos-xiaomi-redmi-buds-4-lite",
      conversationMessages: [
        { role: "assistant", content: "Te muestro Camara de Seguridad Bombillo 360 WiFi Inteligente." },
        { role: "user", content: "llevame al checkout" },
      ],
    });

    expect(context.action).toMatchObject({
      type: "navigate",
      targetType: "page",
      path: "/checkout",
    });
    expect(context.fallbackAnswer.toLowerCase()).toContain("checkout");
  });

  it("opens the shipping section when the user asks for it inside checkout", async () => {
    const context = await getChatbotStorefrontContext({
      latestUserMessage: "llevame a la parte de envio",
      pageUrl: "https://vortixy.net/checkout",
      conversationMessages: [{ role: "user", content: "llevame a la parte de envio" }],
    });

    expect(context.action).toMatchObject({
      type: "navigate",
      targetType: "section",
      path: "/checkout",
      sectionId: "checkout-envio",
    });
  });
});
