/**
 * Math utilities
 */

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function roundToDecimals(value: number, decimals = 0) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function percentage(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a: number, b: number) {
  return (a * b) / gcd(a, b);
}