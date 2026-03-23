import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/logger", () => ({
  logger: {
    securityEvent: vi.fn(),
    checkoutEvent: vi.fn(),
  },
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

import { logger } from "@/lib/logger";
import { POST } from "./route";

describe("checkout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects oversized requests before deeper processing", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-length": String(60 * 1024),
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.code).toBe("REQUEST_TOO_LARGE");
    expect(logger.securityEvent).toHaveBeenCalledWith(
      "suspicious_activity",
      expect.objectContaining({
        type: "oversized_checkout_request",
      }),
    );
  });
});
