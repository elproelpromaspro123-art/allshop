import { describe, expect, it } from "vitest";
import {
  CHECKOUT_RESERVATION_MS,
  formatReservationCountdown,
  getReservationDeadline,
  getReservationRemainingMs,
  normalizeReservationTimestamp,
} from "./checkout-reservation";

describe("checkout reservation utilities", () => {
  it("normalizes a valid timestamp", () => {
    const now = Date.UTC(2026, 2, 25, 18, 0, 0);
    const startedAt = now - 60_000;
    expect(normalizeReservationTimestamp(String(startedAt), now)).toBe(
      startedAt,
    );
  });

  it("rejects expired timestamps", () => {
    const now = Date.UTC(2026, 2, 25, 18, 0, 0);
    const startedAt = now - CHECKOUT_RESERVATION_MS - 1_000;
    expect(normalizeReservationTimestamp(startedAt, now)).toBeNull();
  });

  it("clamps future timestamps to now", () => {
    const now = Date.UTC(2026, 2, 25, 18, 0, 0);
    expect(normalizeReservationTimestamp(now + 30_000, now)).toBe(now);
  });

  it("computes deadlines and remaining time", () => {
    const startedAt = Date.UTC(2026, 2, 25, 18, 0, 0);
    expect(getReservationDeadline(startedAt)).toBe(
      startedAt + CHECKOUT_RESERVATION_MS,
    );
    expect(
      getReservationRemainingMs(startedAt, startedAt + 5 * 60 * 1000),
    ).toBe(10 * 60 * 1000);
  });

  it("formats countdown labels", () => {
    expect(formatReservationCountdown(9 * 60 * 1000 + 8_000)).toBe("09:08");
    expect(formatReservationCountdown(1_000)).toBe("00:01");
    expect(formatReservationCountdown(0)).toBe("00:00");
  });
});
