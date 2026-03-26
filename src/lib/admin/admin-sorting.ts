import type { AdminOrderRow } from "@/types/api";

export const ADMIN_DASHBOARD_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
export const ADMIN_RECENT_ORDER_LIMIT = 10;

export function parseAdminTimestamp(
  value: string | null | undefined,
): number | null {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeAdminTimestamp(
  value: string | null | undefined,
  fallback = new Date(0).toISOString(),
): string {
  const parsed = parseAdminTimestamp(value);
  return parsed === null ? fallback : new Date(parsed).toISOString();
}

export function normalizeAdminOrderStatus(
  value: string | null | undefined,
): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized || "pending";
}

export function sortAdminOrdersByRecentActivity(
  orders: AdminOrderRow[],
): AdminOrderRow[] {
  return [...orders].sort((left, right) => {
    const rightTimestamp = parseAdminTimestamp(right.created_at);
    const leftTimestamp = parseAdminTimestamp(left.created_at);

    if (rightTimestamp !== leftTimestamp) {
      return (rightTimestamp ?? Number.NEGATIVE_INFINITY) -
        (leftTimestamp ?? Number.NEGATIVE_INFINITY);
    }

    return String(left.id).localeCompare(String(right.id), "es-CO");
  });
}

export function isAdminOrderWithinLookback(
  createdAt: string,
  referenceTimeMs = Date.now(),
): boolean {
  const timestamp = parseAdminTimestamp(createdAt);
  if (timestamp === null) return false;
  return timestamp >= referenceTimeMs - ADMIN_DASHBOARD_LOOKBACK_MS;
}
