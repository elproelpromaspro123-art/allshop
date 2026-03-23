import { describe, expect, it } from "vitest";
import {
  buildClientErrorFingerprint,
  extractFbclid,
  isHydrationErrorCandidate,
  normalizeClientRuntimeError,
} from "./client-error-monitor";

describe("client error monitor utils", () => {
  it("detects React hydration candidates", () => {
    expect(isHydrationErrorCandidate("Minified React error #418")).toBe(true);
    expect(
      isHydrationErrorCandidate(
        "Hydration failed because the server rendered HTML didn't match the client.",
      ),
    ).toBe(true);
    expect(isHydrationErrorCandidate("Failed to fetch resource")).toBe(false);
  });

  it("normalizes unknown runtime errors safely", () => {
    expect(normalizeClientRuntimeError("boom")).toEqual({
      message: "boom",
      stack: null,
    });

    expect(normalizeClientRuntimeError(new Error("hydration"))).toMatchObject({
      message: "hydration",
    });
  });

  it("extracts fbclid from urls", () => {
    expect(
      extractFbclid("https://vortixy.net/producto/airpods-pro-3?fbclid=test-123"),
    ).toBe("test-123");
    expect(extractFbclid("https://vortixy.net/producto/airpods-pro-3")).toBeNull();
  });

  it("builds stable fingerprints", () => {
    expect(
      buildClientErrorFingerprint({
        source: "window_error",
        pathname: "/producto/airpods-pro-3",
        message: "Minified React error #418",
        filename: "app.js",
        line: 10,
        fbclid: "abc",
      }),
    ).toBe(
      "window_error|/producto/airpods-pro-3|minified react error #418|app.js|10|abc",
    );
  });
});
