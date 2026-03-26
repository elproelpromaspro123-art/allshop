import { NextRequest } from "next/server";
import { buildAdminDashboardPayload } from "@/lib/admin/admin-dashboard";
import { assertCatalogAdminAccess, enforceAdminRateLimit } from "@/lib/admin-route";
import { listAdminInventoryRows, listAdminOrderRows } from "@/lib/admin-panel-data";
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
    const payload = buildAdminDashboardPayload({
      orders,
      inventoryRows,
    });

    return apiOk(
      payload,
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
