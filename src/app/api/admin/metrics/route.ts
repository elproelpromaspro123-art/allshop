import { NextRequest } from "next/server";
import { assertCatalogAdminAccess, enforceAdminRateLimit } from "@/lib/admin-route";
import {
  buildAdminRecentOrders,
  getAdminInventoryStats,
  listAdminInventoryRows,
  listAdminOrderRows,
} from "@/lib/admin-panel-data";
import { apiError, apiOk, noStoreHeaders } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const authError = assertCatalogAdminAccess(request, {
      headerName: "authorization",
      unauthorizedMessage: "No autorizado.",
    });
    if (authError) {
      return authError;
    }

    const rateLimitError = await enforceAdminRateLimit(request, {
      keyPrefix: "admin-metrics",
      limit: 120,
      windowMs: 60 * 1000,
    });
    if (rateLimitError) return rateLimitError;

    const [orders, inventoryRows] = await Promise.all([
      listAdminOrderRows(),
      listAdminInventoryRows(),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const pendingOrders = orders.filter((order) => order.status === "pending").length;
    const processingOrders = orders.filter(
      (order) => order.status === "processing",
    ).length;
    const shippedOrders = orders.filter((order) => order.status === "shipped").length;
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered",
    ).length;
    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled",
    ).length;

    const { totalProducts, lowStockProducts, outOfStockProducts } =
      getAdminInventoryStats(inventoryRows);

    return apiOk(
      {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        recentOrders: buildAdminRecentOrders(orders),
      },
      {
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error("Metrics API error:", error);
    return apiError("Error al cargar métricas", {
      status: 500,
      code: "ADMIN_METRICS_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
