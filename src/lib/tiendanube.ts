// src/lib/tiendanube.ts

import type { OrderInsert, OrderItem, OrderStatus } from "@/types/database";

export const isTiendanubeConfigured = Boolean(
    process.env.TIENDANUBE_STORE_ID && process.env.TIENDANUBE_ACCESS_TOKEN
);

function getHeaders() {
    if (!process.env.TIENDANUBE_ACCESS_TOKEN) {
        throw new Error("TIENDANUBE_ACCESS_TOKEN no está configurado");
    }

    return {
        "Content-Type": "application/json",
        "Authentication": `bearer ${process.env.TIENDANUBE_ACCESS_TOKEN}`,
        "User-Agent": "VortixyIntegration (soporte@vortixy.co)"
    };
}

const API_BASE = "https://api.tiendanube.com/v1";

export async function createTiendanubeOrder(input: {
    order: OrderInsert;
    mappedItems: any[];
}) {
    const storeId = process.env.TIENDANUBE_STORE_ID;
    if (!storeId) throw new Error("TIENDANUBE_STORE_ID no está configurado");

    const url = `${API_BASE}/${storeId}/orders`;

    const { order, mappedItems } = input;

    const payload = {
        customer: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            identification: order.customer_document,
        },
        shipping_address: {
            address: order.shipping_address,
            city: order.shipping_city,
            province: order.shipping_department,
            zipcode: order.shipping_zip || "000000",
            phone: order.customer_phone,
            name: order.customer_name,
        },
        billing_address: {
            address: order.shipping_address,
            city: order.shipping_city,
            province: order.shipping_department,
            zipcode: order.shipping_zip || "000000",
            phone: order.customer_phone,
            name: order.customer_name,
        },
        payment_status: "pending",
        shipping_status: "unshipped",
        shipping_cost: order.shipping_cost,
        subtotal: order.subtotal,
        total: order.total,
        note: "Orden transferida automaticamente via Checkout Vortixy a Dropify.",
        products: mappedItems.map((item) => {
            // Here we build the line items formatted for Tiendanube
            return {
                product_id: item.tiendanube_product_id,
                variant_id: item.tiendanube_variant_id ?? null,
                quantity: item.quantity,
                price: item.price
            };
        }),
    };

    const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error en API Tiendanube (${response.status}): ${errorBody}`);
    }

    return await response.json();
}

/**
 * Esta función es clave: busca un producto en tu catálogo actual
 * de Tiendanube basándose en su SKU (que debe ser el Dropi ID 1234567 o el Slug).
 */
export async function findTiendanubeProductBySku(skuString: string) {
    const storeId = process.env.TIENDANUBE_STORE_ID;
    if (!storeId) return null;

    // Buscar en la api pública de tu tienda en base a texto = SKU
    const url = `${API_BASE}/${storeId}/products?q=${encodeURIComponent(skuString)}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) return null;

        const products = await response.json();
        if (!Array.isArray(products) || products.length === 0) return null;

        return products[0]; // Retorna el primer producto coincidente
    } catch (e) {
        console.error("Error buscando producto en Tiendanube:", e);
        return null;
    }
}
