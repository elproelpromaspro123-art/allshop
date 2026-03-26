"use client";

import { useEffect, useMemo, useRef } from "react";
import { trackClientEvent } from "@/lib/analytics";
import { usePricing } from "@/providers/PricingProvider";
import {
  groupWishlistItems,
  summarizeWishlistItems,
  useWishlistStore,
} from "@/store/wishlist";
import { WishlistEmptyState } from "./WishlistEmptyState";
import { WishlistGroupSection } from "./WishlistGroupSection";
import { WishlistOverview } from "./WishlistOverview";

const savedAtFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  day: "numeric",
});

export function WishlistPageClient() {
  const items = useWishlistStore((store) => store.items);
  const hasHydrated = useWishlistStore((store) => store.hasHydrated);
  const clear = useWishlistStore((store) => store.clear);
  const removeItem = useWishlistStore((store) => store.removeItem);
  const { formatDisplayPrice } = usePricing();
  const hasTrackedView = useRef(false);
  const groupedItems = useMemo(() => groupWishlistItems(items), [items]);
  const summary = useMemo(() => summarizeWishlistItems(items), [items]);

  useEffect(() => {
    if (!hasHydrated || hasTrackedView.current) return;
    hasTrackedView.current = true;

    void trackClientEvent({
      event_type: "view_wishlist",
      metadata: {
        source: "wishlist_page",
        count: items.length,
        category_count: summary.categoryCount,
      },
    }, { onceKey: "view_wishlist_page" });
  }, [hasHydrated, items.length, summary.categoryCount]);

  const handleClear = () => {
    void trackClientEvent({
      event_type: "remove_wishlist",
      metadata: {
        source: "wishlist_page",
        action: "clear_all",
        count: items.length,
      },
    });
    clear();
  };

  if (!hasHydrated) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
        Cargando favoritos...
      </div>
    );
  }

  if (items.length === 0) {
    return <WishlistEmptyState />;
  }

  const latestSavedLabel = summary.latestSavedAt
    ? savedAtFormatter.format(summary.latestSavedAt)
    : "Sin fecha";

  return (
    <div className="grid gap-6">
      <WishlistOverview
        itemCount={summary.itemCount}
        categoryCount={summary.categoryCount}
        totalValueLabel={formatDisplayPrice(summary.totalValue)}
        latestSavedLabel={latestSavedLabel}
        onClear={handleClear}
      />

      <div className="space-y-6">
        {groupedItems.map((group) => (
          <WishlistGroupSection
            key={group.categoryName}
            group={group}
            formatPrice={formatDisplayPrice}
            onRemove={(id) => {
              const item = items.find((entry) => entry.id === id);
              void trackClientEvent({
                event_type: "remove_wishlist",
                product_id: id,
                metadata: {
                  source: "wishlist_page",
                  slug: item?.slug || null,
                  action: "card",
                },
              });
              removeItem(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
