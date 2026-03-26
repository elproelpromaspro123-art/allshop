/**
 * Lazy loading and intersection observer utilities
 */

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.bottom > 0 &&
    rect.right > 0
  );
}

/**
 * Prefetch images for products above the fold
 */
export function prefetchProductImages(imageUrls: string[]): void {
  if (typeof window === "undefined") return;
  
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

/**
 * Intersection Observer callback type
 */
export type IntersectionObserverCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void;

/**
 * Create an intersection observer for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit,
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: "100px",
    threshold: 0.1,
    ...options,
  });
}

/**
 * Check if element should be loaded based on viewport
 */
export function shouldLoadImage(img: HTMLImageElement, viewportHeight: number): boolean {
  if (!img.dataset.src) return false;
  
  const rect = img.getBoundingClientRect();
  const inView = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
  
  return inView || Math.abs(rect.top + rect.height) < viewportHeight;
}

/**
 * Preload a script dynamically
 */
export function preloadScript(src: string): void {
  if (typeof window === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "script";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Preload a stylesheet dynamically
 */
export function preloadStylesheet(href: string): void {
  if (typeof window === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "style";
  link.href = href;
  document.head.appendChild(link);
}