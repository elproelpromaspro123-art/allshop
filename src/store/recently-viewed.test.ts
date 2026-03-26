import { describe, it, expect, beforeEach } from "vitest";
import { useRecentlyViewedStore } from "./recently-viewed";

describe("recently-viewed store", () => {
  beforeEach(() => {
    useRecentlyViewedStore.getState().clear();
  });

  it("starts empty", () => {
    const state = useRecentlyViewedStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it("adds a product", () => {
    const { addItem } = useRecentlyViewedStore.getState();
    addItem({
      id: "product-1",
      slug: "test-product",
      name: "Test Product",
      image: null,
      price: 50000,
    });
    const items = useRecentlyViewedStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe("test-product");
  });

  it("deduplicates products", () => {
    const { addItem } = useRecentlyViewedStore.getState();
    addItem({ id: "p1", slug: "p1", name: "P1", image: null, price: 100 });
    addItem({ id: "p2", slug: "p2", name: "P2", image: null, price: 200 });
    addItem({ id: "p1", slug: "p1", name: "P1", image: null, price: 100 });
    const items = useRecentlyViewedStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("p1");
  });

  it("limits to 8 items", () => {
    const { addItem } = useRecentlyViewedStore.getState();
    for (let i = 0; i < 10; i++) {
      addItem({ id: `p${i}`, slug: `p${i}`, name: `P${i}`, image: null, price: i });
    }
    expect(useRecentlyViewedStore.getState().items).toHaveLength(8);
  });

  it("sets viewedAt timestamp", () => {
    const { addItem } = useRecentlyViewedStore.getState();
    addItem({ id: "p1", slug: "p1", name: "P1", image: null, price: 100 });
    const item = useRecentlyViewedStore.getState().items[0];
    expect(item.viewedAt).toBeGreaterThan(0);
  });

  it("clears all items", () => {
    const { addItem, clear } = useRecentlyViewedStore.getState();
    addItem({ id: "p1", slug: "p1", name: "P1", image: null, price: 100 });
    clear();
    expect(useRecentlyViewedStore.getState().items).toHaveLength(0);
  });
});
