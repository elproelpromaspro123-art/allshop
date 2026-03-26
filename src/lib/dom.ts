/**
 * DOM utilities
 */

export function query<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent?: Element | Document,
): T | null {
  return (parent || document).querySelector(selector);
}

export function queryAll<T extends HTMLElement = HTMLElement>(
  selector: string,
  parent?: Element | Document,
): T[] {
  return Array.from((parent || document).querySelectorAll(selector));
}

export function on<T extends HTMLElement>(
  element: T,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: Node[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }
  if (children) {
    children.forEach((c) => el.appendChild(c));
  }
  return el;
}

export function removeAllChildren(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function isElementInViewport(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

export function ready(fn: () => void) {
  if (document.readyState === "complete") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}