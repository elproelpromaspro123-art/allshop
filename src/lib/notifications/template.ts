import { escapeHtml } from "@/lib/utils";
import type { OrderItem } from "@/types/database";
import { formatCop, ORDER_EMAIL_THEME } from "./shared";

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

export interface EmailContent {
  html: string;
  text: string;
}

export interface EmailSection {
  html: string;
  text?: string | string[];
}

interface RenderEmailDocumentInput {
  preheader: string;
  brandName: string;
  heroTitle: string;
  heroSubtitle?: string;
  orderMeta?: string;
  sections: EmailSection[];
  footerLines: string[];
}

interface RenderInlineBlockInput {
  title: string;
  body: string;
  accentColor?: string;
  backgroundColor?: string;
}

interface RenderSummaryTableInput {
  title: string;
  rows: Array<{ label: string; value: string }>;
}

interface RenderActionButtonInput {
  label: string;
  href: string;
}

export function renderActionButton({
  label,
  href,
}: RenderActionButtonInput): EmailSection {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);

  return {
    html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">
        <tr>
          <td align="center">
            <a href="${safeHref}" style="display:inline-block;background:${ORDER_EMAIL_THEME.accentStrong};color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700;font-size:14px;line-height:1;">
              ${safeLabel}
            </a>
          </td>
        </tr>
      </table>
    `,
    text: `${label}: ${href}`,
  };
}

export function renderInlineBlock({
  title,
  body,
  accentColor = ORDER_EMAIL_THEME.accentText,
  backgroundColor = ORDER_EMAIL_THEME.accentSoft,
}: RenderInlineBlockInput): EmailSection {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");

  return {
    html: `
      <div style="margin-top:16px;border-left:4px solid ${accentColor};background:${backgroundColor};padding:12px 14px;border-radius:10px;">
        <div style="font-size:12px;color:${accentColor};font-weight:700;margin-bottom:4px;">${safeTitle}</div>
        <div style="font-size:13px;color:#0f172a;line-height:1.55;">${safeBody}</div>
      </div>
    `,
    text: `${title}: ${body}`,
  };
}

export function renderSummaryTable({
  title,
  rows,
}: RenderSummaryTableInput): EmailSection {
  const safeTitle = escapeHtml(title);

  return {
    html: `
      <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:14px;padding:14px;background:#f9fafb;">
        <div style="font-size:12px;color:#6b7280;font-weight:700;margin-bottom:8px;">${safeTitle}</div>
        <table role="presentation" width="100%" style="font-size:13px;color:#111827;border-collapse:collapse;">
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td style="padding:4px 0;color:#6b7280;">${escapeHtml(row.label)}</td>
                    <td style="padding:4px 0;font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `,
    text: [title, ...rows.map((row) => `${row.label}: ${row.value}`)],
  };
}

export function renderOrderItemsTable(items: OrderItem[]): EmailSection {
  const rows = items
    .map((item) => {
      const variant = item.variant ? `Variante: ${escapeHtml(item.variant)}<br/>` : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <strong style="display:block;margin-bottom:2px;color:#111827;">${escapeHtml(item.product_name)}</strong>
            ${variant}
          </td>
          <td align="center" style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${item.quantity}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;font-weight:600;">
            ${formatCop(item.price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  return {
    html: `
      <div style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
        <h3 style="margin:0 0 10px;font-size:15px;color:#111827;">Productos</h3>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Producto</th>
              <th align="center" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Cant.</th>
              <th align="right" style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-weight:600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
    text: [
      "Productos:",
      ...items.map(
        (item) =>
          `- ${item.quantity}x ${item.product_name}${item.variant ? ` (${item.variant})` : ""} - ${formatCop(item.price * item.quantity)}`,
      ),
    ],
  };
}

export function renderEmailDocument({
  preheader,
  brandName,
  heroTitle,
  heroSubtitle,
  orderMeta,
  sections,
  footerLines,
}: RenderEmailDocumentInput): EmailContent {
  const bodyHtml = sections.map((section) => section.html).join("");
  const textSections = sections.flatMap((section) => {
    if (!section.text) return [];
    return Array.isArray(section.text) ? section.text : [section.text];
  });

  return {
    html: `
      <div style="margin:0;padding:0;background:#f3f4f6;">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:22px 24px;background:${ORDER_EMAIL_THEME.accentDark};color:#ffffff;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <table role="presentation" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-right:10px;">
                                <div style="width:36px;height:36px;border-radius:12px;background:${ORDER_EMAIL_THEME.accent};color:${ORDER_EMAIL_THEME.accentDark};font-weight:800;font-size:17px;line-height:36px;text-align:center;">V</div>
                              </td>
                              <td>
                                <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">${escapeHtml(brandName)}</div>
                                <div style="font-size:18px;font-weight:700;margin-top:3px;">${escapeHtml(heroTitle)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td align="right" style="font-size:12px;opacity:0.85;">${escapeHtml(preheader)}</td>
                      </tr>
                    </table>
                    ${heroSubtitle ? `<div style="font-size:13px;margin-top:8px;opacity:0.9;">${escapeHtml(heroSubtitle)}</div>` : ""}
                    ${orderMeta ? `<div style="font-size:12px;margin-top:4px;opacity:0.8;">${escapeHtml(orderMeta)}</div>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px 24px;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 24px;border-top:1px solid #e5e7eb;background:#f9fafb;">
                    ${footerLines
                      .map((line, index) =>
                        index === 0
                          ? `<div style="font-size:12px;color:#6b7280;">${escapeHtml(line)}</div>`
                          : `<div style="margin-top:6px;font-size:11px;color:#9ca3af;">${escapeHtml(line)}</div>`,
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    text: [preheader, heroTitle, heroSubtitle, orderMeta, ...textSections, ...footerLines]
      .filter(Boolean)
      .join("\n"),
  };
}
