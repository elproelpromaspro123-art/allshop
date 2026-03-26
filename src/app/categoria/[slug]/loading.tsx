import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-4 w-44 rounded-full" />
        </div>

        <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)]">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-36 rounded-full" />
                <Skeleton className="h-9 w-full max-w-md rounded-2xl" />
                <Skeleton className="h-5 w-5/6 rounded-xl" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-5">
            <Skeleton className="h-[220px] w-full rounded-[1.5rem] sm:h-[260px]" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-8 w-full rounded-2xl" />
              <Skeleton className="h-5 w-4/5 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-[1.8rem] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_auto]">
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full lg:w-72" />
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-3">
          <Skeleton className="h-24 rounded-[1.4rem]" />
          <Skeleton className="h-24 rounded-[1.4rem]" />
          <Skeleton className="h-24 rounded-[1.4rem]" />
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <Skeleton className="min-h-[420px] rounded-[2rem]" />
          <div className="space-y-4">
            <Skeleton className="h-[290px] rounded-[2rem]" />
            <Skeleton className="h-[140px] rounded-[1.6rem]" />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>

        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
