import { Skeleton } from "@/components/ui/Skeleton";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="border-b border-[var(--border)] py-16 sm:py-24 bg-gradient-to-b from-[var(--surface)] to-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-[var(--surface-muted)] border border-[var(--border-subtle)] mb-6">
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-5 w-1/2 mx-auto mb-8" />
          <Skeleton className="h-11 w-40 mx-auto rounded-xl" variant="button" />
        </div>
      </div>
      
      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-white p-4 flex flex-col items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" variant="card" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-b from-[var(--surface-muted)]/50 to-[var(--background)]">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm">
              <Skeleton className="aspect-square w-full" variant="card" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-12 line-through" />
                </div>
                <Skeleton className="h-9 w-full mt-2 rounded-xl" variant="button" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Trust Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" variant="card" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
