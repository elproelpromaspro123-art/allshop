import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-full border border-emerald-500/22 bg-[linear-gradient(135deg,#0e8f61_0%,#10b981_52%,#34d399_100%)] text-white shadow-[0_14px_34px_rgba(5,150,105,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(5,150,105,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-emerald-500/25",
        secondary:
          "rounded-full border border-indigo-500/18 bg-[linear-gradient(135deg,#4f46e5_0%,#6366f1_55%,#818cf8_100%)] text-white shadow-[0_14px_34px_rgba(79,70,229,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(79,70,229,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-indigo-500/25",
        outline:
          "rounded-full border border-gray-200 bg-white/88 text-gray-900 shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-black/12 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-black/10",
        ghost:
          "rounded-full border border-transparent bg-transparent text-gray-500 hover:bg-white/82 hover:text-gray-900 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)] active:scale-[0.99] focus-visible:ring-gray-400/20",
        destructive:
          "rounded-full border border-red-500/20 bg-[linear-gradient(135deg,#dc2626_0%,#ef4444_100%)] text-white shadow-[0_10px_24px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(220,38,38,0.25)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-red-500",
        success:
          "rounded-full border border-emerald-500/20 bg-[linear-gradient(135deg,#059669_0%,#10b981_100%)] text-white shadow-[0_10px_24px_rgba(5,150,105,0.2)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(5,150,105,0.25)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-emerald-500",
        warm:
          "rounded-full border border-amber-400/20 bg-[linear-gradient(135deg,#d97706_0%,#f59e0b_100%)] text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(217,119,6,0.28)] active:translate-y-0 active:scale-[0.99] focus-visible:ring-amber-500",
        soft:
          "rounded-full border border-emerald-500/12 bg-emerald-50 text-emerald-700 shadow-[0_10px_28px_rgba(16,185,129,0.08)] hover:bg-emerald-500/15 hover:border-emerald-500/20 active:scale-[0.99] focus-visible:ring-emerald-500/20",
        link:
          "rounded-none border-none bg-transparent text-emerald-700 underline-offset-4 hover:underline hover:text-emerald-600 p-0 h-auto focus-visible:ring-emerald-500",
      },
      size: {
        default: "h-12 px-6 text-sm",
        sm: "h-10 px-[1.125rem] text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg font-bold",
        icon: "h-11 w-11",
        iconSm: "h-9 w-9",
        iconLg: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
