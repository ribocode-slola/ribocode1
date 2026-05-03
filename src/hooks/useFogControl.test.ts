/**
 * Test suite for useFogControl hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 * 
 * @author Andy Turner <agdturner@gmail.com>
 * @version 1.0.0
 * @lastModified 2026-04-24
 * @see https://github.com/ribocode-slola/ribocode1
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFogControl } from './useFogControl';

describe('useFogControl', () => {
  it('should initialize fog state with default values', () => {
    const { result } = renderHook(() => useFogControl());
    expect(result.current.fogAEnabled).toBe(true);
    expect(result.current.fogANear).toBe(0.5);
    expect(result.current.fogAFar).toBe(2.0);
    expect(result.current.fogBEnabled).toBe(true);
    expect(result.current.fogBNear).toBe(0.5);
    expect(result.current.fogBFar).toBe(2.0);
  });

  it('should update fog state', () => {
    const { result } = renderHook(() => useFogControl());
    act(() => {
      result.current.setFogAEnabled(false);
      result.current.setFogANear(1.2);
      result.current.setFogAFar(3.4);
      result.current.setFogBEnabled(false);
      result.current.setFogBNear(1.5);
      result.current.setFogBFar(4.2);
    });
    expect(result.current.fogAEnabled).toBe(false);
    expect(result.current.fogANear).toBe(1.2);
    expect(result.current.fogAFar).toBe(3.4);
    expect(result.current.fogBEnabled).toBe(false);
    expect(result.current.fogBNear).toBe(1.5);
    expect(result.current.fogBFar).toBe(4.2);
  });

  it('should call updateFog and log camera props', () => {
    const { result } = renderHook(() => useFogControl());
    const pluginA = { canvas3d: {
      setProps: vi.fn(),
      camera: {
        near: 0.1,
        far: 100,
        updateProjectionMatrix: vi.fn()
      },
      requestDraw: vi.fn(),
      props: { camera: {} }
    }};
    const pluginB = { canvas3d: {
      setProps: vi.fn(),
      camera: {
        near: 0.1,
        far: 100,
        updateProjectionMatrix: vi.fn()
      },
      requestDraw: vi.fn(),
      props: { camera: {} }
    }};
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    act(() => {
      result.current.updateFog(pluginA, pluginB, true, 1, 2, 0.2, 50);
    });
    expect(pluginA.canvas3d.setProps).toHaveBeenCalled();
    expect(pluginB.canvas3d.setProps).toHaveBeenCalled();
    expect(pluginA.canvas3d.requestDraw).toHaveBeenCalled();
    expect(pluginB.canvas3d.requestDraw).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
