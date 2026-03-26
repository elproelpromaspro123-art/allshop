"use client";
import { cn } from "@/lib/utils";

interface RadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function Radio({ name, value, checked, onChange, label, disabled }: RadioProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", disabled && "opacity-50")}>
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={() => onChange(value)}
        className="w-4 h-4 border-gray-300 text-emerald-600" />
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
