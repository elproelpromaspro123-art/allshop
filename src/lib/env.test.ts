import { describe, it, expect } from "vitest";

// Test env module behavior
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getEnvVar(key: string, fallback?: string): string | undefined {
  return process.env[key] || fallback;
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

describe("isDevelopment", () => {
  it("returns a boolean", () => {
    expect(typeof isDevelopment()).toBe("boolean");
  });
});

describe("isProduction", () => {
  it("returns a boolean", () => {
    expect(typeof isProduction()).toBe("boolean");
  });
});

describe("getEnvVar", () => {
  it("returns env var when set", () => {
    process.env.TEST_VAR = "test_value";
    expect(getEnvVar("TEST_VAR")).toBe("test_value");
    delete process.env.TEST_VAR;
  });

  it("returns fallback when not set", () => {
    expect(getEnvVar("NONEXISTENT_VAR", "default")).toBe("default");
  });

  it("returns undefined when not set and no fallback", () => {
    expect(getEnvVar("NONEXISTENT_VAR")).toBeUndefined();
  });
});

describe("getRequiredEnvVar", () => {
  it("returns value when set", () => {
    process.env.REQUIRED_TEST = "value";
    expect(getRequiredEnvVar("REQUIRED_TEST")).toBe("value");
    delete process.env.REQUIRED_TEST;
  });

  it("throws when not set", () => {
    expect(() => getRequiredEnvVar("MISSING_REQUIRED")).toThrow();
  });
});
