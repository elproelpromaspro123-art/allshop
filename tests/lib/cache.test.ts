import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cache } from '@/lib/cache';

describe('Cache Service', () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('expires entries after TTL', () => {
    cache.set('key1', 'value1', 5000); // 5 segundos

    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(6000); // Avanzar 6 segundos

    expect(cache.get('key1')).toBeNull();
  });

  it('uses default TTL of 5 minutes', () => {
    cache.set('key1', 'value1'); // Sin especificar TTL

    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(4 * 60 * 1000); // 4 minutos

    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(2 * 60 * 1000); // Otros 2 minutos (total 6)

    expect(cache.get('key1')).toBeNull();
  });

  it('deletes specific entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.delete('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('clears all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('invalidates by pattern', () => {
    cache.set('user:1', 'data1');
    cache.set('user:2', 'data2');
    cache.set('post:1', 'data3');

    cache.invalidate('^user:');

    expect(cache.get('user:1')).toBeNull();
    expect(cache.get('user:2')).toBeNull();
    expect(cache.get('post:1')).toBe('data3');
  });

  it('getOrCompute computes and caches value', async () => {
    const computeFn = vi.fn(async () => 'computed_value');

    const result = await cache.getOrCompute('key1', computeFn);
    expect(result).toBe('computed_value');
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Segunda llamada debe usar caché
    const result2 = await cache.getOrCompute('key1', computeFn);
    expect(result2).toBe('computed_value');
    expect(computeFn).toHaveBeenCalledTimes(1); // Sin llamada adicional
  });

  it('getOrCompute expires and recomputes', async () => {
    const computeFn = vi.fn(async () => 'computed_value');

    cache.getOrCompute('key1', computeFn, 5000);

    expect(computeFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6000);

    // Después de expirar, debe recomputar
    await cache.getOrCompute('key1', computeFn);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

  it('maintains correct size', () => {
    expect(cache.size()).toBe(0);

    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);

    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.delete('key1');
    expect(cache.size()).toBe(1);
  });

  it('handles different data types', () => {
    cache.set('string', 'text');
    cache.set('number', 42);
    cache.set('object', { name: 'John', value: 100 });
    cache.set('array', [1, 2, 3]);

    expect(cache.get('string')).toBe('text');
    expect(cache.get('number')).toBe(42);
    expect(cache.get('object')).toEqual({ name: 'John', value: 100 });
    expect(cache.get('array')).toEqual([1, 2, 3]);
  });
});
