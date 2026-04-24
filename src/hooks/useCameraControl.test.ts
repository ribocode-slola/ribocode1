/**
 * Test suite for useCameraControl hook.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCameraControl } from './useCameraControl';

describe('useCameraControl', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCameraControl());
    expect(result.current.zoomExtraRadius).toBe(20);
    expect(result.current.zoomMinRadius).toBe(16);
    expect(result.current.cameraANear).toBe(0.1);
    expect(result.current.cameraAFar).toBe(100);
    expect(result.current.cameraBNear).toBe(0.1);
    expect(result.current.cameraBFar).toBe(100);
  });

  it('should update zoom and camera state', () => {
    const { result } = renderHook(() => useCameraControl());
    act(() => {
      result.current.setZoomExtraRadius(30);
      result.current.setZoomMinRadius(25);
      result.current.setCameraANear(0.2);
      result.current.setCameraAFar(200);
      result.current.setCameraBNear(0.3);
      result.current.setCameraBFar(300);
    });
    expect(result.current.zoomExtraRadius).toBe(30);
    expect(result.current.zoomMinRadius).toBe(25);
    expect(result.current.cameraANear).toBe(0.2);
    expect(result.current.cameraAFar).toBe(200);
    expect(result.current.cameraBNear).toBe(0.3);
    expect(result.current.cameraBFar).toBe(300);
  });
});
