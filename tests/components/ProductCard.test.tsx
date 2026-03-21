import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock dependencies
vi.mock('@/lib/utils', () => ({
  calculateDiscount: vi.fn((price: number, comparePrice: number) => 
    comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0
  ),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
}));

vi.mock('@/lib/shipping', () => ({
  isProductShippingFree: vi.fn(() => false),
}));

vi.mock('@/lib/image-paths', () => ({
  normalizeLegacyImagePath: vi.fn((path: string) => path),
}));

vi.mock('@/lib/promo-pricing', () => ({
  getEffectiveCompareAtPrice: vi.fn(() => 0),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => <button {...props}>{children}</button>,
}));

vi.mock('@/store/cart', () => ({
  useCartStore: vi.fn(() => ({
    addItem: vi.fn(),
    getItemCount: vi.fn(() => 0),
  })),
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/providers/LanguageProvider', () => ({
  useLanguage: vi.fn(() => ({
    t: (key: string) => key,
  })),
}));

vi.mock('@/providers/PricingProvider', () => ({
  usePricing: vi.fn(() => ({
    formatDisplayPrice: (price: number) => `$${price}`,
  })),
}));

const mockProduct: Product = {
  id: '1',
  slug: 'test-product',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  compare_at_price: 150,
  images: ['/image1.jpg', '/image2.jpg'],
  variants: [],
  category_id: 'test-category',
  stock_location: 'nacional',
  average_rating: 4.5,
  reviews_count: 10,
  is_bestseller: false,
  free_shipping: false,
  shipping_cost: 10,
  is_featured: true,
  is_active: true,
  provider_api_url: null,
  meta_title: 'Test Product',
  meta_description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product name', () => {
    render(
      <ProductCard product={mockProduct} enableImageRotation={false} />
    );
    expect(screen.getByText('Test Product')).toBeTruthy();
  });

  it.skip('displays price correctly', () => {
    render(
      <ProductCard product={mockProduct} enableImageRotation={false} />
    );
    expect(screen.getByText('$100')).toBeTruthy();
  });

  it.skip('shows rating stars when rating exists', () => {
    render(
      <ProductCard product={mockProduct} enableImageRotation={false} />
    );
    const ratingElement = screen.getByText('4.5');
    expect(ratingElement).toBeTruthy();
  });

  it.skip('displays discount badge when there is a compare price', () => {
    render(
      <ProductCard product={mockProduct} enableImageRotation={false} />
    );
    // El descuento es calculado como (150-100)/150 = 33%
    expect(screen.getByText('-33%')).toBeTruthy();
  });

  it.skip('has Add to Cart button for simple products', () => {
    render(
      <ProductCard product={mockProduct} enableImageRotation={false} />
    );
    const addBtn = screen.getByRole('button', { name: /agregar|add/i });
    expect(addBtn).toBeTruthy();
  });

  it.skip('enables image rotation when prop is true', async () => {
    vi.useFakeTimers();
    
    render(
      <ProductCard product={mockProduct} enableImageRotation={true} />
    );

    // Simular el paso de tiempo
    vi.advanceTimersByTime(3000);
    
    vi.useRealTimers();
  });

  it('respects prefers-reduced-motion', () => {
    const mediaQuery = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaQuery);

    render(
      <ProductCard product={mockProduct} enableImageRotation={true} />
    );

    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    );
  });
});
