import type { OrderStatus } from "./database";

/* ─── Generic API Response ────────────────────────────────────────── */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
  meta?: Record<string, unknown>;
}

export interface SearchProductResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  category_id: string;
  category_name: string;
  category_slug: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  reviews_count?: number;
  average_rating?: number;
  free_shipping?: boolean;
  stock_location?: string;
}

export interface SearchCategoryFacet {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface SearchProductsPayload {
  query: string;
  count: number;
  products: SearchProductResult[];
  categories: SearchCategoryFacet[];
}

/* ─── Health Endpoint ─────────────────────────────────────────────── */

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckEntry {
  status: "ok" | "warn" | "fail";
  message?: string;
  latencyMs?: number;
}

export interface HealthCheckResult {
  status: HealthStatus;
  checks: {
    supabase: HealthCheckEntry;
    smtp: HealthCheckEntry;
    discord: HealthCheckEntry;
    groq: HealthCheckEntry;
    catalogRuntime: HealthCheckEntry;
  };
  uptimeSeconds: number;
  timestamp: string;
}

/* ─── Order Notes (Structured) ────────────────────────────────────── */

export interface OrderNotesFulfillment {
  tracking_candidates?: string[];
  provider_order_references?: string[];
  dispatched_at?: string;
  updated_at?: string;
  source?: string;
}

export interface OrderNotesAdminControl {
  last_internal_note?: string | null;
  last_internal_note_at?: string;
  last_customer_note?: string | null;
  last_customer_note_at?: string;
  updated_at?: string;
  updated_by?: string;
  history?: OrderNotesHistoryEntry[];
}

export interface OrderNotesHistoryEntry {
  at: string;
  type: string;
  value?: string;
  from?: OrderStatus;
  to?: OrderStatus;
  action?: string;
  by?: string;
}

export interface OrderNotesCustomerUpdates {
  latest_note?: string | null;
  latest_note_at?: string;
  source?: string;
}

export interface OrderNotesManualReview {
  completed?: boolean;
  completed_at?: string;
  completed_by?: string;
}

export interface OrderNotesStructured {
  fulfillment?: OrderNotesFulfillment;
  admin_control?: OrderNotesAdminControl;
  customer_updates?: OrderNotesCustomerUpdates;
  manual_review?: OrderNotesManualReview;
  previous_notes?: string;
}

/* ─── Admin Dashboard Metrics ─────────────────────────────────────── */

export interface AdminDashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  backlogOrders: number;
  totalRevenue: number;
  recentRevenue: number;
  averageOrderValue: number;
  ordersThisWeek: number;
  fulfillmentRate: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryPressure: number;
  catalogCoverage: number;
}

export interface AdminInventoryRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  is_active: boolean;
  category_id: string;
}

export interface AdminOrderRow {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  created_at: string;
}

export interface AdminRecentOrderRow {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export interface AdminDashboardPayload extends AdminDashboardMetrics {
  recentOrders: AdminRecentOrderRow[];
}
