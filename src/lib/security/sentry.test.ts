import { describe, expect, it } from "vitest";
import {
  getRouteSamplingRate,
  getTracePropagationTargets,
  shouldDropSentryEvent,
} from "./sentry";

describe("security sentry helpers", () => {
  it("drops browser extension and fetch noise", () => {
    expect(
      shouldDropSentryEvent({
        message: "Failed to fetch",
        exception: { values: [{ type: "TypeError", value: "Failed to fetch" }] },
      }),
    ).toBe(true);
    expect(
      shouldDropSentryEvent({
        message: "chrome-extension://abcd injected script",
      }),
    ).toBe(true);
  });

  it("keeps product and hydration errors", () => {
    expect(
      shouldDropSentryEvent({
        message: "Minified React error #418",
        transaction: "/producto/airpods-pro-3",
      }),
    ).toBe(false);
  });

  it("uses higher sampling for checkout and admin flows", () => {
    expect(getRouteSamplingRate("/checkout")).toBe(1);
    expect(getRouteSamplingRate("/panel-privado/orders")).toBe(0.75);
    expect(getRouteSamplingRate("/producto/airpods-pro-3")).toBe(0.4);
    expect(getRouteSamplingRate("/categoria/tecnologia")).toBe(0.25);
  });

  it("propagates traces to the configured site origin", () => {
    const targets = getTracePropagationTargets();
    expect(targets).toEqual(
      expect.arrayContaining([expect.stringContaining("localhost")]),
    );
    expect(targets.some((entry) => String(entry).includes("vortixy.net"))).toBe(
      true,
    );
  });
});
