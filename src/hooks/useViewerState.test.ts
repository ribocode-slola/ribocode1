/**
 * Test suite for useViewerState hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { renderHook, act } from '@testing-library/react';
import { useViewerState } from './useViewerState';

describe('useViewerState', () => {
  it('initializes with default values and updates state', () => {
    const { result } = renderHook(() => useViewerState('A'));

    // Check initial values
    expect(result.current.moleculeAlignedTo).toBeUndefined();
    expect(result.current.isMoleculeAlignedToLoaded).toBe(false);
    expect(result.current.isMoleculeAlignedLoaded).toBe(false);
    expect(result.current.isMoleculeAlignedToVisible).toBe(false);
    expect(result.current.isMoleculeAlignedVisible).toBe(false);
    expect(result.current.ref.current).toBeNull();
    expect(result.current.fileInputRef.current).toBeNull();
    expect(result.current.viewerKey).toBe('A');

    // Test state setters
    act(() => {
      result.current.setIsMoleculeAlignedToLoaded(true);
      result.current.setIsMoleculeAlignedLoaded(true);
      result.current.setIsMoleculeAlignedToVisible(true);
      result.current.setIsMoleculeAlignedVisible(true);
    });
    expect(result.current.isMoleculeAlignedToLoaded).toBe(true);
    expect(result.current.isMoleculeAlignedLoaded).toBe(true);
    expect(result.current.isMoleculeAlignedToVisible).toBe(true);
    expect(result.current.isMoleculeAlignedVisible).toBe(true);
  });
});
