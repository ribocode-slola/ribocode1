/**
 * Custom React hook for managing chain state, including chain labels and selected chain ID.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-05-19
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { useCallback } from 'react';

/**
 * Custom hook to abstract confirmation dialog logic.
 * Allows injection/mocking for tests.
 * @param customConfirm Optional custom confirm function (for tests/mocking)
 */
export function useConfirm(customConfirm?: (message: string) => boolean): (message: string) => boolean {
  return useCallback(
    (message: string) => {
      if (customConfirm) return customConfirm(message);
      return window.confirm(message);
    },
    [customConfirm]
  );
}
