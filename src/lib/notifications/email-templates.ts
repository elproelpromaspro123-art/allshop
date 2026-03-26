import type { EmailMessage } from "./template";
import {
  renderActionButton,
  renderEmailDocument,
  renderInlineBlock,
  renderSummaryTable,
} from "./template";
import { formatCop, getAppUrl, ORDER_EMAIL_THEME } from "./shared";

/**
 * Email de bienvenida al newsletter
 */
export function buildNewsletterWelcomeEmail(input: {
  email: string;
  discountCode?: string;
}): EmailMessage {
  const appUrl = getAppUrl() || "https://vortixy.net";
  const sections = [
    renderInlineBlock({
      title: "Bienvenido/a a Vortixy",
      body: "Te has suscrito exitosamente a nuestro boletín. Recibirás ofertas exclusivas, nuevos productos y novedades antes que nadie.",
    }),
  ];

  if (input.discountCode) {
    sections.push(
      renderInlineBlock({
        title: "Tu cupón de bienvenida",
        body: `Usa el código ${input.discountCode} para obtener un descuento especial en tu primera compra.`,
        accentColor: ORDER_EMAIL_THEME.accentText,
        backgroundColor: ORDER_EMAIL_THEME.accentSoft,
      }),
    );
  }

  sections.push(
    renderActionButton({
      href: appUrl,
      label: "Explorar productos",
    }),
  );

  sections.push(
    renderInlineBlock({
      title: "¿Qué recibirás?",
      body: "• Ofertas exclusivas para suscriptores\n• Alertas de nuevos productos\n• Descuentos anticipados\n• Tips y guías de compra",
      accentColor: "#6b7280",
      backgroundColor: "#f9fafb",
    }),
  );

  const message = renderEmailDocument({
    preheader: "Bienvenido a Vortixy — ofertas exclusivas te esperan",
    brandName: "Vortixy",
    heroTitle: "¡Bienvenido/a!",
    heroSubtitle: "Te has unido a nuestra comunidad de compradores inteligentes.",
    sections,
    footerLines: [
      "Recibiste este correo porque te suscribiste en vortixy.net.",
      "Puedes darte de baja en cualquier momento respondiendo este correo.",
    ],
  });

  return {
    subject: "Vortixy: ¡Bienvenido/a! Aquí está tu cupón de bienvenida",
    html: message.html,
    text: `Bienvenido a Vortixy.\n${input.discountCode ? `Tu cupón de bienvenida: ${input.discountCode}\n` : ""}Visita ${appUrl} para explorar nuestros productos.`,
  };
}

/**
 * Email de invitación a dejar review post-compra
 */
export function buildReviewInvitationEmail(input: {
  customerName: string;
  orderId: string;
  productName: string;
  productSlug: string;
  reviewUrl: string;
  discountCode?: string;
}): EmailMessage {
  const firstName = input.customerName.split(" ")[0] || "cliente";
  const sections = [
    renderInlineBlock({
      title: "¿Qué tal tu compra?",
      body: `Esperamos que disfrutes tu ${input.productName}. Tu opinión nos ayuda a mejorar y a otros compradores a tomar mejores decisiones.`,
    }),
    renderActionButton({
      href: input.reviewUrl,
      label: "Dejar una reseña",
    }),
  ];

  if (input.discountCode) {
    sections.push(
      renderInlineBlock({
        title: "¡Te regalamos un cupón!",
        body: `Por cada reseña aprobada recibirás un cupón de descuento. Código: ${input.discountCode}`,
        accentColor: ORDER_EMAIL_THEME.accentText,
        backgroundColor: ORDER_EMAIL_THEME.accentSoft,
      }),
    );
  }

  sections.push(
    renderSummaryTable({
      title: "Resumen de tu compra",
      rows: [
        { label: "Producto", value: input.productName },
        { label: "Pedido", value: `#${input.orderId.slice(0, 8).toUpperCase()}` },
      ],
    }),
  );

  const message = renderEmailDocument({
    preheader: "¿Cómo fue tu experiencia? Cuéntanos y gana un cupón",
    brandName: "Vortixy",
    heroTitle: "Tu opinión importa",
    heroSubtitle: `Hola ${firstName}, queremos saber qué tal tu ${input.productName}.`,
    sections,
    footerLines: [
      "Tu reseña aparecerá públicamente después de revisión.",
      "Gracias por ayudarnos a mejorar.",
    ],
  });

  return {
    subject: `Vortixy: ¿Qué tal tu ${input.productName}? Cuéntanos`,
    html: message.html,
    text: `Hola ${firstName}, ¿qué tal tu ${input.productName}? Deja tu reseña: ${input.reviewUrl}`,
  };
}

/**
 * Email de carrito abandonado
 */
