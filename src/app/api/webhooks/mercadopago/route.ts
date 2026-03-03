import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mercadoPagoClient } from "@/lib/mercadopago";
import { processFulfillment } from "@/lib/fulfillment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === "payment") {
      const paymentClient = new Payment(mercadoPagoClient);
      const payment = await paymentClient.get({ id: body.data.id });

      if (payment.status === "approved") {
        const externalReference = payment.external_reference
          ? JSON.parse(payment.external_reference)
          : {};

        const orderData = {
          customer_name: externalReference.payer?.name || "",
          customer_email: externalReference.payer?.email || "",
          customer_phone: externalReference.payer?.phone || "",
          customer_document: externalReference.payer?.document || "",
          shipping_address: externalReference.shipping?.address || "",
          shipping_city: externalReference.shipping?.city || "",
          shipping_department: externalReference.shipping?.department || "",
          shipping_zip: externalReference.shipping?.zip || "",
          status: "paid" as const,
          payment_id: String(payment.id),
          payment_method: payment.payment_method_id || "mercadopago",
          shipping_type: externalReference.shipping?.type || "nacional",
          subtotal: (payment.transaction_amount || 0) - (externalReference.shipping?.cost || 0),
          shipping_cost: externalReference.shipping?.cost || 0,
          total: payment.transaction_amount || 0,
          items: payment.additional_info?.items?.map((item: { id: string; title: string; quantity: number; unit_price: number }) => ({
            product_id: item.id,
            product_name: item.title,
            variant: null,
            quantity: Number(item.quantity),
            price: Number(item.unit_price),
            image: "",
          })) || [],
        };

        // TODO: Save order to Supabase
        // const { data: order } = await supabase.from("orders").insert(orderData).select().single();

        // Trigger fulfillment
        await processFulfillment(`order-${payment.id}`);

        console.log("Order processed:", orderData);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
