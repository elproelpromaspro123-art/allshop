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

    // Obtener todas las órdenes
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders API error:", error);
      throw error;
    }

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { error: "Error al cargar pedidos" },
      { status: 500 },
    );
  }
}
