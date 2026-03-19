import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db";

export const revalidate = 120;

export async function GET() {
  try {
    const products = await getProducts();

    const searchData = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      images: product.images.slice(0, 1),
      category_id: product.category_id,
    }));

    return NextResponse.json(
      { products: searchData },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { products: [], error: "Error al buscar productos" },
      { status: 500 },
    );
  }
}
