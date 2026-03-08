import { Skeleton } from "@/components/ui/Skeleton";

export default function ProductLoading() {
  return (
    <>
      <div className="border-b bg-[var(--surface-muted)] border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-3" variant="circle" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3" variant="circle" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="bg-[var(--background)] py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
            <div>
              <Skeleton className="aspect-square w-full mb-3" variant="card" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" variant="card" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-24 w-full" variant="card" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
