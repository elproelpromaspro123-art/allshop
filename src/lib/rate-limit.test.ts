import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("./supabase-admin", () => ({
  isSupabaseAdminConfigured: true,
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

import {
  checkRateLimit,
  checkRateLimitDb,
  cleanupRateLimitStorage,
} from "./rate-limit";
import { supabaseAdmin } from "./supabase-admin";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(supabaseAdmin.rpc).mockReset();
    // Advance past any previous windows so cleanup actually clears entries
    vi.advanceTimersByTime(10 * 60 * 1000);
    cleanupRateLimitStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("127.0.0.1", "api");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests over limit", () => {
    const ip = "10.0.0.1";
    // Exhaust the checkout limit (5 per minute)
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, "checkout");
    }
    const result = checkRateLimit(ip, "checkout");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses different limits per endpoint", () => {
    const ip = "10.0.0.2";
    // checkout allows 5, api allows 30
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, "checkout");
    }
    const checkoutResult = checkRateLimit(ip, "checkout");
    const apiResult = checkRateLimit(ip, "api");
    expect(checkoutResult.allowed).toBe(false);
    expect(apiResult.allowed).toBe(true);
  });

  it("isolates different IPs", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("10.0.0.3", "checkout");
    }
    const blocked = checkRateLimit("10.0.0.3", "checkout");
    const allowed = checkRateLimit("10.0.0.4", "checkout");
    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });

  it("falls back to api limits for unknown endpoint", () => {
    const result = checkRateLimit("127.0.0.1", "unknown-endpoint");
    expect(result.allowed).toBe(true);
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
