/**
 * processFulfillment - Placeholder para la lógica de fulfillment
 * 
 * Esta función se dispara tras confirmar el pago exitoso.
 * En producción, enviaría los datos del pedido al proveedor vía API/Webhook.
 * 
 * Flujo:
 * 1. Obtener datos completos de la orden
 * 2. Identificar proveedor según el producto
 * 3. Enviar datos al proveedor via su API
 * 4. Registrar el log de fulfillment
 * 5. Actualizar estado de la orden
 */
export async function processFulfillment(orderId: string): Promise<void> {
  console.log(`[Fulfillment] Processing order: ${orderId}`);

  try {
    // 1. Obtener la orden de Supabase
    // const { data: order } = await supabase
    //   .from("orders")
    //   .select("*")
    //   .eq("id", orderId)
    //   .single();

    // 2. Para cada item, enviar al proveedor correspondiente
    // for (const item of order.items) {
    //   const product = await getProduct(item.product_id);
    //   if (product.provider_api_url) {
    //     await sendToProvider(product.provider_api_url, {
    //       order_id: orderId,
    //       product_id: item.product_id,
    //       variant: item.variant,
    //       quantity: item.quantity,
    //       shipping: {
    //         name: order.customer_name,
    //         address: order.shipping_address,
    //         city: order.shipping_city,
    //         department: order.shipping_department,
    //         phone: order.customer_phone,
    //       },
    //     });
    //   }
    // }

    // 3. Registrar log
    // await supabase.from("fulfillment_logs").insert({
    //   order_id: orderId,
    //   action: "provider_notified",
    //   status: "success",
    //   payload: { orderId },
    // });

    // 4. Actualizar estado de la orden
    // await supabase
    //   .from("orders")
    //   .update({ status: "processing" })
    //   .eq("id", orderId);

    console.log(`[Fulfillment] Order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`[Fulfillment] Error processing order ${orderId}:`, error);

    // Log the error
    // await supabase.from("fulfillment_logs").insert({
    //   order_id: orderId,
    //   action: "provider_notified",
    //   status: "error",
    //   payload: { orderId, error: String(error) },
    // });

    throw error;
  }
}

/**
 * Placeholder: Enviar datos al proveedor de dropshipping
 */
// async function sendToProvider(apiUrl: string, data: Record<string, unknown>) {
//   const response = await fetch(apiUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!response.ok) {
//     throw new Error(`Provider API error: ${response.status}`);
//   }
//   return response.json();
// }
