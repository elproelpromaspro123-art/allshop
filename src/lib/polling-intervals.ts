const usageMode = String(process.env.NEXT_PUBLIC_USAGE_MODE || "")
  .trim()
  .toLowerCase();
const supabasePlan = String(process.env.NEXT_PUBLIC_SUPABASE_PLAN || "")
  .trim()
  .toLowerCase();
const ecoMode = String(process.env.NEXT_PUBLIC_ECO_MODE || "").trim() === "1";

const isFreePlanMode =
  ecoMode || usageMode === "free" || supabasePlan === "free";

export const CATALOG_VERSION_POLL_MS = isFreePlanMode ? 90_000 : 15_000;
export const PRODUCT_STOCK_POLL_MS = isFreePlanMode ? 180_000 : 45_000;
export const MY_ORDERS_POLL_MS = isFreePlanMode ? 90_000 : 20_000;
export const ORDER_CONFIRMATION_POLL_MS = isFreePlanMode ? 90_000 : 20_000;
export const LIVE_VISITORS_HEARTBEAT_MS = isFreePlanMode ? 60_000 : 30_000;
export const LIVE_VISITORS_DRIFT_MIN_MS = isFreePlanMode ? 45_000 : 25_000;
export const LIVE_VISITORS_DRIFT_MAX_MS = isFreePlanMode ? 75_000 : 50_000;
export const ENGAGEMENT_WIDGET_DELAY_MS = isFreePlanMode ? 2_500 : 1_500;

export const POLLING_MODE_LABEL = isFreePlanMode ? "free" : "standard";
