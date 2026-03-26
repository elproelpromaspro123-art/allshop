import type { AdminDashboardPayload, AdminInventoryRow, AdminOrderRow } from "@/types/api";
import { getAdminInventoryStats } from "@/lib/admin-panel-data";
import {
  ADMIN_RECENT_ORDER_LIMIT,
  isAdminOrderWithinLookback,
  sortAdminOrdersByRecentActivity,
} from "@/lib/admin/admin-sorting";

function sumRevenue(orders: AdminOrderRow[]): number {
  return orders.reduce((sum, order) => sum + Math.max(0, Math.floor(Number(order.total) || 0)), 0);
}

function countOrdersByStatus(orders: AdminOrderRow[]) {
  return orders.reduce(
    (acc, order) => {
      switch (order.status) {
        case "pending":
          acc.pending += 1;
          break;
        case "processing":
          acc.processing += 1;
          break;
        case "shipped":
          acc.shipped += 1;
          break;
        case "delivered":
          acc.delivered += 1;
          break;
        case "cancelled":
          acc.cancelled += 1;
          break;
      }

      return acc;
    },
    {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
  );
}

export function buildAdminDashboardPayload(input: {
  orders: AdminOrderRow[];
  inventoryRows: AdminInventoryRow[];
  recentOrderLimit?: number;
  referenceTimeMs?: number;
}): AdminDashboardPayload {
  const sortedOrders = sortAdminOrdersByRecentActivity(input.orders);
  const recentOrderLimit = input.recentOrderLimit || ADMIN_RECENT_ORDER_LIMIT;
  const referenceTimeMs = input.referenceTimeMs || Date.now();
  const totalOrders = sortedOrders.length;
  const totalRevenue = sumRevenue(sortedOrders);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const recentOrdersWindow = sortedOrders.filter((order) =>
    isAdminOrderWithinLookback(order.created_at, referenceTimeMs),
  );
  const recentRevenue = sumRevenue(recentOrdersWindow);
  const ordersThisWeek = recentOrdersWindow.length;

  const statusCounts = countOrdersByStatus(sortedOrders);
  const backlogOrders = statusCounts.pending + statusCounts.processing;

  const { totalProducts, lowStockProducts, outOfStockProducts } =
    getAdminInventoryStats(input.inventoryRows);
  const activeProducts = input.inventoryRows.filter((row) => row.is_active).length;
  const inactiveProducts = Math.max(0, totalProducts - activeProducts);
  const inventoryPressure = lowStockProducts + outOfStockProducts;
  const catalogCoverage =
    totalProducts > 0 ? activeProducts / totalProducts : 0;
  const fulfillmentRate =
    totalOrders > 0 ? statusCounts.delivered / totalOrders : 0;

  return {
    totalOrders,
    pendingOrders: statusCounts.pending,
    processingOrders: statusCounts.processing,
    shippedOrders: statusCounts.shipped,
    deliveredOrders: statusCounts.delivered,
    cancelledOrders: statusCounts.cancelled,
    backlogOrders,
    totalRevenue,
    recentRevenue,
    averageOrderValue,
    ordersThisWeek,
    fulfillmentRate,
    totalProducts,
    activeProducts,
    inactiveProducts,
    lowStockProducts,
    outOfStockProducts,
    inventoryPressure,
    catalogCoverage,
    recentOrders: sortedOrders.slice(0, recentOrderLimit).map((order) => ({
      id: order.id,
      customer_name: order.customer_name,
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    })),
  };
}
