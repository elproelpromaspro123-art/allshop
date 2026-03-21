/**
 * Componente Testimonial - Card de cliente con diseño profesional
 * Muestra nombre, cargo, contenido, y rating
 */

import { Star } from 'lucide-react';
import { Card } from './Card';

interface TestimonialProps {
  message: string;
  author: string;
  role?: string;
  rating?: number;
  avatar?: string;
}

export function Testimonial({ message, author, role, rating = 5, avatar }: TestimonialProps) {
  return (
    <Card variant="elevated" className="p-5 sm:p-6 flex flex-col h-full">
      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Message */}
      <p className="text-sm text-[var(--muted-strong)] leading-relaxed flex-1 mb-4">
        "{message}"
      </p>

      {/* Author info */}
      <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
        {avatar && (
          <img
            src={avatar}
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[13px] text-[var(--foreground)] truncate">
            {author}
          </p>
          {role && (
            <p className="text-[11px] text-[var(--muted-soft)] truncate">{role}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
