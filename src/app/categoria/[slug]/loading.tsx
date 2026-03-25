import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Skeleton */}
        <div className="mb-10 sm:mb-12">
          <Skeleton className="h-10 w-64 rounded-xl mb-4" />
          <Skeleton className="h-5 w-3/4 max-w-2xl rounded-lg" />
        </div>

        {/* Content layout (filters + grid) */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Skeleton */}
          <div className="hidden lg:block w-64 shrink-0 space-y-6">
            <Skeleton className="h-8 w-1/2 rounded-lg" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full rounded-md" />
              ))}
            </div>
            <div className="pt-6 border-t border-gray-100 space-y-3">
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <Skeleton className="h-5 w-32 rounded-lg hidden sm:block" />
              <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
