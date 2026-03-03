import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mercadoPagoClient } from "@/lib/mercadopago";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";
import type { OrderInsert, OrderItem, ShippingType } from "@/types/database";

interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
  variant?: string | null;
}

interface CheckoutBody {
  items: CheckoutItem[];
  payer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  shipping: {
    address: string;
    city: string;
    department: string;
    zip?: string;
    type: ShippingType;
    cost: number;
  };
  pricing?: {
    display_currency?: string;
    display_locale?: string;
    country_code?: string;
    display_rate?: number;
  };
}

function isValidCheckout(body: CheckoutBody): boolean {
  return Boolean(
    body?.items?.length &&
      body?.payer?.name &&
      body?.payer?.email &&
      body?.payer?.phone &&
      body?.payer?.document &&
      body?.shipping?.address &&
      body?.shipping?.city &&
      body?.shipping?.department &&
      (body.shipping.type === "nacional" || body.shipping.type === "internacional")
  );
}

function buildOrderItems(items: CheckoutItem[]): OrderItem[] {
  return items.map((item) => ({
    product_id: item.id,
    product_name: item.title,
    variant: item.variant ?? null,
    quantity: Number(item.quantity),
    price: Number(item.unit_price),
    image: item.picture_url ?? "",
  }));
}

function calculateSubtotal(items: CheckoutItem[]): number {
  return items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.unit_price)) * Math.max(1, Number(item.quantity)),
    0
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();

    if (!isValidCheckout(body)) {
      return NextResponse.json(
        { error: "Datos de checkout incompletos" },
        { status: 400 }
      );
    }

    const hasInvalidItem = body.items.some(
      (item) => !item.id || !item.title || Number(item.quantity) <= 0 || Number(item.unit_price) <= 0
    );
    if (hasInvalidItem) {
      return NextResponse.json(
        { error: "Items de checkout invalidos" },
        { status: 400 }
      );
    }

    const subtotal = calculateSubtotal(body.items);
    const shippingCost = Math.max(0, Number(body.shipping.cost) || 0);
    const total = subtotal + shippingCost;
    const orderItems = buildOrderItems(body.items);

    let orderReference = randomUUID();
    if (isSupabaseAdminConfigured) {
      const orderPayload: OrderInsert = {
        customer_name: body.payer.name,
        customer_email: body.payer.email,
        customer_phone: body.payer.phone,
        customer_document: body.payer.document,
        shipping_address: body.shipping.address,
        shipping_city: body.shipping.city,
        shipping_department: body.shipping.department,
        shipping_zip: body.shipping.zip ?? null,
        status: "pending",
        payment_id: null,
        payment_method: "mercadopago",
        shipping_type: body.shipping.type,
        subtotal,
        shipping_cost: shippingCost,
        total,
        items: orderItems,
        notes: body.pricing ? JSON.stringify(body.pricing) : null,
      };

      const { data: createdOrder, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (orderError || !createdOrder) {
        console.error("[Checkout] Error saving order:", orderError);
        return NextResponse.json(
          { error: "No se pudo registrar la orden" },
          { status: 500 }
        );
      }

      orderReference = createdOrder.id;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const preference = new Preference(mercadoPagoClient);

    const response = await preference.create({
      body: {
        items: body.items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "COP",
          picture_url: item.picture_url,
          description: item.variant || undefined,
        })),
        payer: {
          name: body.payer.name,
          email: body.payer.email,
          phone: {
            number: body.payer.phone,
          },
          identification: {
            type: "CC",
            number: body.payer.document,
          },
        },
        shipments: {
          cost: shippingCost,
          mode: "not_specified",
        },
        back_urls: {
          success: `${appUrl}/orden/confirmacion?order_id=${encodeURIComponent(orderReference)}`,
          failure: `${appUrl}/orden/error?order_id=${encodeURIComponent(orderReference)}`,
          pending: `${appUrl}/orden/pendiente?order_id=${encodeURIComponent(orderReference)}`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "ALLSHOP",
        external_reference: orderReference,
        metadata: body.pricing
          ? {
              display_currency: body.pricing.display_currency,
              display_locale: body.pricing.display_locale,
              country_code: body.pricing.country_code,
              display_rate: body.pricing.display_rate,
            }
          : undefined,
      },
    });

    return NextResponse.json({
      id: response.id,
      order_id: orderReference,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: "Error al crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
