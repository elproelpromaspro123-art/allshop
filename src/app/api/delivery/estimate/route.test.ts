import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn(),
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>(
    "@/lib/utils",
  );

  return {
    ...actual,
    getClientIp: vi.fn(() => "127.0.0.1"),
  };
});

import { checkRateLimitDb } from "@/lib/rate-limit";
import { GET } from "./route";

describe("delivery estimate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 8,
      retryAfterSeconds: 60,
    });
  });

  it("falls back to Bogota when no location is available", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/delivery/estimate"),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.location.source).toBe("fallback");
    expect(data.location.department).toBe("Bogota D.C.");
  });

  it("uses Vercel header inference when auto mode is enabled", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/delivery/estimate?auto=1",
      {
        headers: {
          "x-vercel-ip-country": "CO",
          "x-vercel-ip-city": "Medellin",
        },
      },
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.location.inferred_from_headers).toBe(true);
    expect(data.location.department).toBe("Antioquia");
  });
});
