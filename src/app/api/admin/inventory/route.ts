import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCatalogAdminCodeValid, parseBearerToken } from "@/lib/catalog-admin-auth";

export async function GET(request: Request) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get("authorization");
        const token = parseBearerToken(authHeader);
        
        if (!isCatalogAdminCodeValid(token)) {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Obtener todos los productos
        const { data: products, error } = await supabaseAdmin
            .from("products")
            .select("id, name, slug, price, stock, is_active, category_id")
            .order("name", { ascending: false });

        if (error) {
            console.error("Inventory API error:", error);
            throw error;
        }

        return NextResponse.json(products || []);
    } catch (error) {
        console.error("Inventory API error:", error);
        return NextResponse.json(
            { error: "Error al cargar inventario" },
            { status: 500 }
        );
    }
}
