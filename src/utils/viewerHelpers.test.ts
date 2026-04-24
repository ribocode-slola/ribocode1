/**
 * Unit tests for viewer helper functions, including fog and camera setters, and zoom handlers.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { makeFogSetters, makeCameraSetters, createZoomHandler, makeZoomHandler } from './viewerHelpers';

describe('viewerHelpers', () => {
  it('makeFogSetters returns correct setter functions', () => {
    let fog = { enabled: false, near: 0, far: 100 };
    const setFog = (fn: any) => { fog = fn(fog); };
    const setters = makeFogSetters(setFog);
    setters.setEnabled(true);
    expect(fog.enabled).toBe(true);
    setters.setNear(10);
    expect(fog.near).toBe(10);
    setters.setFar(200);
    expect(fog.far).toBe(200);
  });

  it('makeCameraSetters returns correct setter functions', () => {
    let camera = { near: 0.1, far: 1000 };
    const setCamera = (fn: any) => { camera = fn(camera); };
    const setters = makeCameraSetters(setCamera);
    setters.setNear(5);
    expect(camera.near).toBe(5);
    setters.setFar(500);
    expect(camera.far).toBe(500);
  });

  it('createZoomHandler returns an object with handleButtonClick', () => {
    const pluginRef = { current: null };
    const handler = createZoomHandler(pluginRef as any, null, 'chain-test', '', false);
    expect(typeof handler.handleButtonClick).toBe('function');
  });

  it('makeZoomHandler returns an object with handleButtonClick', () => {
    const pluginRef = { current: null };
    const handler = makeZoomHandler({
      pluginRef: pluginRef as any,
      structureRef: null,
      property: 'chain-test',
      chainId: '',
      sync: false
    });
    expect(typeof handler.handleButtonClick).toBe('function');
  });
});
