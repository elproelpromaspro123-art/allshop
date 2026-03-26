"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { normalizeLegacyImagePath } from "@/lib/image-paths";
import type { WishlistItem } from "@/store/wishlist";

const savedAtFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  day: "numeric",
});

interface WishlistItemCardProps {
  item: WishlistItem;
  priceLabel: string;
  onRemove: (id: string) => void;
}

export function WishlistItemCard({
  item,
  priceLabel,
  onRemove,
}: WishlistItemCardProps) {
  const categoryLabel = item.categoryName || "Sin categoria";
  const savedLabel = savedAtFormatter.format(item.savedAt);

  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-[rgba(23,19,15,0.08)] bg-white/88 shadow-[0_18px_48px_rgba(23,19,15,0.06)]">
      <div className="relative aspect-[1.08] overflow-hidden bg-[linear-gradient(180deg,#f7f2ea,#f3ede4)]">
        {item.image ? (
          <Image
            src={normalizeLegacyImagePath(item.image)}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Sparkles className="h-10 w-10" />
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/88 text-rose-600 shadow-[0_14px_32px_rgba(15,23,42,0.12)] transition-all hover:scale-[1.03] hover:bg-white"
          aria-label={`Quitar ${item.name} de favoritos`}
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          <span>{categoryLabel}</span>
          <span>Guardado {savedLabel}</span>
        </div>

        <div>
          <h3 className="line-clamp-2 text-xl font-black tracking-[-0.04em] text-slate-950">
            {item.name}
          </h3>
          <p suppressHydrationWarning className="mt-2 text-sm font-semibold text-emerald-700">
            {priceLabel}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2">
            <Link href={`/producto/${item.slug}`}>
              Ver producto
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
            Quitar
          </Button>
        </div>
      </div>
    </article>
  );
}
