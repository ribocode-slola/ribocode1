/**
 * Test suite for useChainState hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChainState } from './useChainState';

describe('useChainState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChainState());
    expect(result.current.chainInfo.chainLabels.size).toBe(0);
    expect(result.current.selectedChainId).toBe('');
  });

  it('should update chainInfo and selectedChainId', () => {
    const { result } = renderHook(() => useChainState());
    act(() => {
      result.current.setChainInfo({ chainLabels: new Map([['A', 'Alpha']]) });
      result.current.setSelectedChainId('A');
    });
    expect(result.current.chainInfo.chainLabels.get('A')).toBe('Alpha');
    expect(result.current.selectedChainId).toBe('A');
  });
});
