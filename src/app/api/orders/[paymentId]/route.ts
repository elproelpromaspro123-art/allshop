import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

async function findOrderByReference(reference: string) {
  const { data: byId } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", reference)
    .maybeSingle();
  if (byId) return byId;

  const { data: byPaymentId } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("payment_id", reference)
    .maybeSingle();
  return byPaymentId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ order: null });
  }

  const data = await findOrderByReference(paymentId);
  if (!data) {
    return NextResponse.json({ order: null });
  }

  return NextResponse.json({ order: data });
}
