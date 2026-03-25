import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Forms Column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Contact Info Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3 shadow-sm">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            {/* Shipping Info Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-3 shadow-sm">
              <Skeleton className="h-5 w-48 mb-4" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm sticky top-6">
              <Skeleton className="h-5 w-40" />

              {/* Product Items */}
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton
                      className="w-14 h-14 shrink-0 rounded-xl"
                      variant="card"
                    />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <Skeleton className="h-px w-full" />

              {/* Totals */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>

              {/* CTA Button */}
              <Skeleton className="h-12 w-full rounded-xl" variant="button" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
