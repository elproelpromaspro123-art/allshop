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

vi.mock("@/lib/discord", async () => {
  const actual = await vi.importActual<typeof import("@/lib/discord")>(
    "@/lib/discord",
  );

  return {
    ...actual,
    sendClientRuntimeErrorToDiscord: vi.fn(),
  };
});

import { checkRateLimitDb } from "@/lib/rate-limit";
import { sendClientRuntimeErrorToDiscord } from "@/lib/discord";
import { POST } from "./route";

describe("client errors route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 60,
    });
    vi.mocked(sendClientRuntimeErrorToDiscord).mockResolvedValue(undefined);
  });

  it("reports hydration-like client errors", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/client-errors", {
        method: "POST",
        body: JSON.stringify({
          source: "window_error",
          message: "Minified React error #418",
          stack: "Hydration failed at ProductPageClient",
          pathname: "/producto/airpods-pro-3",
          href: "https://vortixy.net/producto/airpods-pro-3?fbclid=test-ad",
          referrer: "https://l.facebook.com/",
          userAgent: "MetaBrowser",
          fbclid: "test-ad",
          filename: "app.js",
          line: 12,
          column: 4,
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendClientRuntimeErrorToDiscord).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Minified React error #418",
        pathname: "/producto/airpods-pro-3",
        fbclid: "test-ad",
        clientIp: "127.0.0.1",
      }),
    );
  });

  it("ignores unrelated client errors", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/client-errors", {
        method: "POST",
        body: JSON.stringify({
          source: "window_error",
          message: "Script error.",
          pathname: "/producto/airpods-pro-3",
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.ok).toBe(true);
    expect(sendClientRuntimeErrorToDiscord).not.toHaveBeenCalled();
  });
});
