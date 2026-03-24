const usageMode = String(process.env.NEXT_PUBLIC_USAGE_MODE || "")
  .trim()
  .toLowerCase();
const supabasePlan = String(process.env.NEXT_PUBLIC_SUPABASE_PLAN || "")
  .trim()
  .toLowerCase();
const ecoMode = String(process.env.NEXT_PUBLIC_ECO_MODE || "").trim() === "1";

const isFreePlanMode =
  ecoMode || usageMode === "free" || supabasePlan === "free";

export const CATALOG_VERSION_POLL_MS = isFreePlanMode ? 60_000 : 15_000;
export const PRODUCT_STOCK_POLL_MS = isFreePlanMode ? 120_000 : 45_000;
export const MY_ORDERS_POLL_MS = isFreePlanMode ? 60_000 : 20_000;
export const ORDER_CONFIRMATION_POLL_MS = isFreePlanMode ? 60_000 : 20_000;

export const POLLING_MODE_LABEL = isFreePlanMode ? "free" : "standard";
