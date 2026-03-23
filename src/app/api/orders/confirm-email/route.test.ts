import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("orders confirm-email route", () => {
  it("returns gone for POST", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      deprecated: true,
    });
  });

  it("returns gone for GET", async () => {
    const response = await GET();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      deprecated: true,
    });
  });
});
