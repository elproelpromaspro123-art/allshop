import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Webhook logistico deshabilitado. Operacion 100% manual." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Webhook logistico deshabilitado. Operacion 100% manual." },
    { status: 410 }
  );
}
