import { NextResponse } from "next/server";
import { getCategories, getFeaturedProducts } from "@/lib/db";

export const revalidate = 60; // Revalidate every 60 seconds (fix 2.4)

export async function GET() {
  try {
    const [categories, featuredProducts] = await Promise.all([
      getCategories(),
      getFeaturedProducts(),
    ]);

    return NextResponse.json(
      { categories, featuredProducts },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[Storefront API] Error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el storefront" },
      { status: 500 },
    );
  }
}
