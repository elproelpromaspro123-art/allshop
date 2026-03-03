import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import { notifyOrderStatus } from "@/lib/notifications";
import type { OrderStatus } from "@/types/database";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const password = process.env.ADMIN_PASSWORD || "allshop_admin_2024";
  return auth === `Bearer ${password}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ orders: [], message: "Supabase no configurado" });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 400 });
  }

  const body = await request.json();
  const { orderId, status: newStatus } = body as { orderId: string; status: OrderStatus };

  if (!orderId || !newStatus) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await notifyOrderStatus(orderId, newStatus);
  } catch (notificationError) {
    console.error("[Admin Orders] Notification error:", notificationError);
  }

  return NextResponse.json({ success: true });
}
