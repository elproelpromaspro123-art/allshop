import { NextRequest } from "next/server";
import { assertCatalogAdminAccess } from "@/lib/admin-route";
import { apiError, apiOk } from "@/lib/api-response";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase-admin";

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
      });
    }

    // Obtener todas las órdenes
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders API error:", error);
      throw error;
    }

    return apiOk(orders || []);
  } catch (error) {
    console.error("Orders API error:", error);
    return apiError("Error al cargar pedidos", {
      status: 500,
      code: "ADMIN_ORDERS_FAILED",
    });
  }
}
