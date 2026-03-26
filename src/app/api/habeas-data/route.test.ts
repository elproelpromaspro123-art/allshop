import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/csrf", () => ({
  validateCsrfToken: vi.fn(() => true),
  validateSameOrigin: vi.fn(() => true),
}));

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

describe("habeas-data route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 60,
    });
    vi.mocked(sendFeedbackToDiscord).mockResolvedValue(undefined);
  });

  it("rejects invalid request types", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/habeas-data", {
        method: "POST",
        body: JSON.stringify({
          name: "Ana",
          email: "ana@example.com",
          document: "12345678",
          requestType: "otro",
          details: "Necesito revisar mis datos.",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns a rate limit response when the quota is exhausted", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1800,
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/habeas-data", {
        method: "POST",
        body: JSON.stringify({
          name: "Ana",
          email: "ana@example.com",
          document: "12345678",
          requestType: "access",
          details: "Necesito revisar mis datos.",
        }),
      }),
    );

    expect(response.status).toBe(429);
    expect(sendFeedbackToDiscord).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/habeas-data", {
        method: "POST",
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(sendFeedbackToDiscord).not.toHaveBeenCalled();
  });

  it("sends the data request when the payload is valid", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/habeas-data", {
        method: "POST",
        body: JSON.stringify({
          name: "Ana",
          email: "ana@example.com",
          phone: "3001234567",
          document: "12345678",
          requestType: "access",
          details: "Necesito una copia de mis datos.",
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendFeedbackToDiscord).toHaveBeenCalledTimes(1);
  });
});
