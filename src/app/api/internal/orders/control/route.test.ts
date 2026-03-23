import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/admin-route", () => ({
  assertCatalogAdminAccess: vi.fn(),
  enforceAdminRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {},
}));

vi.mock("@/lib/discord", () => ({
  isDiscordConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/notifications", () => ({
  isEmailConfigured: vi.fn(() => true),
  notifyOrderStatus: vi.fn(),
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>(
    "@/lib/utils",
  );

  return {
    ...actual,
    isUuid: vi.fn(
      (value: string) => value === "550e8400-e29b-41d4-a716-446655440000",
    ),
  };
});

import {
  assertCatalogAdminAccess,
  enforceAdminRateLimit,
} from "@/lib/admin-route";
import { DELETE, GET, PATCH } from "./route";

describe("internal orders control route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(null);
    vi.mocked(enforceAdminRateLimit).mockResolvedValue(null);
  });

  it("returns auth errors from GET", async () => {
    vi.mocked(assertCatalogAdminAccess).mockReturnValue(
      NextResponse.json({ error: "C\u00f3digo de acceso inv\u00e1lido." }, { status: 401 }),
    );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/internal/orders/control"),
    );

    expect(response.status).toBe(401);
  });

  it("rejects invalid order ids in PATCH", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost:3000/api/internal/orders/control", {
        method: "PATCH",
        body: JSON.stringify({ order_id: "bad-id" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects invalid order ids in DELETE", async () => {
    const response = await DELETE(
      new NextRequest(
        "http://localhost:3000/api/internal/orders/control?id=bad-id",
        {
          method: "DELETE",
        },
      ),
    );

    expect(response.status).toBe(400);
  });
});
