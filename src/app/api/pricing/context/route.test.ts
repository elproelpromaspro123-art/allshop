import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("pricing context route", () => {
  it("builds pricing context from country and locale headers", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/pricing/context", {
        headers: {
          "x-vercel-ip-country": "US",
          "accept-language": "en-US,en;q=0.9",
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(response.headers.get("Vary")).toContain("Accept-Language");
    expect(data.countryCode).toBe("US");
    expect(data.locale).toBe("en-US");
    expect(data.currency).toBe("USD");
    expect(data.rateToDisplay).toBe(data.rates.USD);
  });

  it("falls back to Colombia defaults when headers are missing", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/pricing/context"),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.countryCode).toBe("CO");
    expect(data.locale).toBe("es-CO");
    expect(data.currency).toBe("COP");
  });
});
