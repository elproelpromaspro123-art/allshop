import { describe, expect, it } from "vitest";
import { validateCheckoutBody, type CheckoutBody } from "./checkout-contract";

function buildCheckoutBody(
  overrides: Partial<CheckoutBody> = {},
): CheckoutBody {
  return {
    items: [{ id: "prod-1", slug: "producto-1", quantity: 1 }],
    payer: {
      name: "Carlos Garcia Lopez",
      email: "carlos@example.com",
      phone: "3105557890",
      document: "1234567890",
    },
    shipping: {
      address: "Calle 45 #12-34, Barrio Centro",
      city: "Bogota",
      department: "Cundinamarca",
      type: "nacional",
    },
    verification: {
      address_confirmed: true,
      availability_confirmed: true,
      product_acknowledged: true,
    },
    ...overrides,
  };
}

describe("validateCheckoutBody", () => {
  it("accepts a valid payload", () => {
    const result = validateCheckoutBody(buildCheckoutBody());

    expect(result.fieldErrors).toEqual({});
    expect(result.verificationError).toBeNull();
    expect(result.shippingTypeError).toBeNull();
  });

  it("returns field errors for invalid customer and shipping data", () => {
    const result = validateCheckoutBody(
      buildCheckoutBody({
        payer: {
          name: "Ana",
          email: "correo-invalido",
          phone: "123",
          document: "12",
        },
        shipping: {
          address: "Calle 1",
          city: "BC",
          department: "Atlantis",
          type: "nacional",
        },
      }),
    );

    expect(result.fieldErrors.name).toBeTruthy();
    expect(result.fieldErrors.email).toBeTruthy();
    expect(result.fieldErrors.phone).toBeTruthy();
    expect(result.fieldErrors.document).toBeTruthy();
    expect(result.fieldErrors.address).toBeTruthy();
    expect(result.fieldErrors.city).toBeTruthy();
    expect(result.fieldErrors.department).toBeTruthy();
  });

  it("requires all checkout confirmations", () => {
    const result = validateCheckoutBody(
      buildCheckoutBody({
        verification: {
          address_confirmed: true,
          availability_confirmed: false,
          product_acknowledged: true,
        },
      }),
    );

    expect(result.verificationError).toContain("disponibilidad");
  });

  it("rejects unsupported shipping types", () => {
    const result = validateCheckoutBody(
      buildCheckoutBody({
        shipping: {
          address: "Calle 45 #12-34, Barrio Centro",
          city: "Bogota",
          department: "Cundinamarca",
          type: "internacional",
        },
      }),
    );

    expect(result.shippingTypeError).toContain("envio nacional");
  });
});
