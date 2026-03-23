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

vi.mock("@/lib/feedback-discord", () => ({
  isFeedbackWebhookConfigured: vi.fn(() => true),
  sendFeedbackToDiscord: vi.fn(),
}));

import { checkRateLimitDb } from "@/lib/rate-limit";
import {
  sendFeedbackToDiscord,
} from "@/lib/feedback-discord";
import { POST } from "./route";

describe("feedback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 7,
      retryAfterSeconds: 60,
    });
    vi.mocked(sendFeedbackToDiscord).mockResolvedValue(undefined);
  });

  it("rejects invalid feedback types", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "otro",
          name: "Ana",
          email: "ana@example.com",
          message: "Mensaje suficientemente largo.",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("sends feedback when the payload is valid", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          type: "comentario",
          name: "Ana",
          email: "ana@example.com",
          message: "Mensaje suficientemente largo para pasar validacion.",
          orderId: "ORD-1",
          page: "/checkout",
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendFeedbackToDiscord).toHaveBeenCalledTimes(1);
  });
});
