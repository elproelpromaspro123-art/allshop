import type { OrderStatus } from "@/types/database";
import type { EmailMessage, EmailSection } from "./template";
import {
  renderActionButton,
  renderEmailDocument,
  renderInlineBlock,
  renderOrderItemsTable,
  renderSummaryTable,
} from "./template";
import {
  formatCop,
  formatDateTime,
  normalizeEmailAddress,
  ORDER_EMAIL_THEME,
  resolveOrderNotificationDetails,
  type NotificationOrderRecord,
} from "./shared";

export { type NotificationOrderRecord } from "./shared";

function getStatusSubject(status: OrderStatus, orderShortId: string): string {
  if (status === "pending" || status === "paid") {
    return `Vortixy: Pedido recibido #${orderShortId}`;
  }
  if (status === "processing") {
    return `Vortixy: Pedido en preparación #${orderShortId}`;
  }
  if (status === "shipped") {
    return `Vortixy: Tu pedido va en camino #${orderShortId}`;
  }
  if (status === "delivered") {
    return `Vortixy: Pedido entregado #${orderShortId}`;
  }
  if (status === "cancelled") {
    return `Vortixy: Pedido cancelado #${orderShortId}`;
  }
  if (status === "refunded") {
    return `Vortixy: Reembolso procesado #${orderShortId}`;
  }
  return `Vortixy: Actualización de tu pedido #${orderShortId}`;
}

export function buildOrderStatusEmailMessage(
  order: NotificationOrderRecord,
  status: OrderStatus,
): EmailMessage {
  const details = resolveOrderNotificationDetails(order, status);
  const summaryRows = [
    { label: "Estado", value: details.statusLabel },
    { label: "Total", value: formatCop(details.orderTotal) },
  ];

  if (details.manualReview.completed) {
    summaryRows.push({
      label: "Revisión manual",
      value: details.manualReview.completedAt
        ? `Completada ${formatDateTime(details.manualReview.completedAt)}`
        : "Completada",
    });
  }
  if (details.dispatchReference) {
    summaryRows.push({
      label: "Referencia de despacho",
      value: details.dispatchReference,
    });
  }
  if (details.trackingCode) {
    summaryRows.push({
      label: "Guía de seguimiento",
      value: details.trackingCode,
    });
  }

  const sections: EmailSection[] = [
    renderSummaryTable({
      title: "Resumen",
      rows: summaryRows,
    }),
  ];

  if (details.manualReview.completed) {
    sections.push(
      renderInlineBlock({
        title: "Revisión manual completada",
        body: "Nuestro equipo revisó tu pedido y ya quedó listo para el siguiente paso.",
      }),
    );
  }

  if (details.customerNote) {
    sections.push(
      renderInlineBlock({
        title: "Mensaje del equipo",
        body: details.customerNote,
      }),
    );
  }

  sections.push(
    renderInlineBlock({
      title: "Próximo paso",
      body: details.nextStepText,
      accentColor: ORDER_EMAIL_THEME.warning,
      backgroundColor: ORDER_EMAIL_THEME.warningSoft,
    }),
  );

  if (details.trackingLink) {
    sections.push(
      renderActionButton({
        href: details.trackingLink,
        label: details.trackingCode ? "Ver seguimiento" : "Ver estado del pedido",
      }),
    );
  }

  if (details.orderItems.length > 0) {
    sections.push(renderOrderItemsTable(details.orderItems));
  }

  const message = renderEmailDocument({
    preheader: `Actualización de tu pedido #${details.orderShortId}`,
    brandName: "Vortixy",
    heroTitle: "Actualización de pedido",
    heroSubtitle: `Hola ${details.firstName}, gracias por comprar en Vortixy.`,
    orderMeta: `Pedido #${details.orderShortId}`,
    sections,
    footerLines: [
      "Si tienes dudas, responde este correo y con gusto te ayudamos.",
      "Este es un mensaje automático sobre tu pedido en Vortixy.",
    ],
  });

  return {
    subject: getStatusSubject(status, details.orderShortId),
    html: message.html,
    text: [
      `Hola ${details.firstName},`,
      `Actualización de tu pedido #${details.orderShortId}.`,
      `Estado actual: ${details.statusLabel}`,
      details.manualReview.completed
        ? details.manualReview.completedAt
          ? `Revisión manual: completada (${formatDateTime(details.manualReview.completedAt)}).`
          : "Revisión manual: completada."
        : null,
      details.dispatchReference
        ? `Referencia de despacho: ${details.dispatchReference}`
        : null,
      details.trackingCode ? `Guía de seguimiento: ${details.trackingCode}` : null,
      details.customerNote ? `Mensaje del equipo: ${details.customerNote}` : null,
      details.orderItems.length > 0
        ? [
            "Productos:",
            ...details.orderItems.map(
              (item) =>
                `- ${item.quantity}x ${item.product_name}${item.variant ? ` (${item.variant})` : ""} - ${formatCop(item.price * item.quantity)}`,
            ),
          ].join("\n")
        : null,
      `Total: ${formatCop(details.orderTotal)}`,
      `Próximo paso: ${details.nextStepText}`,
      details.trackingLink ? `Ver estado del pedido: ${details.trackingLink}` : null,
      "Gracias por comprar en Vortixy.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function buildOrderHistoryAccessEmailMessage(input: {
  email: string;
  link: string;
}): EmailMessage {
  const safeEmail = normalizeEmailAddress(input.email);
  const safeLink = String(input.link || "").trim();

  const message = renderEmailDocument({
    preheader: "Acceso seguro a tu historial de pedidos",
    brandName: "Vortixy",
    heroTitle: "Acceso seguro a tu historial",
    heroSubtitle:
      "Recibimos una solicitud para ver el historial de pedidos. Usa el siguiente enlace para acceder:",
    orderMeta: safeEmail,
    sections: [
      renderInlineBlock({
        title: "Verificación",
        body: "El enlace se genera de forma temporal para que puedas revisar tus pedidos recientes.",
      }),
      renderActionButton({
        href: safeLink,
        label: "Ver historial de pedidos",
      }),
      renderInlineBlock({
        title: "Privacidad",
        body: "Si no solicitaste este acceso, puedes ignorar este mensaje.",
        accentColor: "#6b7280",
        backgroundColor: "#f9fafb",
      }),
    ],
    footerLines: [
      "Este correo protege el acceso a tu historial.",
      "Si no solicitaste este acceso, ignora este mensaje.",
    ],
  });

  return {
    subject: "Vortixy: Acceso a tu historial de pedidos",
    html: message.html,
    text: [
      "Acceso seguro a tu historial de pedidos:",
      safeLink,
      `Correo destino: ${safeEmail}`,
      "",
      "Si no solicitaste este acceso, ignora este mensaje.",
    ].join("\n"),
  };
}
