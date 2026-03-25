"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import type { ProductReview } from "@/types";

interface ReviewListProps {
  reviews: ProductReview[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const reviewDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const formatReviewDate = (value: string): string | null => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return reviewDateFormatter.format(parsed);
  };

  const safeReviews = useMemo(
    () => reviews.map((review) => ({ ...review, rating: Math.min(5, Math.max(1, review.rating)) })),
    [reviews],
  );

  const averageRating = useMemo(() => {
    if (safeReviews.length === 0) return 0;
    return (
      safeReviews.reduce((sum, review) => sum + review.rating, 0) / safeReviews.length
    );
  }, [safeReviews]);

  const ratingBreakdown = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = safeReviews.filter((review) => review.rating === rating).length;
        return {
          rating,
          count,
          percentage: safeReviews.length > 0 ? (count / safeReviews.length) * 100 : 0,
        };
      }),
    [safeReviews],
  );

  const filteredReviews = useMemo(
    () =>
      activeFilter === null
        ? safeReviews
        : safeReviews.filter((review) => review.rating === activeFilter),
    [activeFilter, safeReviews],
  );

  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700">
        {t("product.reviewsEmpty")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-[1.8rem] border border-gray-200 bg-gray-50 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-6">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Resumen de reviews
          </p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">
              {averageRating.toFixed(1)}
            </span>
            <div className="pb-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-amber-400/20 text-amber-400/35",
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {safeReviews.length} opiniones verificadas
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ratingBreakdown.map((item) => (
            <button
              key={item.rating}
              type="button"
              onClick={() =>
                setActiveFilter((current) => (current === item.rating ? null : item.rating))
              }
              className={cn(
                "grid w-full grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors",
                activeFilter === item.rating ? "bg-white shadow-sm" : "hover:bg-white/70",
              )}
            >
              <span className="text-sm font-semibold text-slate-700">
                {item.rating}★
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-emerald-600"
                  style={{ width: `${item.percentage}%` }}
                />
              </span>
              <span className="text-right text-sm text-slate-500">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
          label="Todas"
        />
        {[5, 4, 3, 2, 1].map((rating) => (
          <FilterChip
            key={rating}
            active={activeFilter === rating}
            onClick={() => setActiveFilter(rating)}
            label={`${rating} estrellas`}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredReviews.map((review) => {
          const reviewDate = formatReviewDate(review.created_at);

          return (
            <article key={review.id} className="review-card relative quote-decoration">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm">
                      {(review.reviewer_name || "C").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {review.reviewer_name || t("product.reviewVerifiedCustomer")}
                      </p>
                      {reviewDate ? (
                        <p suppressHydrationWarning className="text-xs text-gray-400">
                          {reviewDate}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {t("product.reviewVerifiedPurchase")}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={`${review.id}-star-${starIndex}`}
                    className={cn(
                      "h-3.5 w-3.5",
                      starIndex < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-amber-400/20 text-amber-400/35",
                    )}
                  />
                ))}
              </div>

              {review.title ? (
                <p className="mb-1 text-sm font-semibold text-gray-900">{review.title}</p>
              ) : null}
              <p className="text-sm leading-relaxed text-gray-700">{review.body}</p>
              {review.variant ? (
                <p className="mt-2 text-xs text-gray-400">
                  {t("product.reviewVariantLabel")} {review.variant}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900",
      )}
    >
      {label}
    </button>
  );
}
