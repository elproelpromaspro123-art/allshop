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
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(data.location.source).toBe("fallback");
    expect(data.location.department).toBe("Bogota D.C.");
    expect(data.meta.availableDepartmentsCount).toBeGreaterThan(10);
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
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=180");
    expect(data.location.inferred_from_headers).toBe(true);
    expect(data.location.department).toBe("Antioquia");
  });

  it("returns 429 with retry headers when rate limit blocks the request", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 45,
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/delivery/estimate"),
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("45");
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
  });
});
