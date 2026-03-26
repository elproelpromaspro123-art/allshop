import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("orders resend-confirmation route", () => {
  it("returns gone for POST", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(body).toMatchObject({
      code: "DEPRECATED_ENDPOINT",
      deprecated: true,
    });
  });

  it("returns gone for GET", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(body).toMatchObject({
      code: "DEPRECATED_ENDPOINT",
      deprecated: true,
    });
  });
});
