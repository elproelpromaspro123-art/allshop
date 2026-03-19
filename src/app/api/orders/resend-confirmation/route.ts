import { NextResponse } from "next/server";

/**
 * Deprecated endpoint.
 * Resend confirmation code is no longer used in the current checkout model.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Este endpoint fue deshabilitado. El flujo actual no usa confirmación manual por correo.",
      deprecated: true,
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Este endpoint fue deshabilitado. El flujo actual no usa confirmación manual por correo.",
      deprecated: true,
    },
    { status: 410 },
  );
}
