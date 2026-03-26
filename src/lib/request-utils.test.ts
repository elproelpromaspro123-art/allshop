import { describe, it, expect } from "vitest";

// Test request/HTTP utilities
function buildHeaders(options: {
  contentType?: string;
  accept?: string;
  authorization?: string;
  csrfToken?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": options.contentType || "application/json",
  };
  if (options.accept) headers["Accept"] = options.accept;
  if (options.authorization) headers["Authorization"] = options.authorization;
  if (options.csrfToken) headers["x-csrf-token"] = options.csrfToken;
  return headers;
}

function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function buildApiUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, "https://api.example.com");
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

describe("buildHeaders", () => {
  it("includes content type", () => {
    const headers = buildHeaders({});
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes custom content type", () => {
    const headers = buildHeaders({ contentType: "text/plain" });
    expect(headers["Content-Type"]).toBe("text/plain");
  });

  it("includes CSRF token", () => {
    const headers = buildHeaders({ csrfToken: "abc123" });
    expect(headers["x-csrf-token"]).toBe("abc123");
  });

  it("includes authorization", () => {
    const headers = buildHeaders({ authorization: "Bearer token" });
    expect(headers["Authorization"]).toBe("Bearer token");
  });
});

describe("parseQueryParams", () => {
  it("parses query string", () => {
    const result = parseQueryParams("a=1&b=2");
    expect(result).toEqual({ a: "1", b: "2" });
  });

  it("handles empty query", () => {
    expect(parseQueryParams("")).toEqual({});
  });
});

describe("buildApiUrl", () => {
  it("builds URL with path", () => {
    const url = buildApiUrl("/products");
    expect(url).toContain("/products");
  });

  it("builds URL with params", () => {
    const url = buildApiUrl("/products", { q: "test" });
    expect(url).toContain("q=test");
  });
});
