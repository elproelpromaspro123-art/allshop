import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/ip-block", () => ({
  blockIp: vi.fn(),
  unblockIp: vi.fn(),
}));

vi.mock("@/lib/discord", () => ({
  sendBlockNotificationToDiscord: vi.fn(),
}));

vi.mock("@/lib/catalog-admin-auth", () => ({
  isAdminActionSecretConfigured: vi.fn(() => true),
  isAdminActionSecretValid: vi.fn(() => true),
  parseBearerToken: vi.fn(() => "secret"),
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
    isValidIpAddress: vi.fn((value: string) => value === "127.0.0.1"),
  };
});

import { unblockIp } from "@/lib/ip-block";
import { checkRateLimitDb } from "@/lib/rate-limit";
import { POST } from "./route";

describe("admin block-ip route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 60,
    });
  });

  it("rejects invalid ip addresses", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/block-ip", {
        method: "POST",
        headers: { authorization: "Bearer secret" },
        body: JSON.stringify({
          ip: "nota-valid-ip",
          duration: "24h",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("unblocks a valid ip", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/block-ip", {
        method: "POST",
        headers: { authorization: "Bearer secret" },
        body: JSON.stringify({
          ip: "127.0.0.1",
          action: "unblock",
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(unblockIp).toHaveBeenCalledWith("127.0.0.1");
  });
});
