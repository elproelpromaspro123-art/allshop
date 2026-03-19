import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isCatalogAdminCodeValid,
  parseBearerToken,
} from "@/lib/catalog-admin-auth";

export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    if (!isCatalogAdminCodeValid(token)) {
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
    const totalRevenue =
      orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const pendingOrders =
      orders?.filter((o) => o.status === "pending").length || 0;
    const completedOrders =
      orders?.filter((o) => o.status === "delivered").length || 0;
    const cancelledOrders =
      orders?.filter((o) => o.status === "cancelled").length || 0;

    // Obtener productos con stock bajo
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, stock")
      .eq("is_active", true);

    let lowStockProducts = 0;
    if (products && !productsError) {
      lowStockProducts = products.filter((p) => (p.stock || 0) <= 5).length;
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
      totalRevenue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts,
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
