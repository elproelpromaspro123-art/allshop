import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOrderHistoryAccessEmailMessage,
  buildOrderStatusEmailMessage,
} from "./order-emails";

const baseOrder = {
  id: "order-12345678",
  customer_name: "Carlos Garcia Lopez",
  customer_email: "carlos@example.com",
  total: 180000,
  status: "processing" as const,
  notes: JSON.stringify({
    fulfillment: {
      tracking_candidates: ["TRK-998877"],
      provider_order_references: ["REF-555"],
    },
    customer_updates: {
      latest_note: "Empaquetar en caja discreta\nLlamar antes de entregar.",
    },
    manual_review: {
      completed: true,
      completed_at: "2026-03-25T14:30:00.000Z",
    },
  }),
  items: [
    {
      product_id: "prod-1",
      product_name: "Auriculares Pro",
      variant: "Negro",
      quantity: 2,
      price: 75000,
      image: "/images/a.jpg",
    },
  ],
};

describe("buildOrderStatusEmailMessage", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://vortixy.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds a reusable status email with structured sections", () => {
    const message = buildOrderStatusEmailMessage(baseOrder, "shipped");

    expect(message.subject).toContain("Tu pedido va en camino");
    expect(message.subject).toContain("#ORDER-12");
    expect(message.html).toContain("Resumen");
    expect(message.html).toContain("Ver seguimiento");
    expect(message.html).toContain("Auriculares Pro");
    expect(message.text).toContain("Guía de seguimiento: TRK-998877");
    expect(message.text).toContain("Referencia de despacho: REF-555");
    expect(message.text).toContain("Próximo paso:");
  });

  it("keeps the manual-review block and multiline note readable", () => {
    const message = buildOrderStatusEmailMessage(baseOrder, "processing");

    expect(message.html).toContain("Revisión manual completada");
    expect(message.text).toContain("Empaquetar en caja discreta");
    expect(message.text).toContain("Llamar antes de entregar.");
  });
});

describe("buildOrderHistoryAccessEmailMessage", () => {
  it("builds a safe history access email", () => {
    const message = buildOrderHistoryAccessEmailMessage({
      email: "  Carlos@Example.com  ",
      link: "https://vortixy.co/orden/historial/token-123",
    });

    expect(message.subject).toBe("Vortixy: Acceso a tu historial de pedidos");
    expect(message.html).toContain("Ver historial de pedidos");
    expect(message.text).toContain("Correo destino: carlos@example.com");
    expect(message.text).toContain("https://vortixy.co/orden/historial/token-123");
  });
});
