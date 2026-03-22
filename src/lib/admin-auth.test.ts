import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isCatalogAdminCodeConfigured,
  isCatalogAdminCodeValid,
  isCatalogAdminPathTokenConfigured,
  isCatalogAdminPathTokenValid,
  isCatalogAdminSessionValid,
  isCatalogAdminAuthorized,
  createCatalogAdminSessionToken,
  parseBearerToken,
  isAdminActionSecretConfigured,
  isAdminActionSecretValid,
} from "./catalog-admin-auth";

const TEST_ACCESS_CODE = "test-access-code-012345678901"; // 30 chars
const TEST_PATH_TOKEN = "test-path-token-abc"; // 19 chars
const TEST_CSRF_SECRET = "test-csrf-secret-xyz";
const TEST_ADMIN_ACTION_SECRET = "admin-action-secret-01234567";

describe("catalog-admin-auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv("CATALOG_ADMIN_ACCESS_CODE", TEST_ACCESS_CODE);
    vi.stubEnv("CATALOG_ADMIN_PATH_TOKEN", TEST_PATH_TOKEN);
    vi.stubEnv("CSRF_SECRET", TEST_CSRF_SECRET);
    vi.stubEnv("ADMIN_BLOCK_SECRET", TEST_ADMIN_ACTION_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = originalEnv;
  });

  describe("isCatalogAdminCodeConfigured", () => {
    it("returns true when access code is set and >= 24 chars", () => {
      expect(isCatalogAdminCodeConfigured()).toBe(true);
    });

    it("returns false when access code is too short", () => {
      vi.stubEnv("CATALOG_ADMIN_ACCESS_CODE", "short");
      expect(isCatalogAdminCodeConfigured()).toBe(false);
    });

    it("returns false when access code is empty", () => {
      vi.stubEnv("CATALOG_ADMIN_ACCESS_CODE", "");
      expect(isCatalogAdminCodeConfigured()).toBe(false);
    });
  });

  describe("isCatalogAdminCodeValid", () => {
    it("returns true for matching code", () => {
      expect(isCatalogAdminCodeValid(TEST_ACCESS_CODE)).toBe(true);
    });

    it("returns false for wrong code", () => {
      expect(isCatalogAdminCodeValid("wrong-code")).toBe(false);
    });

    it("returns false for empty code", () => {
      expect(isCatalogAdminCodeValid("")).toBe(false);
    });
  });

  describe("isCatalogAdminPathTokenConfigured", () => {
    it("returns true when path token is set and >= 12 chars", () => {
      expect(isCatalogAdminPathTokenConfigured()).toBe(true);
    });

    it("returns false when path token is too short", () => {
      vi.stubEnv("CATALOG_ADMIN_PATH_TOKEN", "short");
      expect(isCatalogAdminPathTokenConfigured()).toBe(false);
    });
  });

  describe("isCatalogAdminPathTokenValid", () => {
    it("returns true for matching path token", () => {
      expect(isCatalogAdminPathTokenValid(TEST_PATH_TOKEN)).toBe(true);
    });

    it("returns false for wrong token", () => {
      expect(isCatalogAdminPathTokenValid("wrong-token")).toBe(false);
    });
  });

  describe("createCatalogAdminSessionToken", () => {
    it("returns a non-empty hex string for valid input", () => {
      const token = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(token).toBeTruthy();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("returns empty string for empty input", () => {
      expect(createCatalogAdminSessionToken("")).toBe("");
    });

    it("produces consistent output", () => {
      const a = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      const b = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(a).toBe(b);
    });

    it("produces different output for different input", () => {
      const a = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      const b = createCatalogAdminSessionToken("different-token");
      expect(a).not.toBe(b);
    });
  });

  describe("isCatalogAdminSessionValid", () => {
    it("returns true for valid session token", () => {
      const sessionToken = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(isCatalogAdminSessionValid(sessionToken)).toBe(true);
    });

    it("returns false for invalid session token", () => {
      expect(isCatalogAdminSessionValid("invalid-session")).toBe(false);
    });

    it("returns false for empty session token", () => {
      expect(isCatalogAdminSessionValid("")).toBe(false);
    });
  });

  describe("isCatalogAdminAuthorized", () => {
    it("returns true when bearerToken matches access code", () => {
      expect(
        isCatalogAdminAuthorized({ bearerToken: TEST_ACCESS_CODE }),
      ).toBe(true);
    });

    it("returns true when sessionToken matches valid session", () => {
      const sessionToken = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(isCatalogAdminAuthorized({ sessionToken })).toBe(true);
    });

    it("returns true when both bearer and session are valid", () => {
      const sessionToken = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(
        isCatalogAdminAuthorized({
          bearerToken: TEST_ACCESS_CODE,
          sessionToken,
        }),
      ).toBe(true);
    });

    it("returns false when neither bearer nor session is valid", () => {
      expect(
        isCatalogAdminAuthorized({
          bearerToken: "wrong",
          sessionToken: "wrong",
        }),
      ).toBe(false);
    });

    it("returns false with empty options", () => {
      expect(isCatalogAdminAuthorized({})).toBe(false);
    });

    it("returns false with null values", () => {
      expect(
        isCatalogAdminAuthorized({ bearerToken: null, sessionToken: null }),
      ).toBe(false);
    });

    it("returns true with valid bearer even if session is invalid", () => {
      expect(
        isCatalogAdminAuthorized({
          bearerToken: TEST_ACCESS_CODE,
          sessionToken: "wrong",
        }),
      ).toBe(true);
    });

    it("returns true with valid session even if bearer is invalid", () => {
      const sessionToken = createCatalogAdminSessionToken(TEST_PATH_TOKEN);
      expect(
        isCatalogAdminAuthorized({
          bearerToken: "wrong",
          sessionToken,
        }),
      ).toBe(true);
    });
  });

  describe("parseBearerToken", () => {
    it("extracts token from Bearer header", () => {
      expect(parseBearerToken("Bearer mytoken123")).toBe("mytoken123");
    });

    it("handles case-insensitive Bearer prefix", () => {
      expect(parseBearerToken("bearer mytoken123")).toBe("mytoken123");
    });

    it("returns empty for missing header", () => {
      expect(parseBearerToken(null)).toBe("");
      expect(parseBearerToken(undefined)).toBe("");
    });

    it("returns empty for non-Bearer header", () => {
      expect(parseBearerToken("Basic abc123")).toBe("");
    });

    it("returns empty for empty string", () => {
      expect(parseBearerToken("")).toBe("");
    });
  });

  describe("admin action secret", () => {
    it("isAdminActionSecretConfigured returns true when set", () => {
      expect(isAdminActionSecretConfigured()).toBe(true);
    });

    it("isAdminActionSecretValid returns true for matching secret", () => {
      expect(isAdminActionSecretValid(TEST_ADMIN_ACTION_SECRET)).toBe(true);
    });

    it("isAdminActionSecretValid returns false for wrong secret", () => {
      expect(isAdminActionSecretValid("wrong")).toBe(false);
    });
  });
});
