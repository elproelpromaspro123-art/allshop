import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cart";

function createItem(overrides: Partial<import("@/types").CartItem> = {}): import("@/types").CartItem {
  return {
    productId: "test-1",
    slug: "test-product",
    name: "Test Product",
    price: 50000,
    image: "/images/test.png",
    variant: null,
    quantity: 1,
    freeShipping: false,
    shippingCost: null,
    stockLocation: "nacional",
    ...overrides,
  };
}

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], hasHydrated: true });
  });

  it("adds an item", () => {
    useCartStore.getState().addItem(createItem());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe("test-1");
  });

  it("increments quantity for duplicate item", () => {
    useCartStore.getState().addItem(createItem());
    useCartStore.getState().addItem(createItem());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("caps quantity at 10", () => {
    useCartStore.getState().addItem(createItem({ quantity: 8 }));
    useCartStore.getState().addItem(createItem({ quantity: 5 }));
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  it("treats different variants as separate items", () => {
    useCartStore.getState().addItem(createItem({ variant: "rojo" }));
    useCartStore.getState().addItem(createItem({ variant: "azul" }));
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("removes an item", () => {
    useCartStore.getState().addItem(createItem());
    useCartStore.getState().removeItem("test-1", null);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity", () => {
    useCartStore.getState().addItem(createItem());
    useCartStore.getState().updateQuantity("test-1", null, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes item when updating quantity to 0", () => {
    useCartStore.getState().addItem(createItem());
    useCartStore.getState().updateQuantity("test-1", null, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calculates total correctly", () => {
    useCartStore.getState().addItem(createItem({ price: 30000, quantity: 2 }));
    useCartStore.getState().addItem(createItem({ productId: "test-2", price: 20000 }));
    expect(useCartStore.getState().getTotal()).toBe(80000);
  });

  it("counts items correctly", () => {
    useCartStore.getState().addItem(createItem({ quantity: 3 }));
    useCartStore.getState().addItem(createItem({ productId: "test-2", quantity: 2 }));
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it("clears cart", () => {
    useCartStore.getState().addItem(createItem());
    useCartStore.getState().addItem(createItem({ productId: "test-2" }));
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("returns correct shipping type", () => {
    useCartStore.getState().addItem(createItem({ stockLocation: "nacional" }));
    expect(useCartStore.getState().getShippingType()).toBe("nacional");
  });

  it("detects mixed shipping", () => {
    useCartStore.getState().addItem(createItem({ stockLocation: "nacional" }));
    useCartStore.getState().addItem(createItem({ productId: "test-2", stockLocation: "internacional" }));
    expect(useCartStore.getState().getShippingType()).toBe("mixto");
  });
});
