import { NextResponse } from "next/server";

/**
 * Deprecated endpoint.
 * Order confirmation by email code is no longer part of the active checkout flow.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Este endpoint fue deshabilitado. El pedido ahora se confirma directamente en checkout.",
      deprecated: true,
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Este endpoint fue deshabilitado. El pedido ahora se confirma directamente en checkout.",
      deprecated: true,
    },
    { status: 410 }
  );
}
