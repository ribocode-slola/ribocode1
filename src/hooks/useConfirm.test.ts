/**
 * Test suite for useConfirm hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-05-19
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useConfirm } from './useConfirm';

describe('useConfirm', () => {
  it('calls customConfirm if provided', () => {
    const customConfirm = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() => useConfirm(customConfirm));
    const confirm = result.current;
    expect(confirm('test message')).toBe(true);
    expect(customConfirm).toHaveBeenCalledWith('test message');
  });

  it('falls back to window.confirm if no customConfirm', () => {
    const windowConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useConfirm());
    const confirm = result.current;
    expect(confirm('another message')).toBe(false);
    expect(windowConfirm).toHaveBeenCalledWith('another message');
    windowConfirm.mockRestore();
  });
});
