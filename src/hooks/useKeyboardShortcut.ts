import { useEffect, useCallback, useRef } from "react";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts
 * Supports modifier keys (ctrl, meta, shift, alt) for common shortcuts
 */
export function useKeyboardShortcut(shortcuts: ShortcutConfig[]): void {
  const shortcutsRef = useRef<ShortcutConfig[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.callback();
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Common keyboard shortcuts for the app
 */
export const APP_SHORTCUTS = {
  OPEN_SEARCH: { key: "k", ctrl: true, callback: () => {} },
  CLOSE: { key: "Escape", callback: () => {} },
  GO_HOME: { key: "h", alt: true, callback: () => {} },
  GO_CART: { key: "c", alt: true, callback: () => {} },
  GO_FAVORITES: { key: "f", alt: true, callback: () => {} },
  REFRESH: { key: "r", ctrl: true, callback: () => {} },
  HELP: { key: "?", shift: true, callback: () => {} },
} as const;