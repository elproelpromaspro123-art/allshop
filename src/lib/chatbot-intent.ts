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
