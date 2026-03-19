import { describe, expect, it } from "vitest";
import {
  shouldPreferLocalStorefrontAnswer,
  wantsAddToCart,
  wantsBuyNow,
  wantsComparison,
} from "./chatbot-intent";
import {
  collectChatSources,
  normalizeExecutedToolType,
  uniqueToolTypes,
} from "./chatbot-runtime";

describe("chatbot intent", () => {
  it("prefers local answers for store operations", () => {
    expect(
      shouldPreferLocalStorefrontAnswer(
        "Como funciona el pago contra entrega en Vortixy?",
      ),
    ).toBe(true);
    expect(
      shouldPreferLocalStorefrontAnswer(
        "Necesito ayuda con envios y seguimiento del pedido",
      ),
    ).toBe(true);
  });

  it("allows broader research for non-store recommendation queries", () => {
    expect(
      shouldPreferLocalStorefrontAnswer("Que smartwatch sirve para correr?"),
    ).toBe(false);
  });

  it("detects direct purchase intents for cart actions", () => {
    expect(wantsAddToCart("Agregalo al carrito")).toBe(true);
    expect(wantsBuyNow("Compralo ya")).toBe(true);
    expect(wantsComparison("Comparalo con otra opcion")).toBe(true);
  });
});

describe("chatbot runtime helpers", () => {
  it("normalizes Groq tool names to the UI vocabulary", () => {
    expect(normalizeExecutedToolType("search")).toBe("web_search");
    expect(normalizeExecutedToolType("visit")).toBe("visit_website");
    expect(normalizeExecutedToolType("python")).toBe("code_interpreter");
    expect(normalizeExecutedToolType("browser_automation")).toBe(
      "browser_automation",
    );

    expect(
      uniqueToolTypes([
        { type: "search" },
        { type: "visit" },
        { type: "python" },
        { type: "search" },
      ]),
    ).toEqual(["web_search", "visit_website", "code_interpreter"]);
  });

  it("keeps only official store sources when official-only mode is enabled", () => {
    const sources = collectChatSources(
      [
        {
          search_results: {
            results: [
              {
                title: "Envios Vortixy",
                url: "https://vortixy.net/envios",
                content: "Cobertura nacional y pago contra entrega.",
              },
              {
                title: "Vortex Logistics",
                url: "https://example.com/vortex-logistics",
                content: "Empresa externa no relacionada.",
              },
            ],
          },
          browser_results: [
            {
              title: "Seguimiento",
              url: "https://www.vortixy.net/seguimiento",
              content: "Consulta tu pedido.",
              live_view_url: "https://www.vortixy.net/seguimiento",
            },
          ],
        },
      ],
      { baseUrl: "https://vortixy.net", officialOnly: true },
    );

    expect(sources).toHaveLength(2);
    expect(sources.map((source) => source.url)).toEqual([
      "https://vortixy.net/envios",
      "https://www.vortixy.net/seguimiento",
    ]);
  });
});
