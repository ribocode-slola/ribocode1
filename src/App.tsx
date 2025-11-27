import React, { useMemo, useRef, useState, useEffect } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { useSync, SyncProvider } from './SyncContext';
import MolstarViewer from './MolstarViewer';
import { Subscription } from 'rxjs';
import './App.css';
//import * as Vec3Module from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
//const Vec3 = Vec3Module.Vec3;
//import type { Vec3 as Vec3Type } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3';
//import * as Mat4Module from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
//const Mat4 = Mat4Module.Mat4;
//import type { Mat4 as Mat4Type } from 'molstar/lib/mol-math/linear-algebra/3d/mat4';
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra';
//import { mat4, quat, vec3, ReadonlyVec3 } from 'gl-matrix';

const App: React.FC = () => {
    console.log('App rendered');
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);

    // Memoize axis alignment matrix
    const axisAlignmentMatrix = useMemo(() => {
        const m = Mat4.identity();
        Mat4.setValue(m, 0, 0, 1);
        Mat4.setValue(m, 0, 1, 0);
        Mat4.setValue(m, 0, 2, 0);
        Mat4.setValue(m, 0, 3, 0);
        Mat4.setValue(m, 1, 0, 0);
        Mat4.setValue(m, 1, 1, 0);
        Mat4.setValue(m, 1, 2, -1);
        Mat4.setValue(m, 1, 3, 0);
        Mat4.setValue(m, 2, 0, 0);
        Mat4.setValue(m, 2, 1, 1);
        Mat4.setValue(m, 2, 2, 0);
        Mat4.setValue(m, 2, 3, 0);
        Mat4.setValue(m, 3, 0, 0);
        Mat4.setValue(m, 3, 1, 0);
        Mat4.setValue(m, 3, 2, 0);
        Mat4.setValue(m, 3, 3, 1);
        return m;
    }, []);

    const [selection, setSelection] = useState(null);

    // Stable keys
    const viewerKeyA = 'A';
    const viewerKeyB = 'B';

    return (
        <SyncProvider>
            <div className="App">
                <h1>RiboCode Mol* Viewer</h1>
                <SyncButton
                    viewerA={viewerA}
                    viewerB={viewerB}
                    axisAlignmentMatrix={axisAlignmentMatrix}
                />
                <div className="grid-container">
                    <MolstarViewer
                        moleculeId="6XU8"
                        setViewer={setViewerA}
                        viewerKey={viewerKeyA}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                    />
                    <MolstarViewer
                        moleculeId="4UG0"
                        setViewer={setViewerB}
                        viewerKey={viewerKeyB}
                        onSelectionChange={setSelection}
                        externalSelection={selection}
                    />
                </div>
            </div>
        </SyncProvider>
    );
};

