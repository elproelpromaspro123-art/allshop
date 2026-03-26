import { describe, expect, it } from "vitest";
import {
  renderActionButton,
  renderEmailDocument,
  renderInlineBlock,
  renderOrderItemsTable,
  renderSummaryTable,
} from "./template";

describe("notification templates", () => {
  it("builds a reusable document shell with composed sections", () => {
    const message = renderEmailDocument({
      preheader: "Resumen de pedido",
      brandName: "Vortixy",
      heroTitle: "Actualización de pedido",
      heroSubtitle: "Hola Carlos",
      orderMeta: "Pedido #ABCD1234",
      sections: [
        renderSummaryTable({
          title: "Resumen",
          rows: [
            { label: "Estado", value: "Procesando" },
            { label: "Total", value: "$ 120.000" },
          ],
        }),
        renderInlineBlock({
          title: "Próximo paso",
          body: "Estamos preparando tu despacho.",
        }),
        renderActionButton({
          label: "Ver seguimiento",
          href: "https://vortixy.co/seguimiento",
        }),
      ],
      footerLines: ["Si tienes dudas, responde este correo."],
    });

    expect(message.html).toContain("Actualización de pedido");
    expect(message.html).toContain("Ver seguimiento");
    expect(message.text).toContain("Resumen de pedido");
    expect(message.text).toContain("Próximo paso: Estamos preparando tu despacho.");
    expect(message.text).toContain("Ver seguimiento: https://vortixy.co/seguimiento");
  });

  it("renders order items with quantities and totals", () => {
    const message = renderOrderItemsTable([
      {
        product_id: "prod-1",
        product_name: "Auriculares Pro",
        variant: "Negro",
        quantity: 2,
        price: 75000,
        image: "/images/a.jpg",
      },
    ]);

    expect(message.html).toContain("Auriculares Pro");
    expect(message.html).toContain("Negro");
    const text = Array.isArray(message.text)
      ? message.text.join("\n")
      : message.text;
    expect(text).toContain("2x Auriculares Pro (Negro)");
  });
});
