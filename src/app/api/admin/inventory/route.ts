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

    // Obtener todos los productos
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, price, stock, is_active, category_id")
      .order("name", { ascending: false });

    if (error) {
      console.error("Inventory API error:", error);
      throw error;
    }

    return apiOk(products || []);
  } catch (error) {
    console.error("Inventory API error:", error);
    return apiError("Error al cargar inventario", {
      status: 500,
      code: "ADMIN_INVENTORY_FAILED",
    });
  }
}
