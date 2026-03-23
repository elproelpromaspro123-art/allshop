import { PRODUCTS } from "@/data/mock";
import { listCatalogControlProducts } from "@/lib/catalog-runtime";
import { normalizeProductSlug } from "@/lib/legacy-product-slugs";
import { getManualStockSnapshot } from "@/lib/manual-stock";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import type {
  AdminInventoryRow,
  AdminOrderRow,
  AdminRecentOrderRow,
} from "@/types/api";

export const ADMIN_LOW_STOCK_THRESHOLD = 5;

interface AdminInventorySourceRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  is_active: boolean;
  category_id: string;
}

interface AdminOrderSourceRow {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
}

function normalizeSlug(value: string | null | undefined): string {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  return normalizeProductSlug(raw) || raw;
}

function resolveInventoryStock(
  slug: string,
  stockBySlug: Map<string, number>,
): number {
  const normalizedSlug = normalizeSlug(slug);
  if (stockBySlug.has(normalizedSlug)) {
    return Math.max(0, Math.floor(stockBySlug.get(normalizedSlug) || 0));
  }

  const snapshot = getManualStockSnapshot(normalizedSlug);
  if (typeof snapshot?.total_stock === "number") {
    return Math.max(0, Math.floor(snapshot.total_stock));
  }

  if (
    snapshot?.variants.length &&
    snapshot.variants.every((variant) => typeof variant.stock === "number")
  ) {
    return snapshot.variants.reduce(
      (sum, variant) => sum + Number(variant.stock || 0),
      0,
    );
  }

  return 0;
}

function toAdminInventoryRow(
  source: AdminInventorySourceRow,
  stockBySlug: Map<string, number>,
): AdminInventoryRow {
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    price: Math.max(0, Math.floor(Number(source.price) || 0)),
    stock: resolveInventoryStock(source.slug, stockBySlug),
    is_active: source.is_active,
    category_id: source.category_id,
  };
}

function toAdminInventorySourceRow(
  source: Partial<AdminInventorySourceRow>,
): AdminInventorySourceRow {
  return {
    id: String(source.id || ""),
    name: String(source.name || ""),
    slug: String(source.slug || ""),
    price: Math.max(0, Math.floor(Number(source.price) || 0)),
    is_active: source.is_active !== false,
    category_id: String(source.category_id || ""),
  };
}

function toAdminOrderRow(source: AdminOrderSourceRow): AdminOrderRow {
  return {
    id: String(source.id || ""),
    customer_name: String(source.customer_name || "Cliente sin nombre"),
    email: String(source.customer_email || ""),
    phone: String(source.customer_phone || ""),
    total: Math.max(0, Math.floor(Number(source.total) || 0)),
    status: String(source.status || "pending"),
    created_at: String(source.created_at || new Date(0).toISOString()),
  };
}

export function buildAdminRecentOrders(
  orders: AdminOrderRow[],
  limit = 10,
): AdminRecentOrderRow[] {
  return orders.slice(0, limit).map((order) => ({
    id: order.id,
    customer_name: order.customer_name,
    total: order.total,
    status: order.status,
    created_at: order.created_at,
  }));
}

export function getAdminInventoryStats(rows: AdminInventoryRow[]) {
  return {
    totalProducts: rows.length,
    lowStockProducts: rows.filter(
      (row) => row.stock > 0 && row.stock <= ADMIN_LOW_STOCK_THRESHOLD,
    ).length,
    outOfStockProducts: rows.filter((row) => row.stock <= 0).length,
  };
}

async function fetchInventorySourceRows(): Promise<AdminInventorySourceRow[]> {
  if (!isSupabaseAdminConfigured) {
    return PRODUCTS.map((product) =>
      toAdminInventorySourceRow({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        is_active: product.is_active,
        category_id: product.category_id,
      }),
    );
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,slug,price,is_active,category_id")
    .order("name", { ascending: true });

  if (error || !data) {
    throw new Error(
      `No se pudo cargar el catálogo base del panel: ${error?.message || "unknown_error"}`,
    );
  }

  return (data as Partial<AdminInventorySourceRow>[]).map((row) =>
    toAdminInventorySourceRow(row),
  );
}

export async function listAdminInventoryRows(): Promise<AdminInventoryRow[]> {
  const [inventoryRows, controlSnapshot] = await Promise.all([
    fetchInventorySourceRows(),
    listCatalogControlProducts(),
  ]);

  const stockBySlug = new Map<string, number>();
  for (const product of controlSnapshot.products) {
    const normalizedSlug = normalizeSlug(product.slug);
    const stock =
      typeof product.total_stock === "number"
        ? Math.max(0, Math.floor(product.total_stock))
        : 0;
    stockBySlug.set(normalizedSlug, stock);
  }

  return inventoryRows
    .map((row) => toAdminInventoryRow(row, stockBySlug))
    .sort((left, right) => left.name.localeCompare(right.name, "es-CO"));
}

export async function listAdminOrderRows(): Promise<AdminOrderRow[]> {
  if (!isSupabaseAdminConfigured) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,customer_name,customer_email,customer_phone,total,status,created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    throw new Error(
      `No se pudo cargar los pedidos del panel: ${error?.message || "unknown_error"}`,
    );
  }

  return (data as AdminOrderSourceRow[]).map((row) => toAdminOrderRow(row));
}
