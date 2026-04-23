/**
 * Test suite for useResidueState hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useResidueState } from './useResidueState';
import { ResidueLabelInfo } from '../utils/residue';

describe('useResidueState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useResidueState());
    expect(result.current.residueInfo.residueLabels.size).toBe(0);
    expect(Object.keys(result.current.residueInfo.residueToAtomIds).length).toBe(0);
    expect(result.current.selectedResidueId).toBe('');
  });

  it('should update residueInfo and selectedResidueId', () => {
    const { result } = renderHook(() => useResidueState());
    const label: ResidueLabelInfo = { id: '1', label: 'ALA', chainId: 'A', seq: 1 };
    act(() => {
      result.current.setResidueInfo({
        residueLabels: new Map([['1', label]]),
        residueToAtomIds: { '1': ['a1', 'a2'] },
      });
      result.current.setSelectedResidueId('1');
    });
    expect(result.current.residueInfo.residueLabels.get('1')).toEqual(label);
    expect(result.current.residueInfo.residueToAtomIds['1']).toEqual(['a1', 'a2']);
    expect(result.current.selectedResidueId).toBe('1');
  });
});
