'use client';

import { useCallback, useEffect, useState } from 'react';

const HINT_OPEN_STORAGE_KEY = 'vstep_hint_panel_open_v1';

/**
 * Shared persistent open state for the VSTEP Hint UI.
 * Defaults to `true` (always shown) and only closes when the user explicitly closes/toggles it.
 */
export function useHintOpen() {
  const [isHintOpen, setIsHintOpenState] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HINT_OPEN_STORAGE_KEY);
      if (saved === 'false') {
        setIsHintOpenState(false);
      } else if (saved === 'true') {
        setIsHintOpenState(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setIsHintOpen = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setIsHintOpenState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        window.localStorage.setItem(HINT_OPEN_STORAGE_KEY, String(resolved));
      } catch {
        // ignore storage errors
      }
      return resolved;
    });
  }, []);

  return [isHintOpen, setIsHintOpen] as const;
}

