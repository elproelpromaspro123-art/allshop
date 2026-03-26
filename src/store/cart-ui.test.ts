import { beforeEach, describe, expect, it } from "vitest";
import { useCartUiStore } from "./cart-ui";

describe("cart ui store", () => {
  beforeEach(() => {
    useCartUiStore.setState({
      isDrawerOpen: false,
      lastDrawerSource: null,
    });
  });

  it("opens the drawer and stores the source", () => {
    useCartUiStore.getState().openDrawer("header");
    expect(useCartUiStore.getState().isDrawerOpen).toBe(true);
    expect(useCartUiStore.getState().lastDrawerSource).toBe("header");
  });

  it("closes the drawer without clearing the last source", () => {
    useCartUiStore.getState().openDrawer("mobile-shortcut");
    useCartUiStore.getState().closeDrawer();
    expect(useCartUiStore.getState().isDrawerOpen).toBe(false);
    expect(useCartUiStore.getState().lastDrawerSource).toBe(
      "mobile-shortcut",
    );
  });

  it("toggles the drawer from closed to open", () => {
    useCartUiStore.getState().toggleDrawer("product-banner");
    expect(useCartUiStore.getState().isDrawerOpen).toBe(true);
    expect(useCartUiStore.getState().lastDrawerSource).toBe("product-banner");
  });

  it("toggles the drawer from open to closed", () => {
    useCartUiStore.setState({
      isDrawerOpen: true,
      lastDrawerSource: "header",
    });
    useCartUiStore.getState().toggleDrawer("product-sticky");
    expect(useCartUiStore.getState().isDrawerOpen).toBe(false);
    expect(useCartUiStore.getState().lastDrawerSource).toBe("product-sticky");
  });
});
