import { beforeEach, describe, expect, it } from "vitest";
import {
  WISHLIST_DEFAULT_CATEGORY,
  groupWishlistItems,
  normalizeWishlistItems,
  summarizeWishlistItems,
  useWishlistStore,
} from "./wishlist";

const ITEM = {
  id: "prod-1",
  slug: "airpods-pro-3",
  name: "AirPods Pro 3",
  image: "/productos/x.png",
  price: 249900,
  categoryName: "Audio",
};

describe("wishlist store", () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [], hasHydrated: false });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("vortixy-wishlist");
    }
  });

  it("adds items and deduplicates by product id", () => {
    useWishlistStore.getState().addItem(ITEM);
    useWishlistStore.getState().addItem(ITEM);

    expect(useWishlistStore.getState().items).toHaveLength(1);
    expect(useWishlistStore.getState().getItemCount()).toBe(1);
  });

  it("toggles items on and off", () => {
    const added = useWishlistStore.getState().toggleItem(ITEM);
    const removed = useWishlistStore.getState().toggleItem(ITEM);

    expect(added).toBe(true);
    expect(removed).toBe(false);
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it("clears all saved products", () => {
    useWishlistStore.getState().addItem(ITEM);
    useWishlistStore.getState().clear();
    expect(useWishlistStore.getState().items).toEqual([]);
  });

  it("normalizes and deduplicates persisted items", () => {
    const items = normalizeWishlistItems([
      {
        id: "prod-1",
        slug: "airpods-pro-3",
        name: "AirPods Pro 3",
        image: "/productos/x.png",
        price: 249900,
        categoryName: "Audio",
        savedAt: 10,
      },
      {
        id: "prod-1",
        slug: "airpods-pro-3",
        name: "AirPods Pro 3",
        image: "/productos/x.png",
        price: 249900,
        categoryName: "Audio",
        savedAt: 20,
      },
      {
        id: "prod-2",
        slug: "auriculares",
        name: "Auriculares",
        image: "",
        price: 149900,
        categoryName: "",
        savedAt: 15,
      },
      {
        id: "broken",
        slug: "",
        name: "",
        image: "",
        price: 0,
        savedAt: 0,
      } as never,
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("prod-1");
    expect(items[1].id).toBe("prod-2");
    expect(items[1].image).toBeNull();
    expect(items[1].categoryName).toBeNull();
  });

  it("groups wishlist items by category and computes totals", () => {
    const grouped = groupWishlistItems([
      {
        id: "prod-1",
        slug: "airpods-pro-3",
        name: "AirPods Pro 3",
        image: "/productos/x.png",
        price: 249900,
        categoryName: "Audio",
        savedAt: 10,
      },
      {
        id: "prod-2",
        slug: "bose-qc",
        name: "Bose QC",
        image: "/productos/y.png",
        price: 199900,
        categoryName: "Audio",
        savedAt: 15,
      },
      {
        id: "prod-3",
        slug: "cargador",
        name: "Cargador",
        image: "/productos/z.png",
        price: 59900,
        categoryName: null,
        savedAt: 12,
      },
    ]);

    expect(grouped[0].categoryName).toBe("Audio");
    expect(grouped[0].items).toHaveLength(2);
    expect(grouped[0].totalValue).toBe(449800);
    expect(grouped[1].categoryName).toBe(WISHLIST_DEFAULT_CATEGORY);
  });

  it("summarizes counts, categories and estimated value", () => {
    const summary = summarizeWishlistItems([
      {
        id: "prod-1",
        slug: "airpods-pro-3",
        name: "AirPods Pro 3",
        image: "/productos/x.png",
        price: 249900,
        categoryName: "Audio",
        savedAt: 10,
      },
      {
        id: "prod-2",
        slug: "cargador",
        name: "Cargador",
        image: "/productos/z.png",
        price: 59900,
        categoryName: null,
        savedAt: 12,
      },
    ]);

    expect(summary).toEqual({
      itemCount: 2,
      categoryCount: 2,
      totalValue: 309800,
      latestSavedAt: 12,
    });
  });
});
