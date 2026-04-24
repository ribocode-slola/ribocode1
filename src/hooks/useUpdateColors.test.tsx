/**
 * Test suite for useUpdateColors hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import * as colorUtils from '../utils/colors';
import { useUpdateColors } from './useUpdateColors';

describe('useUpdateColors', () => {
  it('registers theme and sets colors loaded when color data is present', () => {
    const setIsColorsLoaded = vi.fn();
    const registerThemeIfNeeded = vi.fn();
    vi.spyOn(colorUtils, 'registerThemeIfNeeded').mockImplementation(registerThemeIfNeeded);

    const colorFileData = [
      { pdb_chain: 'A', color: '#FF0000' },
      { pdb_chain: 'B', color: '#00FF00' },
    ];
    const mockPlugin = {};
    const chainColorMaps = new Map();
    renderHook(() =>
      useUpdateColors(
        mockPlugin,
        colorFileData,
        setIsColorsLoaded,
        'TestTheme',
        chainColorMaps,
        []
      )
    );
    expect(registerThemeIfNeeded).toHaveBeenCalledWith(mockPlugin, 'TestTheme', chainColorMaps);
    expect(setIsColorsLoaded).toHaveBeenCalledWith(true);
  });

  it('sets colors loaded to false if color data is empty', () => {
    const setIsColorsLoaded = vi.fn();
    const mockPlugin = {};
    const chainColorMaps = new Map();
    renderHook(() =>
      useUpdateColors(
        mockPlugin,
        [],
        setIsColorsLoaded,
        'TestTheme',
        chainColorMaps,
        []
      )
    );
    expect(setIsColorsLoaded).toHaveBeenCalledWith(false);
  });
});
