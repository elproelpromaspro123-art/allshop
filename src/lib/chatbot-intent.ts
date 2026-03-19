function normalizeQuery(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HUMAN_SUPPORT_PATTERN =
  /(agente|asesor|humano|persona|soporte|servicio al cliente|whatsapp|contacto|correo)/i;
const CAPABILITY_PATTERN =
  /(que puedes hacer|como ayudas|como me ayudas|puedes ayudarme|navegar|moverme por la pagina)/i;
const GREETING_PATTERN =
  /^(hola|buenas|holi|hey|buenos dias|buenas tardes|buenas noches)\b/i;
const STORE_OPERATIONS_PATTERN =
  /(envio|envios|entrega|entregas|cobertura|contra entrega|contraentrega|pago|pagos|checkout|seguimiento|tracking|pedido|pedidos|despacho|transportadora|guia|garantia|garantias|devolucion|devoluciones|cambio|reembolso|direccion|datos|estado|tiempo|tiempos|cuanto tarda|demora|demoras)/i;
const CHECKOUT_PATTERN =
  /(checkout|carrito|cart|finalizar compra|ir al carrito|ir a pagar|pagar ahora|comprar ahora|tramitar pedido)/i;
const TRACKING_PATTERN =
  /(seguimiento|tracking|rastrear|estado del pedido|ver pedido|guia|transportadora)/i;
const SUPPORT_PAGE_PATTERN =
  /(soporte|ayuda|contacto|pagina de soporte|formulario de soporte|feedback)/i;
const FAQ_PATTERN = /(faq|preguntas frecuentes|dudas frecuentes|ayuda frecuente)/i;
const SHIPPING_PAGE_PATTERN =
  /(pagina de envios|politica de envios|info de envios|envios|cobertura|tiempos de envio|costos de envio)/i;
const RETURNS_PAGE_PATTERN =
  /(devolucion|devoluciones|cambios|reembolso|garantia|garantias|politica de devolucion)/i;
const ADD_TO_CART_PATTERN =
  /(agrega|agregalo|agregamela|agregamelo|anade|anadelo|anadela|anadelo|añade|añadelo|ponlo en el carrito|ponla en el carrito|metelo al carrito|metela al carrito|sumalo al carrito|sumala al carrito|echalo al carrito|echala al carrito)/i;
const BUY_NOW_PATTERN =
  /(compralo|comprala|comprar este|comprar esta|comprarlo|comprarla|me lo llevo|me la llevo|lo quiero|la quiero|haz el pedido|pidelo|pidela|tramita la compra|tramitar la compra|comprar ya|comprarlo ya|comprarla ya)/i;
const COMPARISON_PATTERN =
  /(compar|vs\b|versus|otra opcion|otra opcion conveniente|alternativa|algo parecido|algo similar|mejor que|frente a)/i;
const PRODUCT_EXPLANATION_PATTERN =
  /(explica|explicame|resumelo|resumela|que tiene|que trae|para que sirve|de que trata|vale la pena|conviene|hablame de este producto|este producto)/i;

export function wantsHumanSupport(query: string): boolean {
  return HUMAN_SUPPORT_PATTERN.test(normalizeQuery(query));
}

export function wantsCapabilityOverview(query: string): boolean {
  return CAPABILITY_PATTERN.test(normalizeQuery(query));
}

export function isGreeting(query: string): boolean {
  return GREETING_PATTERN.test(normalizeQuery(query));
}

export function isStoreOperationsQuery(query: string): boolean {
  return STORE_OPERATIONS_PATTERN.test(normalizeQuery(query));
}

export function shouldPreferLocalStorefrontAnswer(query: string): boolean {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return true;
  }

  return (
    wantsHumanSupport(normalized) ||
    wantsCapabilityOverview(normalized) ||
    isGreeting(normalized) ||
    isStoreOperationsQuery(normalized)
  );
}

export function wantsCheckoutPage(query: string): boolean {
  return CHECKOUT_PATTERN.test(normalizeQuery(query));
}

export function wantsTrackingPage(query: string): boolean {
  return TRACKING_PATTERN.test(normalizeQuery(query));
}

export function wantsSupportPage(query: string): boolean {
  return SUPPORT_PAGE_PATTERN.test(normalizeQuery(query));
}

export function wantsFaqPage(query: string): boolean {
  return FAQ_PATTERN.test(normalizeQuery(query));
}

export function wantsShippingPage(query: string): boolean {
  return SHIPPING_PAGE_PATTERN.test(normalizeQuery(query));
}

export function wantsReturnsPage(query: string): boolean {
  return RETURNS_PAGE_PATTERN.test(normalizeQuery(query));
}

export function wantsAddToCart(query: string): boolean {
  return ADD_TO_CART_PATTERN.test(normalizeQuery(query));
}

export function wantsBuyNow(query: string): boolean {
  return BUY_NOW_PATTERN.test(normalizeQuery(query));
}

export function wantsComparison(query: string): boolean {
  return COMPARISON_PATTERN.test(normalizeQuery(query));
}

export function wantsProductExplanation(query: string): boolean {
  return PRODUCT_EXPLANATION_PATTERN.test(normalizeQuery(query));
}
