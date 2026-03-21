import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello World</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('renders fallback when error occurs', () => {
    // Component que lanza error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suprimir error en consola durante el test
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary name="TestComponent">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/algo salió mal/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy();
  });

  it('uses custom fallback if provided', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    const customFallback = <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeTruthy();
  });

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it.skip('allows retry with reset button', async () => {
    let shouldThrow = true;

    const ConditionalError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Success</div>;
    };

    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    const errorElements = screen.queryAllByText(/algo salió mal/i);
    expect(errorElements.length).toBeGreaterThan(0);

    // Simular que el error se resolvió
    shouldThrow = false;

    const retryButtons = screen.getAllByRole('button', { name: /reintentar/i });
    await retryButtons[0].click();

    // Re-renderizar para que se ejecute de nuevo
    rerender(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Success')).toBeTruthy();
  });
});
