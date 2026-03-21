import { Skeleton } from "./ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="product-surface relative overflow-hidden rounded-[1.25rem] bg-white ring-1 ring-black/[0.04] p-2 sm:p-3 pb-4 sm:pb-5">
      <Skeleton className="aspect-square w-full rounded-2xl mb-4" variant="card" />
      <div className="px-2 sm:px-3 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="pt-2">
          <Skeleton className="h-6 w-1/3 rounded-lg" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
