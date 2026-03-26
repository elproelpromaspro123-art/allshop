export const CHECKOUT_RESERVATION_MS = 15 * 60 * 1000;

export function normalizeReservationTimestamp(
  value: string | number | null | undefined,
  now = Date.now(),
): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  if (parsed > now) {
    return now;
  }

  if (now - parsed >= CHECKOUT_RESERVATION_MS) {
    return null;
  }

  return parsed;
}

export function getReservationDeadline(startedAt: number): number {
  return startedAt + CHECKOUT_RESERVATION_MS;
}

export function getReservationRemainingMs(
  startedAt: number,
  now = Date.now(),
): number {
  return Math.max(0, getReservationDeadline(startedAt) - now);
}

export function formatReservationCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
