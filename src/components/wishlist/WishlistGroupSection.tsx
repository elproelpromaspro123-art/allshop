"use client";

import { Heart, Tag } from "lucide-react";
import { WishlistItemCard } from "./WishlistItemCard";
import { WISHLIST_DEFAULT_CATEGORY, type WishlistGroup } from "@/store/wishlist";

interface WishlistGroupSectionProps {
  group: WishlistGroup;
  formatPrice: (amount: number) => string;
  onRemove: (id: string) => void;
}

export function WishlistGroupSection({
  group,
  formatPrice,
  onRemove,
}: WishlistGroupSectionProps) {
  const totalLabel = formatPrice(group.totalValue);
  const categoryLabel = group.categoryName || WISHLIST_DEFAULT_CATEGORY;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[rgba(23,19,15,0.08)] bg-white px-5 py-4 shadow-[0_12px_28px_rgba(23,19,15,0.05)] sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            Categoria guardada
          </div>
          <h3 className="text-2xl font-black tracking-[-0.05em] text-slate-950">
            {categoryLabel}
          </h3>
          <p className="text-sm text-slate-500">
            {group.items.length} {group.items.length === 1 ? "producto" : "productos"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            <Tag className="h-3.5 w-3.5" />
            Valor estimado
          </div>
          <div suppressHydrationWarning className="mt-2 text-2xl font-black tracking-[-0.05em] text-emerald-950">
            {totalLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {group.items.map((item) => (
          <WishlistItemCard
            key={`${item.id}-${item.savedAt}`}
            item={item}
            priceLabel={formatPrice(item.price)}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}
