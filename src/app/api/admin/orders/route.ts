import { NextRequest } from "next/server";
import { assertCatalogAdminAccess } from "@/lib/admin-route";
import { listAdminOrderRows } from "@/lib/admin-panel-data";
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

    const orders = await listAdminOrderRows();

    return apiOk(orders, {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    console.error("Orders API error:", error);
    return apiError("Error al cargar pedidos", {
      status: 500,
      code: "ADMIN_ORDERS_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
