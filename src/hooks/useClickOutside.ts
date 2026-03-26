import { useEffect, useRef, useCallback, type RefObject } from "react";

/**
 * Hook to detect clicks outside of a specified element
 * Useful for closing dropdowns, modals, drawers on outside click
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  onOutsideClick: (event: MouseEvent | TouchEvent) => void,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  const handleClick = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (element && !element.contains(event.target as Node)) {
        onOutsideClick(event);
      }
    },
    [onOutsideClick],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [handleClick]);

  return ref;
}

/**
 * Hook to detect escape key press
 */
export function useEscapeKey(callback: () => void): void {
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        callback();
      }
    },
    [callback],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}