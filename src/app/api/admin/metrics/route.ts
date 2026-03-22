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

    // Obtener todas las órdenes para métricas
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, customer_name, total, status, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Metrics error:", ordersError);
      throw ordersError;
    }

    // Calcular métricas
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
    const processingOrders = orders?.filter((o) => o.status === "processing").length || 0;
    const shippedOrders = orders?.filter((o) => o.status === "shipped").length || 0;
    const deliveredOrders = orders?.filter((o) => o.status === "delivered").length || 0;
    const cancelledOrders = orders?.filter((o) => o.status === "cancelled").length || 0;

    // Obtener productos con stock bajo
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, stock")
      .eq("is_active", true);

    const totalProducts = products?.length || 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    
    if (products && !productsError) {
      lowStockProducts = products.filter((p) => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length;
      outOfStockProducts = products.filter((p) => (p.stock || 0) <= 0).length;
    }

    // Pedidos recientes (últimos 10)
    const recentOrders = (orders || []).slice(0, 10).map((o) => ({
      id: o.id,
      customer_name: o.customer_name || "N/A",
      total: o.total || 0,
      status: o.status || "unknown",
      created_at: o.created_at,
    }));

    return apiOk({
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
      recentOrders,
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return apiError("Error al cargar métricas", {
      status: 500,
      code: "ADMIN_METRICS_FAILED",
    });
  }
}
