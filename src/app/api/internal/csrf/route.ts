import { NextResponse } from "next/server";
import { generateCsrfToken, isCsrfSecretConfigured } from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production" && !isCsrfSecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Falta CSRF_SECRET (o ORDER_LOOKUP_SECRET) en producción. No se puede emitir token CSRF.",
      },
      { status: 500 },
    );
  }

  try {
    const token = generateCsrfToken();
    return NextResponse.json(
      { csrfToken: token },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("[CSRF] Failed to generate token:", error);
    return NextResponse.json(
      { error: "No se pudo generar el token CSRF." },
      { status: 500 },
    );
  }
}
