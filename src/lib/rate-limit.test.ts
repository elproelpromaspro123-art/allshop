import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, cleanupRateLimitStorage } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
});
