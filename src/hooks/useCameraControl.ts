/**
 * Custom React hook for managing camera control state.
 * 
 * Copyright (c) 2024-now Ribocode contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Andy Turner <agdturner@gmail.com>
 */
import { useState } from 'react';

// Custom React hook for managing camera control state
export function useCameraControl() {
  // Zoom-to-residue options
  const [zoomExtraRadius, setZoomExtraRadius] = useState<number>(20);
  const [zoomMinRadius, setZoomMinRadius] = useState<number>(16);

  // Camera near/far state for each dataset
  const [cameraANear, setCameraANear] = useState<number>(0.1);
  const [cameraAFar, setCameraAFar] = useState<number>(100);
  const [cameraBNear, setCameraBNear] = useState<number>(0.1);
  const [cameraBFar, setCameraBFar] = useState<number>(100);

  return {
    zoomExtraRadius,
    setZoomExtraRadius,
    zoomMinRadius,
    setZoomMinRadius,
    cameraANear,
    setCameraANear,
    cameraAFar,
    setCameraAFar,
    cameraBNear,
    setCameraBNear,
    cameraBFar,
    setCameraBFar,
  };
}
