/**
 * Array utilities for common operations
 */

/**

 * Group array items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      (acc[groupKey] = acc[groupKey] || []).push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/**

 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], ...keys: Array<keyof T | ((item: T) => string | number)>): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = typeof key === "function" ? key(a) : a[key];
      const bVal = typeof key === "function" ? key(b) : b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

/**

 * Filter array by unique values
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**

 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**

 * Find duplicates in array
 */
export function duplicates<T>(array: T[], key?: keyof T): T[] {
  const seen = new Set();
  const dupes = new Set();
  for (const item of array) {
    const val = key ? item[key] : item;
    if (seen.has(val)) dupes.add(val);
    else seen.add(val);
  }
  return array.filter((item) => dupes.has(key ? item[key] : item));
}

/**

 * Flatten nested arrays one level
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.flat();
}

/**

 * Partition array into two groups
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean,
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of array) {
    if (predicate(item)) pass.push(item);
    else fail.push(item);
  }
  return [pass, fail];
}

/**

 * Pick random items from array
 */
export function sample<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**

 * Calculate difference between two arrays
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**

 * Calculate intersection of two arrays
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

/**

 * Merge two arrays removing duplicates
 */
export function union<T>(arr1: T[], arr2: T[]): T[] {
  return [...new Set([...arr1, ...arr2])];
}