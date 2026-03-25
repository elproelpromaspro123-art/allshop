"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import type { ProductReview } from "@/types";

interface ReviewListProps {
  reviews: ProductReview[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  const { t } = useLanguage();

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

  if (reviews.length === 0) {
    return (
      <p className="text-sm rounded-xl border px-4 py-3 border-gray-200 bg-gray-100 text-gray-700">
        {t("product.reviewsEmpty")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reviews.map((review) => {
        const reviewDate = formatReviewDate(review.created_at);
        const safeRating = Math.min(5, Math.max(1, review.rating));

        return (
          <article key={review.id} className="review-card relative quote-decoration">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-white shadow-sm">
                    {(review.reviewer_name || "C").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
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
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                {t("product.reviewVerifiedPurchase")}
              </span>
            </div>

            <div className="flex items-center gap-0.5 mb-2">
              {[...Array(5)].map((_, starIndex) => (
                <Star
                  key={`${review.id}-star-${starIndex}`}
                  className={cn(
                    "w-3.5 h-3.5",
                    starIndex < safeRating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-amber-400/20 text-amber-400/35",
                  )}
                />
              ))}
            </div>

            {review.title ? (
              <p className="text-sm font-semibold mb-1 text-gray-900">{review.title}</p>
            ) : null}
            <p className="text-sm leading-relaxed text-gray-700">{review.body}</p>
            {review.variant ? (
              <p className="text-xs text-gray-400 mt-2">
                {t("product.reviewVariantLabel")} {review.variant}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
