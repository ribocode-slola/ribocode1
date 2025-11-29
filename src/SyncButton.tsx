import React, { useRef, useEffect, useState } from 'react';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { useSync } from './SyncContext';
import { Subscription } from 'rxjs';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra';

const SyncButton: React.FC<{
    viewerA: PluginUIContext | null;
    viewerB: PluginUIContext | null;
    axisAlignmentMatrix: Mat4;
    activeViewer: 'A' | 'B';
}> = ({ viewerA, viewerB, axisAlignmentMatrix, activeViewer }) => {
    const { syncEnabled, setSyncEnabled } = useSync();
    const previousSourceCameraState = useRef<any>(null);

    useEffect(() => {
        // Determine source and target viewers/cameras based on activeViewer
        const sourceViewer = activeViewer === 'A' ? viewerA : viewerB;
        const targetViewer = activeViewer === 'A' ? viewerB : viewerA;
        // Prevent running sync logic if viewers are disposed or not ready
        if (
            !sourceViewer?.canvas3d?.camera ||
            !targetViewer?.canvas3d?.camera
        ) {
            console.log('Synchronization not enabled or viewers not initialized or viewers disposed.');
            previousSourceCameraState.current = null;
            return;
        }
        let subscription: Subscription | null = null;

        if (syncEnabled && sourceViewer?.canvas3d?.camera && targetViewer?.canvas3d?.camera) {
            console.log('Enabling synchronization between viewers');

            const sourceCamera = sourceViewer.canvas3d.camera;
            const targetCamera = targetViewer.canvas3d.camera;

            subscription = sourceCamera.stateChanged.subscribe(() => {
                const sourceCameraState = sourceCamera.getSnapshot();
                const targetCameraState = targetCamera.getSnapshot();
                if (previousSourceCameraState.current) {
                    const stateChange: Partial<typeof sourceCameraState> = {};

                    // Attempt to transform the camera state using the axis alignment matrix
                    // Transform position, target, and up vectors using the axis alignment matrix
                    const transformedPosition = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedPosition,
                        sourceCameraState.position,
                        axisAlignmentMatrix
                    );
                    const transformedTarget = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedTarget,
                        sourceCameraState.target,
                        axisAlignmentMatrix
                    );
                    const transformedUp = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedUp,
                        sourceCameraState.up,
                        axisAlignmentMatrix
                    );
                    // Calculate differences
                    if (previousSourceCameraState.current.position) {
                        const positionDiff = Vec3.create(
                            transformedPosition[0] - previousSourceCameraState.current.position[0],
                            transformedPosition[1] - previousSourceCameraState.current.position[1],
                            transformedPosition[2] - previousSourceCameraState.current.position[2]
                        );
                        stateChange.position = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.position, targetCameraState.position, positionDiff);
                    }
                    if (previousSourceCameraState.current.target) {
                        const targetDiff = Vec3.create(
                            transformedTarget[0] - previousSourceCameraState.current.target[0],
                            transformedTarget[1] - previousSourceCameraState.current.target[1],
                            transformedTarget[2] - previousSourceCameraState.current.target[2]
                        );
                        stateChange.target = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.target, targetCameraState.target, targetDiff);
                    }
                    if (previousSourceCameraState.current.up) {
                        const upDiff = Vec3.create(
                            transformedUp[0] - previousSourceCameraState.current.up[0],
                            transformedUp[1] - previousSourceCameraState.current.up[1],
                            transformedUp[2] - previousSourceCameraState.current.up[2]
                        );
                        stateChange.up = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.up, targetCameraState.up, upDiff);
                    }

                    // Explicitly compare known properties of the Snapshot type
                    if (sourceCameraState.position !== previousSourceCameraState.current.position) {
                        const positionDiff = Vec3.create(
                            sourceCameraState.position[0] - previousSourceCameraState.current.position[0],
                            sourceCameraState.position[1] - previousSourceCameraState.current.position[1],
                            sourceCameraState.position[2] - previousSourceCameraState.current.position[2]
                        );
                        stateChange.position = Vec3.create(0, 0, 0); // Initialize `position` as a Vec3
                        Vec3.add(stateChange.position, targetCameraState.position, positionDiff);
                    }
                    if (sourceCameraState.target && previousSourceCameraState.current.target) {
                        const targetDiff = Vec3.create(
                            sourceCameraState.target[0] - previousSourceCameraState.current.target[0],
                            sourceCameraState.target[1] - previousSourceCameraState.current.target[1],
                            sourceCameraState.target[2] - previousSourceCameraState.current.target[2]
                        );
                        stateChange.target = Vec3.create(0, 0, 0); // Initialize `target` as a Vec3
                        Vec3.add(stateChange.target, targetCameraState.target, targetDiff);
                    }
                    if (sourceCameraState.up && previousSourceCameraState.current.up) {
                        const upDiff = Vec3.create(
                            sourceCameraState.up[0] - previousSourceCameraState.current.up[0],
                            sourceCameraState.up[1] - previousSourceCameraState.current.up[1],
                            sourceCameraState.up[2] - previousSourceCameraState.current.up[2]
                        );
                        stateChange.up = Vec3.create(0, 0, 0); // Initialize `up` as a Vec3
                        Vec3.add(stateChange.up, targetCameraState.up, upDiff);
                    }

                    console.log('Differences in camera state:', stateChange);

                    // Apply change
                    if (Object.keys(stateChange).length > 0) {
                        targetCamera.setState({
                            ...targetCamera.state,
                            ...stateChange,
                        });
                    }
                }

                // Update the previous state
                previousSourceCameraState.current = sourceCameraState;
            });
        } else {
            console.log('Synchronization not enabled or viewers not initialized.');
            // Clear the previous camera state when sync is turned off
            previousSourceCameraState.current = null;
        }

        return () => {
            if (subscription) {
                console.log('Disabling synchronization between viewers');
                subscription.unsubscribe(); // Remove the event listener
            }
        };
    }, [syncEnabled, viewerA, viewerB, axisAlignmentMatrix, activeViewer]);

    // State to track the initial matrix of Viewer A's camera
    const [initialMatrixA, setInitialMatrixA] = useState<Mat4 | null>(null);
    //const [initialMatrixA, setInitialMatrixA] = useState<Mat4 | null>(null);

    const handleSyncToggle = () => {
        const newSyncState = !syncEnabled;
        setSyncEnabled(newSyncState);
        console.log('Toggling syncEnabled:', newSyncState); // Debugging log

        if (newSyncState) {
            // Store the initial state of Viewer A's camera when sync is activated
            const matrixA = viewerA?.canvas3d?.camera.view;
            if (matrixA) {
                setInitialMatrixA(Mat4.clone(matrixA));
            }
        } else {
            // Clear the stored state when sync is deactivated
            setInitialMatrixA(null);
        }
    };

    return (
        <button onClick={handleSyncToggle}>
            {syncEnabled ? 'Action to unsync' : 'Action to sync'}
        </button>
    );
};

export default SyncButton;