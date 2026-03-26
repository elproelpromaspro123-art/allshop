import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseState = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    from: supabaseState.from,
  },
}));

import { GET } from "./route";

describe("health route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SMTP_USER", "smtp@example.com");
    vi.stubEnv("SMTP_PASSWORD", "smtp-secret");
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/test");
    vi.stubEnv("GROQ_API", "groq-key");

    supabaseState.from.mockImplementation(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(async () => ({ error: null })),
      })),
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports a healthy status when core checks pass", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.supabase.status).toBe("ok");
    expect(data.checks.catalogRuntime.status).toBe("ok");
    expect(data.checks.smtp.status).toBe("ok");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns unhealthy when the database check fails", async () => {
    supabaseState.from.mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(async () => ({ error: new Error("db down") })),
      })),
    }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.supabase.status).toBe("fail");
  });
});
