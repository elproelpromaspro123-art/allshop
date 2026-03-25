import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <>
      {/* Breadcrumb skeleton */}
      <div className="bg-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
      </div>

      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            {/* Image gallery skeleton */}
            <div>
              <Skeleton className="aspect-square rounded-3xl mb-3" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shrink-0"
                  />
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="flex flex-col gap-4">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-3.5 h-3.5 rounded" />
                  ))}
                </div>
                <Skeleton className="h-3 w-24 rounded" />
              </div>

              {/* Title */}
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4 rounded-lg" />

              {/* Live visitors */}
              <Skeleton className="h-5 w-40 rounded-full" />

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>

              {/* Shipping badge */}
              <Skeleton className="h-14 w-full rounded-xl" />

              {/* Stock card */}
              <Skeleton className="h-32 w-full rounded-3xl" />

              {/* Quantity + Add to cart */}
              <div className="flex gap-3">
                <Skeleton className="h-12 w-28 rounded-full" />
                <Skeleton className="h-12 flex-1 rounded-full" />
              </div>

              {/* Buy now */}
              <Skeleton className="h-12 w-full rounded-full" />

              {/* Trust items */}
              <div className="space-y-2.5 mt-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Description section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
