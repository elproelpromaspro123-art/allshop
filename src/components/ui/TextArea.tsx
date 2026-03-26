"use client";
import { cn } from "@/lib/utils";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, ...props }: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <textarea className={cn(
        "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
        error ? "border-red-500 focus:ring-red-500/20" : "border-gray-300 focus:ring-emerald-500/20",
        className,
      )} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
