import { useEffect, useCallback } from 'react';

/* ============================================
   KEYBOARD SHORTCUTS HOOK
   Microsoft Fluent Design System
   ============================================ */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except ESC)
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInput && event.key !== 'Escape') return;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

// Predefined POS shortcuts
export const POSShortcuts = {
  HELP: 'F1',
  DISCOUNT: 'F2',
  RETURN: 'F3',
  HOLD: 'F4',
  CUSTOMER: 'F5',
  PRICE_OVERRIDE: 'F6',
  ADD_NOTE: 'F7',
  PRINT_BARCODE: 'F8',
  SHIFT_REPORT: 'F9',
  SETTINGS: 'F10',
  
  PAYMENT: 'P',
  QUICK_CASH: 'N',
  DISCOUNT_CTRL: 'D',
  HOLD_CTRL: 'H',
  RETURN_CTRL: 'R',
  CLEAR_CART: 'K',
  SEARCH: 'F',
  
  DELETE: 'Delete',
  ESCAPE: 'Escape',
} as const;



/* ============================================
   KEYBOARD SHORTCUTS HOOK
   Microsoft Fluent Design System
   ============================================ */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except ESC)
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInput && event.key !== 'Escape') return;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

// Predefined POS shortcuts
export const POSShortcuts = {
  HELP: 'F1',
  DISCOUNT: 'F2',
  RETURN: 'F3',
  HOLD: 'F4',
  CUSTOMER: 'F5',
  PRICE_OVERRIDE: 'F6',
  ADD_NOTE: 'F7',
  PRINT_BARCODE: 'F8',
  SHIFT_REPORT: 'F9',
  SETTINGS: 'F10',
  
  PAYMENT: 'P',
  QUICK_CASH: 'N',
  DISCOUNT_CTRL: 'D',
  HOLD_CTRL: 'H',
  RETURN_CTRL: 'R',
  CLEAR_CART: 'K',
  SEARCH: 'F',
  
  DELETE: 'Delete',
  ESCAPE: 'Escape',
} as const;



/* ============================================
   KEYBOARD SHORTCUTS HOOK
   Microsoft Fluent Design System
   ============================================ */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs (except ESC)
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInput && event.key !== 'Escape') return;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

// Predefined POS shortcuts
export const POSShortcuts = {
  HELP: 'F1',
  DISCOUNT: 'F2',
  RETURN: 'F3',
  HOLD: 'F4',
  CUSTOMER: 'F5',
  PRICE_OVERRIDE: 'F6',
  ADD_NOTE: 'F7',
  PRINT_BARCODE: 'F8',
  SHIFT_REPORT: 'F9',
  SETTINGS: 'F10',
  
  PAYMENT: 'P',
  QUICK_CASH: 'N',
  DISCOUNT_CTRL: 'D',
  HOLD_CTRL: 'H',
  RETURN_CTRL: 'R',
  CLEAR_CART: 'K',
  SEARCH: 'F',
  
  DELETE: 'Delete',
  ESCAPE: 'Escape',
} as const;



