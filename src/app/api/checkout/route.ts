import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mercadoPagoClient } from "@/lib/mercadopago";

interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  picture_url?: string;
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
    zip: string;
    type: "nacional" | "internacional";
    cost: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();

    if (!body.items?.length || !body.payer?.email) {
      return NextResponse.json(
        { error: "Datos de checkout incompletos" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const preference = new Preference(mercadoPagoClient);

    const response = await preference.create({
      body: {
        items: body.items.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: "COP",
          picture_url: item.picture_url,
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
          cost: body.shipping.cost,
          mode: "not_specified",
        },
        back_urls: {
          success: `${appUrl}/orden/confirmacion`,
          failure: `${appUrl}/orden/error`,
          pending: `${appUrl}/orden/pendiente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "ALLSHOP",
        external_reference: JSON.stringify({
          payer: body.payer,
          shipping: body.shipping,
        }),
      },
    });

    return NextResponse.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Error al crear la preferencia de pago" },
      { status: 500 }
    );
  }
}
