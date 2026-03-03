import { NextResponse } from "next/server";
import { getCategories, getFeaturedProducts } from "@/lib/db";

export async function GET() {
  try {
    const [categories, featuredProducts] = await Promise.all([
      getCategories(),
      getFeaturedProducts(),
    ]);

    return NextResponse.json({ categories, featuredProducts });
  } catch (error) {
    console.error("[Storefront API] Error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el storefront" },
      { status: 500 }
    );
  }
}
