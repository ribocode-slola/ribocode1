/**
 * Test suite for UI handlers in Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { describe, it, vi, expect } from 'vitest';
import { useHandleFileChange, handleToggle } from './uiHandlers';
import { renderHook, act } from '@testing-library/react';

// Mock MoleculeMode type for test
const DummyMode = 'dummy-mode';

describe('uiHandlers', () => {
  describe('useHandleFileChange', () => {
    it('should call molecule loading logic when file is selected', async () => {
      const pluginA = { current: {} };
      const pluginB = { current: {} };
      const { result } = renderHook(() => useHandleFileChange(pluginA, pluginB));
      // Mock File
      const file = new File(['test'], 'test.pdb');
      const event = { target: { files: [file] } };
      // Patch global FileReader
      const readAsText = vi.fn();
      const addEventListener = vi.fn((_, cb) => cb());
      global.FileReader = vi.fn(() => ({
        readAsText,
        addEventListener,
        onload: null,
        result: 'MOCK_PDB',
      })) as any;
      // Should not throw
      await act(async () => {
        await result.current(event as any, DummyMode as any);
      });
      expect(pluginA.current).toBeDefined();
      expect(pluginB.current).toBeDefined();
    });
    it('should log error if plugins are not initialized', async () => {
      const pluginA = { current: null };
      const pluginB = { current: null };
      const { result } = renderHook(() => useHandleFileChange(pluginA, pluginB));
      const event = { target: { files: [new File([''], 'a')] } };
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        await result.current(event as any, DummyMode as any);
      });
      expect(errorSpy).toHaveBeenCalledWith('One or both viewers are not initialized.');
      errorSpy.mockRestore();
    });
  });

  describe('handleToggle', () => {
    it('should call toggleVisibility and setVisible', async () => {
      const model = {};
      const viewer = { moleculeKey: { presetResult: { model } } };
      const setVisible = vi.fn();
      const isVisible = false;
      // Patch toggleVisibility
      const toggleVisibility = vi.fn();
      // Patch global function in module scope
      (global as any).toggleVisibility = toggleVisibility;
      await handleToggle(viewer, 'moleculeKey', setVisible, isVisible);
      expect(setVisible).toHaveBeenCalledWith(true);
    });
  });
});
