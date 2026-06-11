/**
 * Test suite for UI handlers in Ribocode.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Copilot, Andy Turner <agdturner@gmail.com>
 * @version 1.0.1
 * @lastModified 2026-06-11
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { useHandleFileChange, handleToggle } from './uiHandlers';
import { renderHook, act } from '@testing-library/react';

vi.mock('molstar/lib/mol-plugin/commands', () => ({
  PluginCommands: {
    State: {
      ToggleVisibility: {
        apply: vi.fn().mockResolvedValue(undefined),
      },
    },
  },
}));

// Mock MoleculeMode type for test
const DummyMode = 'dummy-mode';

describe('uiHandlers', () => {
  beforeEach(async () => {
    const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');
    vi.clearAllMocks();
  });
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
    it('should toggle visibility via PluginCommands and update visible state', async () => {
      const model = { cell: { transform: { ref: 'model-ref-1' } } };
      const viewer = {
        moleculeKey: { presetResult: { model } },
        ref: {
          current: {
            state: { data: { cells: new Map() } },
            canvas3d: { requestDraw: vi.fn() },
          },
        },
      };
      const setVisible = vi.fn();
      const isVisible = false;

      await handleToggle(viewer, 'moleculeKey', setVisible, isVisible);

      const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');
      expect(PluginCommands.State.ToggleVisibility.apply).toHaveBeenCalledTimes(1);
      expect(PluginCommands.State.ToggleVisibility.apply).toHaveBeenCalledWith(
        viewer.ref.current,
        [viewer.ref.current, { state: viewer.ref.current.state.data, ref: 'model-ref-1' }]
      );
      expect(setVisible).toHaveBeenCalledWith(true);
    });

    it('should do nothing when model is missing', async () => {
      const viewer = {
        moleculeKey: { presetResult: {} },
        ref: { current: null },
      };
      const setVisible = vi.fn();

      await handleToggle(viewer, 'moleculeKey', setVisible, false);

      const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');
      expect(PluginCommands.State.ToggleVisibility.apply).not.toHaveBeenCalled();
      expect(setVisible).not.toHaveBeenCalled();
    });
  });
});
