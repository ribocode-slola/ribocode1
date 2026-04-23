/**
 * Custom React hook for managing fog control state.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useState, useCallback } from 'react';

// Minimal type for plugin with canvas3d
type Canvas3DPlugin = {
  canvas3d?: {
    setProps: (props: any) => void;
    camera?: {
      near?: number;
      far?: number;
      updateProjectionMatrix?: () => void;
    };
    requestDraw?: () => void;
    props?: { camera?: any };
  };
};

export function useFogControl() {
  // Fog state for each dataset (shared between viewers)
  const [fogAEnabled, setFogAEnabled] = useState(true);
  const [fogANear, setFogANear] = useState(0.5);
  const [fogAFar, setFogAFar] = useState(2.0);
  const [fogBEnabled, setFogBEnabled] = useState(true);
  const [fogBNear, setFogBNear] = useState(0.5);
  const [fogBFar, setFogBFar] = useState(2.0);

  // Helper to update fog in both viewers for a dataset
  const updateFog = useCallback(
    (
      pluginA: Canvas3DPlugin,
      pluginB: Canvas3DPlugin,
      enabled: boolean,
      near: number,
      far: number,
      cameraNear: number,
      cameraFar: number
    ) => {
    const fogProps = { camera: { fog: enabled, fogNear: near, fogFar: far, near: cameraNear, far: cameraFar } };
    [pluginA, pluginB].forEach((plugin, idx) => {
      if (plugin?.canvas3d) {
        plugin.canvas3d.setProps(fogProps);
        if (plugin.canvas3d.camera) {
          if (typeof plugin.canvas3d.camera.near === 'number') plugin.canvas3d.camera.near = cameraNear;
          if (typeof plugin.canvas3d.camera.far === 'number') plugin.canvas3d.camera.far = cameraFar;
          if (typeof plugin.canvas3d.camera.updateProjectionMatrix === 'function') plugin.canvas3d.camera.updateProjectionMatrix();
        }
        if (typeof plugin.canvas3d.requestDraw === 'function') plugin.canvas3d.requestDraw();
        const camProps = plugin.canvas3d.props?.camera;
        let camNear = undefined, camFar = undefined;
        if (plugin.canvas3d.camera) {
          camNear = plugin.canvas3d.camera.near;
          camFar = plugin.canvas3d.camera.far;
        }
        console.log(`[updateFog] Viewer ${idx === 0 ? 'A' : 'B'} camera props:`, camProps, 'actual near:', camNear, 'actual far:', camFar);
      }
    });
  }, []);

  return {
    fogAEnabled, setFogAEnabled,
    fogANear, setFogANear,
    fogAFar, setFogAFar,
    fogBEnabled, setFogBEnabled,
    fogBNear, setFogBNear,
    fogBFar, setFogBFar,
    updateFog,
  };
}
