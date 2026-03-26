/**
 * Function utilities
 */

export function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key) as ReturnType<T>;
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function partial<T extends (...args: unknown[]) => unknown>(
  fn: T,
  presetArgs: Partial<Parameters<T>>,
): (...args: Partial<Parameters<T>>) => void {
  return (...laterArgs: Partial<Parameters<T>>) => {
    fn(...presetArgs, ...laterArgs);
  };
}