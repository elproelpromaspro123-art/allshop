import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, POST } from "./route";

vi.mock("@/lib/catalog-admin-auth", () => ({
  createCatalogAdminSessionToken: vi.fn(() => "session-token-hash"),
  isCatalogAdminPathTokenConfigured: vi.fn(() => true),
  isCatalogAdminPathTokenValid: vi.fn(() => true),
}));

vi.mock("@/lib/csrf", () => ({
  validateSameOrigin: vi.fn(() => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitDb: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 5,
    retryAfterSeconds: 60,
  }),
}));

vi.mock("@/lib/utils", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

import {
  createCatalogAdminSessionToken,
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
} from "@/lib/catalog-admin-auth";
import { validateSameOrigin } from "@/lib/csrf";
import { checkRateLimitDb } from "@/lib/rate-limit";

describe("panel session route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: true,
      remaining: 5,
      retryAfterSeconds: 60,
    });
    vi.mocked(isCatalogAdminPathTokenConfigured).mockReturnValue(true);
    vi.mocked(isCatalogAdminPathTokenValid).mockReturnValue(true);
    vi.mocked(createCatalogAdminSessionToken).mockReturnValue(
      "session-token-hash",
    );
    vi.mocked(validateSameOrigin).mockReturnValue(true);
  });

  it("returns rate limit metadata when the login is throttled", async () => {
    vi.mocked(checkRateLimitDb).mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/panel/session", {
        method: "POST",
        body: JSON.stringify({ token: "secret-token" }),
      }),
    );

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(data.retryAfterSeconds).toBe(42);
  });

  it("rejects invalid private tokens", async () => {
    vi.mocked(isCatalogAdminPathTokenValid).mockReturnValue(false);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/panel/session", {
        method: "POST",
        body: JSON.stringify({ token: "invalid-token" }),
      }),
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.code).toBe("INVALID_PANEL_TOKEN");
  });

  it("creates a session cookie for valid panel logins", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/internal/panel/session", {
        method: "POST",
        body: JSON.stringify({ token: "valid-token" }),
      }),
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(response.cookies.get("catalog_admin_session")?.value).toBe(
      "session-token-hash",
    );
  });

  it("clears the session cookie on logout", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/internal/panel/session", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("catalog_admin_session")?.value).toBe("");
  });
});
