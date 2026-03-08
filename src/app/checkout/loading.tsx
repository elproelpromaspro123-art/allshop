import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-3">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-11 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-3">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[var(--border)] p-5 sm:p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-14 h-14 shrink-0" variant="card" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
