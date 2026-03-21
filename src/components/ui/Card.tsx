/**
 * Card component con diseño premium y confiable
 * Usar en productos, testimonios, características
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat' | 'outlined';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, ...props }, ref) => {
    const baseClasses =
      'rounded-[var(--card-radius)] transition-all duration-300';

    const variantClasses = {
      default:
        'bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]',
      elevated:
        'bg-[var(--surface-elevated)] shadow-[var(--shadow-elevated)] ring-1 ring-black/[0.05]',
      flat: 'bg-[var(--surface-muted)] ring-1 ring-black/[0.04]',
      outlined: 'bg-white ring-1 ring-[var(--border-subtle)]',
    };

    const interactiveClasses = interactive
      ? 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 active:translate-y-0 hover:border-[var(--accent)]/30 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/20'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], interactiveClasses, className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
