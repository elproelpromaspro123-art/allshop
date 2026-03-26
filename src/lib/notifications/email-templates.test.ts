import { describe, it, expect } from "vitest";
import {
  buildNewsletterWelcomeEmail,
  buildReviewInvitationEmail,
  buildAbandonedCartEmail,
  buildBackInStockEmail,
  buildRefundConfirmedEmail,
} from "./email-templates";

describe("buildNewsletterWelcomeEmail", () => {
  it("generates subject, html, and text", () => {
    const email = buildNewsletterWelcomeEmail({ email: "test@test.com" });
    expect(email.subject).toContain("Bienvenido");
    expect(email.html).toContain("Vortixy");
    expect(email.text).toContain("Bienvenido");
  });

  it("includes discount code when provided", () => {
    const email = buildNewsletterWelcomeEmail({
      email: "test@test.com",
      discountCode: "WELCOME10",
    });
    expect(email.html).toContain("WELCOME10");
    expect(email.text).toContain("WELCOME10");
  });
});

describe("buildReviewInvitationEmail", () => {
  it("includes product name in subject", () => {
    const email = buildReviewInvitationEmail({
      customerName: "Juan Pérez",
      orderId: "abc12345-def",
      productName: "Audifonos Xiaomi",
      productSlug: "audifonos-xiaomi",
      reviewUrl: "https://vortixy.net/review/abc",
    });
    expect(email.subject).toContain("Audifonos Xiaomi");
    expect(email.html).toContain("Juan");
  });

  it("includes review button", () => {
    const email = buildReviewInvitationEmail({
      customerName: "Ana",
      orderId: "abc12345",
      productName: "Test",
      productSlug: "test",
      reviewUrl: "https://vortixy.net/review/test",
    });
    expect(email.html).toContain("Dejar una reseña");
  });
});

describe("buildAbandonedCartEmail", () => {
  it("includes item count and total", () => {
    const email = buildAbandonedCartEmail({
      customerName: "Carlos",
      customerEmail: "carlos@test.com",
      items: [
        { name: "Product A", price: 50000, quantity: 1, slug: "a" },
        { name: "Product B", price: 30000, quantity: 2, slug: "b" },
      ],
      total: 110000,
      checkoutUrl: "https://vortixy.net/checkout",
    });
    expect(email.subject).toContain("carrito");
    expect(email.text).toContain("110.000");
    expect(email.text).toContain("2x Product B");
  });

  it("includes discount code when provided", () => {
    const email = buildAbandonedCartEmail({
      customerName: "Ana",
      customerEmail: "ana@test.com",
      items: [{ name: "Product", price: 100, quantity: 1, slug: "p" }],
      total: 100,
      checkoutUrl: "https://vortixy.net/checkout",
      discountCode: "COMEBACK15",
    });
    expect(email.html).toContain("COMEBACK15");
  });
});

describe("buildBackInStockEmail", () => {
  it("includes product name and price", () => {
    const email = buildBackInStockEmail({
      customerName: "María",
      productName: "Auriculares Pro",
      productSlug: "auriculares-pro",
      price: 45000,
    });
    expect(email.subject).toContain("Auriculares Pro");
    expect(email.html).toContain("45.000");
    expect(email.text).toContain("Auriculares Pro");
  });
});

describe("buildRefundConfirmedEmail", () => {
  it("includes refund amount and reason", () => {
    const email = buildRefundConfirmedEmail({
      customerName: "Pedro",
      orderId: "abc12345-def",
      refundAmount: 95000,
      refundReason: "Producto defectuoso",
    });
    expect(email.subject).toContain("Reembolso");
    expect(email.text).toContain("95.000");
    expect(email.text).toContain("Producto defectuoso");
  });
});