const SyncButton: React.FC<{
    viewerA: PluginContext | null;
    viewerB: PluginContext | null;
    axisAlignmentMatrix: Mat4;
}> = ({ viewerA, viewerB, axisAlignmentMatrix }) => {
    const { syncEnabled, setSyncEnabled } = useSync();
    const previousCameraAState = useRef<any>(null);

    useEffect(() => {
        // Prevent running sync logic if viewers are disposed or not ready
        if (
            !viewerA?.canvas3d?.camera ||
            !viewerB?.canvas3d?.camera
        ) {
            console.log('Synchronization not enabled or viewers not initialized or viewers disposed.');
            previousCameraAState.current = null;
            return;
        }
        let subscription: Subscription | null = null;

        console.log('syncEnabled:', syncEnabled);
        console.log('viewerA:', viewerA);
        console.log('viewerB:', viewerB);

        if (syncEnabled && viewerA?.canvas3d?.camera && viewerB?.canvas3d?.camera) {
            console.log('Enabling synchronization between viewers');

            const cameraA = viewerA.canvas3d.camera;
            const cameraB = viewerB.canvas3d.camera;

            subscription = cameraA.stateChanged.subscribe(() => {
                const cameraAState = cameraA.getSnapshot();
                const cameraBState = cameraB.getSnapshot();
                if (previousCameraAState.current) {
                    const stateChange: Partial<typeof cameraAState> = {};

                    // Attempt to transform the camera state using the axis alignment matrix
                    // Transform position, target, and up vectors using the axis alignment matrix
                    const transformedPosition = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedPosition,
                        cameraAState.position,
                        axisAlignmentMatrix
                    );
                    const transformedTarget = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedTarget,
                        cameraAState.target,
                        axisAlignmentMatrix
                    );
                    const transformedUp = Vec3.create(0, 0, 0);
                    Vec3.transformMat4(
                        transformedUp,
                        cameraAState.up,
                        axisAlignmentMatrix
                    );
                    // Calculate differences
                    if (previousCameraAState.current.position) {
                        const positionDiff = Vec3.create(
                            transformedPosition[0] - previousCameraAState.current.position[0],
                            transformedPosition[1] - previousCameraAState.current.position[1],
                            transformedPosition[2] - previousCameraAState.current.position[2]
                        );
                        stateChange.position = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.position, cameraBState.position, positionDiff);
                    }
                    if (previousCameraAState.current.target) {
                        const targetDiff = Vec3.create(
                            transformedTarget[0] - previousCameraAState.current.target[0],
                            transformedTarget[1] - previousCameraAState.current.target[1],
                            transformedTarget[2] - previousCameraAState.current.target[2]
                        );
                        stateChange.target = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.target, cameraBState.target, targetDiff);
                    }
                    if (previousCameraAState.current.up) {
                        const upDiff = Vec3.create(
                            transformedUp[0] - previousCameraAState.current.up[0],
                            transformedUp[1] - previousCameraAState.current.up[1],
                            transformedUp[2] - previousCameraAState.current.up[2]
                        );
                        stateChange.up = Vec3.create(0, 0, 0);
                        Vec3.add(stateChange.up, cameraBState.up, upDiff);
                    }

                    // Explicitly compare known properties of the Snapshot type
                    if (cameraAState.position !== previousCameraAState.current.position) {
                        const positionDiff = Vec3.create(
                            cameraAState.position[0] - previousCameraAState.current.position[0],
                            cameraAState.position[1] - previousCameraAState.current.position[1],
                            cameraAState.position[2] - previousCameraAState.current.position[2]
                        );
                        stateChange.position = Vec3.create(0, 0, 0); // Initialize `position` as a Vec3
                        Vec3.add(stateChange.position, cameraBState.position, positionDiff);
                    }
                    if (cameraAState.target && previousCameraAState.current.target) {
                        const targetDiff = Vec3.create(
                            cameraAState.target[0] - previousCameraAState.current.target[0],
                            cameraAState.target[1] - previousCameraAState.current.target[1],
                            cameraAState.target[2] - previousCameraAState.current.target[2]
                        );
                        stateChange.target = Vec3.create(0, 0, 0); // Initialize `target` as a Vec3
                        Vec3.add(stateChange.target, cameraBState.target, targetDiff);
                    }
                    if (cameraAState.up && previousCameraAState.current.up) {
                        const upDiff = Vec3.create(
                            cameraAState.up[0] - previousCameraAState.current.up[0],
                            cameraAState.up[1] - previousCameraAState.current.up[1],
                            cameraAState.up[2] - previousCameraAState.current.up[2]
                        );
                        stateChange.up = Vec3.create(0, 0, 0); // Initialize `up` as a Vec3
                        Vec3.add(stateChange.up, cameraBState.up, upDiff);
                    }

                    console.log('Differences in camera state:', stateChange);

                    // Apply change
                    if (Object.keys(stateChange).length > 0) {
                        cameraB.setState({
                            ...cameraB.state,
                            ...stateChange,
                        });
                    }
                }

                // Update the previous state
                previousCameraAState.current = cameraAState;
            });
        } else {
            console.log('Synchronization not enabled or viewers not initialized.');
            // Clear the previous camera state when sync is turned off
            previousCameraAState.current = null;
        }

        return () => {
            if (subscription) {
                console.log('Disabling synchronization between viewers');
                subscription.unsubscribe(); // Remove the event listener
            }
        };
    }, [syncEnabled, viewerA, viewerB, axisAlignmentMatrix]);

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

export default App;