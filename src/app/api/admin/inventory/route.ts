import { NextRequest } from "next/server";
import { assertCatalogAdminAccess } from "@/lib/admin-route";
import { listAdminInventoryRows } from "@/lib/admin-panel-data";
import { apiError, apiOk, noStoreHeaders } from "@/lib/api-response";
import { isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const authError = assertCatalogAdminAccess(request, {
      headerName: "authorization",
      unauthorizedMessage: "No autorizado.",
    });
    if (authError) {
      return authError;
    }

    if (!isSupabaseAdminConfigured) {
      return apiError("Supabase admin no configurado.", {
        status: 500,
        code: "SUPABASE_ADMIN_MISSING",
        headers: noStoreHeaders(),
      });
    }

    const products = await listAdminInventoryRows();

    return apiOk(products, {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return apiError("Error al cargar inventario", {
      status: 500,
      code: "ADMIN_INVENTORY_FAILED",
      headers: noStoreHeaders(),
    });
  }
}
