import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isCatalogAdminAuthorized,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request.headers.get("authorization"));
    const sessionToken = request.cookies.get("catalog_admin_session")?.value;

    if (!isCatalogAdminAuthorized({ bearerToken: token, sessionToken })) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

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

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Error al cargar métricas" },
      { status: 500 },
    );
  }
}