export function buildAbandonedCartEmail(input: {
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    slug: string;
    image?: string;
  }>;
  total: number;
  checkoutUrl: string;
  discountCode?: string;
}): EmailMessage {
  const firstName = input.customerName.split(" ")[0] || "cliente";
  const appUrl = getAppUrl() || "https://vortixy.net";

  const itemListText = input.items
    .map((item) => `• ${item.quantity}x ${item.name} — ${formatCop(item.price * item.quantity)}`)
    .join("\n");

  const sections = [
    renderInlineBlock({
      title: "¡No te vayas sin tu compra!",
      body: `Tienes ${input.items.length} producto${input.items.length !== 1 ? "s" : ""} esperándote por un valor de ${formatCop(input.total)}. Los productos podrían agotarse.`,
    }),
  ];

  if (input.discountCode) {
    sections.push(
      renderInlineBlock({
        title: "¡Tenemos algo especial para ti!",
        body: `Usa el código ${input.discountCode} para obtener un descuento adicional. Válido por 24 horas.`,
        accentColor: ORDER_EMAIL_THEME.warning,
        backgroundColor: ORDER_EMAIL_THEME.warningSoft,
      }),
    );
  }

  sections.push(
    renderActionButton({
      href: input.checkoutUrl,
      label: "Completar mi compra",
    }),
  );

  sections.push(
    renderSummaryTable({
      title: "Productos en tu carrito",
      rows: input.items.map((item) => ({
        label: `${item.quantity}x ${item.name}`,
        value: formatCop(item.price * item.quantity),
      })),
    }),
  );

  sections.push(
    renderInlineBlock({
      title: "¿Necesitas ayuda?",
      body: `Visita ${appUrl} o contáctanos por WhatsApp. Estamos aquí para ayudarte.`,
      accentColor: "#6b7280",
      backgroundColor: "#f9fafb",
    }),
  );

  const message = renderEmailDocument({
    preheader: "Tu carrito te espera — completa tu compra antes de que se agoten",
    brandName: "Vortixy",
    heroTitle: "¡No olvides tu carrito!",
    heroSubtitle: `Hola ${firstName}, tienes productos esperándote.`,
    sections,
    footerLines: [
      `Productos en carrito:\n${itemListText}`,
      "Si ya completaste tu compra, ignora este mensaje.",
    ],
  });

  return {
    subject: "Vortixy: ¡Tu carrito te espera! Completa tu compra",
    html: message.html,
    text: [
      `Hola ${firstName},`,
      `Tienes ${input.items.length} producto(s) en tu carrito por ${formatCop(input.total)}.`,
      itemListText,
      input.discountCode ? `Código de descuento: ${input.discountCode}` : "",
      `Completa tu compra: ${input.checkoutUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Email de producto de vuelta en stock
 */
export function buildBackInStockEmail(input: {
  customerName: string;
  productName: string;
  productSlug: string;
  price: number;
  imageUrl?: string;
}): EmailMessage {
  const firstName = input.customerName.split(" ")[0] || "cliente";
  const appUrl = getAppUrl() || "https://vortixy.net";
  const productUrl = `${appUrl}/producto/${input.productSlug}`;

  const sections = [
    renderInlineBlock({
      title: "¡Ya está disponible!",
      body: `El producto ${input.productName} que buscabas ya está de vuelta en stock. ¡No te lo pierdas esta vez!`,
    }),
    renderSummaryTable({
      title: "Detalles del producto",
      rows: [
        { label: "Producto", value: input.productName },
        { label: "Precio", value: formatCop(input.price) },
        { label: "Disponibilidad", value: "En stock" },
      ],
    }),
    renderActionButton({
      href: productUrl,
      label: "Ver producto",
    }),
  ];

  const message = renderEmailDocument({
    preheader: `${input.productName} ya está disponible — ¡no te lo pierdas!`,
    brandName: "Vortixy",
    heroTitle: "¡Vuelve a estar disponible!",
    heroSubtitle: `Hola ${firstName}, el producto que buscabas ya está en stock.`,
    sections,
    footerLines: [
      "El stock puede agotarse rápidamente. Te recomendamos comprar pronto.",
      "Si ya no estás interesado, ignora este mensaje.",
    ],
  });

  return {
    subject: `Vortixy: ¡${input.productName} ya está disponible!`,
    html: message.html,
    text: `Hola ${firstName}, ${input.productName} ya está disponible. Precio: ${formatCop(input.price)}. Ver: ${productUrl}`,
  };
}

/**
 * Email de reembolso confirmado
 */
export function buildRefundConfirmedEmail(input: {
  customerName: string;
  orderId: string;
  refundAmount: number;
  refundReason: string;
}): EmailMessage {
  const firstName = input.customerName.split(" ")[0] || "cliente";

  const sections = [
    renderSummaryTable({
      title: "Detalles del reembolso",
      rows: [
        { label: "Pedido", value: `#${input.orderId.slice(0, 8).toUpperCase()}` },
        { label: "Monto reembolsado", value: formatCop(input.refundAmount) },
        { label: "Motivo", value: input.refundReason },
      ],
    }),
    renderInlineBlock({
      title: "Información importante",
      body: "El reembolso puede tardar entre 3 y 5 días hábiles en reflejarse en tu cuenta bancaria, dependiendo de tu entidad financiera.",
    }),
  ];

  const message = renderEmailDocument({
    preheader: "Reembolso confirmado para tu pedido",
    brandName: "Vortixy",
    heroTitle: "Reembolso procesado",
    heroSubtitle: `Hola ${firstName}, tu reembolso ha sido procesado exitosamente.`,
    sections,
    footerLines: [
      "Si tienes dudas sobre el reembolso, responde a este correo.",
      "Te esperamos de vuelta en Vortixy.",
    ],
  });

  return {
    subject: `Vortixy: Reembolso confirmado #${input.orderId.slice(0, 8).toUpperCase()}`,
    html: message.html,
    text: `Hola ${firstName}, tu reembolso de ${formatCop(input.refundAmount)} ha sido procesado. Motivo: ${input.refundReason}.`,
  };
}
