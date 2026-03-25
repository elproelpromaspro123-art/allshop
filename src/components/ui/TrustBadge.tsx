import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  variant?: 'compact' | 'expanded';
  className?: string;
}

export function TrustBadge({
  icon: Icon,
  label,
  description,
  variant = 'compact',
  className,
}: TrustBadgeProps) {
  if (variant === 'expanded') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl',
          'bg-white ring-1 ring-black/5 hover:ring-emerald-500/20',
          'transition-all duration-300',
          className
        )}
      >
        <div className="flex-shrink-0 mt-1">
          <Icon className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-900">
            {label}
          </p>
          {description && (
            <p className="text-[12px] text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-white ring-1 ring-black/5',
        'transition-all duration-300 hover:ring-emerald-300',
        className
      )}
      title={description}
    >
      <Icon className="w-4 h-4 flex-shrink-0 text-emerald-700" />
      <span className="text-[12px] font-medium text-gray-900 truncate">
        {label}
      </span>
    </div>
  );
}
