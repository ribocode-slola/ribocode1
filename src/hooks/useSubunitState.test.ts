/**
 * Test suite for useSubunitState hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSubunitState } from './useSubunitState';
import { RibosomeSubunitType } from '../utils/subunit';

describe('useSubunitState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSubunitState());
    expect(result.current.subunitToChainIds.size).toBe(4);
    expect(result.current.selectedSubunit).toBe('All');
  });

  it('should update subunitToChainIds and selectedSubunit', () => {
    const { result } = renderHook(() => useSubunitState());
    const newMap = new Map<string, Set<string>>([
      ['All', new Set(['A'])],
      ['Large', new Set(['B'])],
      ['Small', new Set(['C'])],
      ['Other', new Set(['D'])],
    ]);
    act(() => {
      result.current.setSubunitToChainIds(newMap);
      result.current.setSelectedSubunit('Large');
    });
    expect(Array.from(result.current.subunitToChainIds.get('All')!)).toEqual(['A']);
    expect(result.current.selectedSubunit).toBe('Large');
  });
});
