/**
 * Class manipulation utilities
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean,
): boolean {
  return element.classList.toggle(className, force);
}

export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

export function addClasses(element: HTMLElement, ...classNames: string[]): void {
  element.classList.add(...classNames);
}

export function removeClasses(element: HTMLElement, ...classNames: string[]): void {
  element.classList.remove(...classNames);
}

export function toggleClasses(
  element: HTMLElement,
  classes: Record<string, boolean>,
): void {
  for (const [cls, shouldHave] of Object.entries(classes)) {
    if (shouldHave) element.classList.add(cls);
    else element.classList.remove(cls);
  }
}