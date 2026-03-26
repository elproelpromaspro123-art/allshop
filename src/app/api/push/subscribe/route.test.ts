import { describe, it, expect } from "vitest";

// Test the push subscription validation logic
function validatePushSubscription(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Body must be an object" };
  }

  const record = body as Record<string, unknown>;

  if (!record.endpoint || typeof record.endpoint !== "string") {
    return { valid: false, error: "Missing or invalid endpoint" };
  }

  if (!record.keys || typeof record.keys !== "object") {
    return { valid: false, error: "Missing keys object" };
  }

  const keys = record.keys as Record<string, unknown>;

  if (!keys.p256dh || typeof keys.p256dh !== "string") {
    return { valid: false, error: "Missing keys.p256dh" };
  }

  if (!keys.auth || typeof keys.auth !== "string") {
    return { valid: false, error: "Missing keys.auth" };
  }

  return { valid: true };
}

describe("validatePushSubscription", () => {
  it("accepts valid subscription", () => {
    const result = validatePushSubscription({
      endpoint: "https://fcm.googleapis.com/fcm/send/test",
      keys: {
        p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlMx5B6FZCOHa6uVF4T7H5YR7WUa2dLz_GaRcHI",
        auth: "tBHItJI5svbpC7",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing endpoint", () => {
    const result = validatePushSubscription({
      keys: { p256dh: "abc", auth: "def" },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("endpoint");
  });

  it("rejects missing keys", () => {
    const result = validatePushSubscription({
      endpoint: "https://test.com",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("keys");
  });

  it("rejects missing p256dh", () => {
    const result = validatePushSubscription({
      endpoint: "https://test.com",
      keys: { auth: "def" },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("p256dh");
  });

  it("rejects missing auth", () => {
    const result = validatePushSubscription({
      endpoint: "https://test.com",
      keys: { p256dh: "abc" },
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("auth");
  });

  it("rejects null body", () => {
    const result = validatePushSubscription(null);
    expect(result.valid).toBe(false);
  });

  it("rejects string body", () => {
    const result = validatePushSubscription("invalid");
    expect(result.valid).toBe(false);
  });
});
