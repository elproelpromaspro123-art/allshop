import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("./supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

import {
  checkRateLimitDb,
  cleanupRateLimitStorage,
} from "./rate-limit";
import { supabaseAdmin } from "./supabase-admin";

describe("checkRateLimitDb", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(supabaseAdmin.rpc).mockReset();
    vi.advanceTimersByTime(10 * 60 * 1000);
    cleanupRateLimitStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the DB-backed bucket result when RPC succeeds", async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: [{ allowed: false, remaining: 0, retry_after_seconds: 45 }],
      error: null,
    } as never);

    const result = await checkRateLimitDb({
      key: "feedback:127.0.0.1",
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("consume_rate_limit_bucket", {
      p_key: "feedback:127.0.0.1",
      p_limit: 8,
      p_window_ms: 10 * 60 * 1000,
    });
    expect(result).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 45,
    });
  });

  it("falls back to in-memory buckets when the RPC fails", async () => {
    vi.mocked(supabaseAdmin.rpc).mockResolvedValue({
      data: null,
      error: { message: "rpc failed" },
    } as never);

    const first = await checkRateLimitDb({
      key: "orders:127.0.0.1",
      limit: 1,
      windowMs: 60_000,
    });
    const second = await checkRateLimitDb({
      key: "orders:127.0.0.1",
      limit: 1,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });
});
