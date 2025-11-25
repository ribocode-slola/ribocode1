import React, { useRef, useState, useEffect } from 'react';
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
import { StructureElement } from 'molstar/lib/mol-model/structure';
//import * as OrderedSetModule from 'molstar/lib/mol-data/int/ordered-set';
//const OrderedSet = OrderedSetModule.OrderedSet; // Use this instead of 'mol-data/int'
import { OrderedSet } from 'molstar/lib/mol-data/int';

//import { mat4, quat, vec3, ReadonlyVec3 } from 'gl-matrix';

const App: React.FC = () => {
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);

    // Define the axis alignment transformation matrix
    //const axisAlignmentMatrix = mat4.create(); // Create an identity matrix
    const axisAlignmentMatrix = Mat4.identity(); // Create an identity matrix
    // Set the values for the axis alignment matrix
    Mat4.setValue(axisAlignmentMatrix, 0, 0, 1);
    Mat4.setValue(axisAlignmentMatrix, 0, 1, 0);
    Mat4.setValue(axisAlignmentMatrix, 0, 2, 0);
    Mat4.setValue(axisAlignmentMatrix, 0, 3, 0);
    Mat4.setValue(axisAlignmentMatrix, 1, 0, 0);
    Mat4.setValue(axisAlignmentMatrix, 1, 1, 0);
    Mat4.setValue(axisAlignmentMatrix, 1, 2, -1);
    Mat4.setValue(axisAlignmentMatrix, 1, 3, 0);
    Mat4.setValue(axisAlignmentMatrix, 2, 0, 0);
    Mat4.setValue(axisAlignmentMatrix, 2, 1, 1);
    Mat4.setValue(axisAlignmentMatrix, 2, 2, 0);
    Mat4.setValue(axisAlignmentMatrix, 2, 3, 0);
    Mat4.setValue(axisAlignmentMatrix, 3, 0, 0);
    Mat4.setValue(axisAlignmentMatrix, 3, 1, 0);
    Mat4.setValue(axisAlignmentMatrix, 3, 2, 0);
    Mat4.setValue(axisAlignmentMatrix, 3, 3, 1);

    const SyncButton: React.FC = () => {
        const { syncEnabled, setSyncEnabled } = useSync();
        const previousCameraAState = useRef<any>(null); // Store the previous camera state

        useEffect(() => {
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

                        // // Compute the axis alignment matrix between cameraA and cameraB
                        // const axisAlignmentMatrix = mat4.create();
                        // mat4.fromRotationTranslation(
                        //     axisAlignmentMatrix,
                        //     quat.rotationTo(
                        //         quat.create(),
                        //         vec3.sub(vec3.create(), cameraBState.target, cameraBState.position) as ReadonlyVec3,
                        //         vec3.sub(vec3.create(), cameraAState.target, cameraAState.position) as ReadonlyVec3
                        //     ),
                        //     vec3.create()
                        // );

                        // // Transform position, target, and up vectors using the axis alignment matrix
                        // const transformedPosition = vec3.create(); // Use vec3.create() instead of Vec3.create()
                        // vec3.transformMat4(
                        //     transformedPosition,
                        //     cameraAState.position as ReadonlyVec3, // Cast to ReadonlyVec3 if necessary
                        //     axisAlignmentMatrix
                        // );

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
        }, [syncEnabled]);

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

        // const handleViewerARotation = () => {
        //     if (!syncEnabled || !initialMatrixA) return;

        //     const matrixA = viewerA?.canvas3d?.camera.view;
        //     const matrixB = viewerB?.canvas3d?.camera.view;

        //     if (matrixA && matrixB) {
        //         // Check if perspectives are already aligned
        //         const isAligned = Mat4.areEqual(matrixA, matrixB, 1e-6);
        //         if (isAligned) {
        //             console.log('Viewer A and Viewer B are aligned.');
        //             viewerB?.canvas3d?.camera.setState({
        //                 position: viewerA?.canvas3d?.camera.state.position,
        //                 target: viewerA?.canvas3d?.camera.state.target,
        //                 up: viewerA?.canvas3d?.camera.state.up,
        //             });
        //         } else {
        //             if (!Mat4.areEqual(matrixA, initialMatrixA, 1e-6)) {
        //                 // Extract Viewer A's position, target, and up vector
        //                 const positionA = Vec3.zero();
        //                 Mat4.getTranslation(positionA, matrixA);
                    
        //                 const forwardA = Vec3.create(matrixA[8], matrixA[9], matrixA[10]);
        //                 Vec3.normalize(forwardA, forwardA);
                    
        //                 const targetA = Vec3.add(Vec3.zero(), positionA, forwardA);
                    
        //                 // Extract Viewer A's up vector (camera orientation)
        //                 const upA = Vec3.create(matrixA[4], matrixA[5], matrixA[6]);
                    
        //                 // Compute Viewer B's position relative to Viewer A
        //                 const positionB = Vec3.zero();
        //                 Mat4.getTranslation(positionB, matrixB);
                    
        //                 const offset = Vec3.sub(Vec3.zero(), positionB, positionA); // Compute offset between Viewer A and Viewer B
                    
        //                 const newPositionB = Vec3.add(Vec3.zero(), positionA, offset); // Adjust Viewer B's position relative to Viewer A
                    
        //                 // Apply Viewer A's target and up vector to Viewer B
        //                 viewerB?.canvas3d?.camera.setState({
        //                     position: newPositionB,
        //                     target: targetA, // Synchronize target with Viewer A
        //                     up: upA,         // Synchronize up vector with Viewer A
        //                 });
        //             }
        //         }
            
        //         // Field of view synchronization (if supported by your library)
        //         const fovA = viewerA?.canvas3d?.camera.state.fov;
        //         if (fovA !== undefined) {
        //             viewerB?.canvas3d?.camera.setState({
        //                 ...viewerB?.canvas3d?.camera.state,
        //                 fov: fovA, // Update field of view if it's part of the camera state
        //             });
        //         }

        //         // Update the stored initial matrix to the current state
        //         setInitialMatrixA(Mat4.clone(matrixA));
        //     }
        //};

        // // Attach the rotation handler to Viewer A's camera events
        // useEffect(() => {
        //     let subscription: any; // Track the subscription

        //     if (viewerA?.canvas3d) {
        //         // Subscribe to Viewer A's camera state changes
        //         subscription = viewerA.canvas3d.camera.stateChanged.subscribe(handleViewerARotation);
        //     }

        //     return () => {
        //         // Unsubscribe safely
        //         if (subscription) {
        //             subscription.unsubscribe();
        //         }
        //     };
        // }, [viewerA, syncEnabled, initialMatrixA]);

        return (
            <button onClick={handleSyncToggle}>
                {syncEnabled ? 'Action to unsync' : 'Action to sync'}
            </button>
        );
    };

    return (
        <div className="App">
            <h1>RiboCode Mol* Viewer</h1>
            <SyncProvider>
                <SyncButton />
                <div className="grid-container">
                    <MolstarViewer
                        //moleculeId="4UG0"
                        moleculeId="6XU8"
                        setViewer={setViewerA} // Pass the setter for viewerA
                    />
                    <MolstarViewer
                        //moleculeId="6XU8"
                        //moleculeId="6XU82"
                        moleculeId="4UG0"
                        //moleculeId="4UG02"
                        //moleculeId="4V6X"
                        //moleculeId="6QZP"
                        //moleculeId="8B2L"
                        setViewer={setViewerB} // Pass the setter for viewerB
                    />
                </div>
            </SyncProvider>
        </div>
    );
};

export default App;

const alignMolecules = async (plugin: PluginContext, structureA: StructureElement.Loci, structureB: StructureElement.Loci) => {
    // Extract atomic positions from the structures
    const positionsA: Vec3[] = [];
    const positionsB: Vec3[] = [];

    // Iterate over elements in structureA
    for (const elementA of structureA.elements) {
        const unitA = elementA.unit;
        OrderedSet.forEach(elementA.indices, (unitIndex) => {
            const elementIndex = unitA.elements[unitIndex]; // Convert UnitIndex to ElementIndex
            const positionA = Vec3.zero(); // Create an output vector
            unitA.conformation.position(elementIndex, positionA); // Pass the ElementIndex and output vector
            positionsA.push(positionA);
        });
    }

    // Iterate over elements in structureB
    for (const elementB of structureB.elements) {
        const unitB = elementB.unit;
        OrderedSet.forEach(elementB.indices, (unitIndex) => {
            const elementIndex = unitB.elements[unitIndex]; // Convert UnitIndex to ElementIndex
            const positionB = Vec3.zero(); // Create an output vector
            unitB.conformation.position(elementIndex, positionB); // Pass the ElementIndex and output vector
            positionsB.push(positionB);
        });
    }

    if (positionsA.length !== positionsB.length) {
        console.error('Structures must have the same number of atoms for alignment.');
        return;
    }

    // Compute the alignment matrix using Kabsch algorithm
    const alignmentMatrix = computeKabschMatrix(positionsA, positionsB);

    // Apply the transformation to structureB
    const transformedPositionsB = positionsB.map(pos => Vec3.transformMat4(Vec3.zero(), pos, alignmentMatrix));

    // Update viewerB
    console.log(plugin.managers.structure.hierarchy);

    
    console.log('Molecules aligned successfully.');
};

/**
import React from 'react';
import { SyncProvider, useSync } from './SyncContext'; // Assuming you have a SyncContext file

const SyncToggleButton: React.FC = () => {
    const { syncEnabled, setSyncEnabled } = useSync();

    const handleSyncToggle = () => {
        console.log('Toggling syncEnabled:', !syncEnabled); // Debugging log
        if (syncEnabled !== undefined) {
            setSyncEnabled(!syncEnabled);
        }
    };

    return (
        <button onClick={handleSyncToggle}>
            {syncEnabled ? 'Disable Synchronization' : 'Enable Synchronization'}
        </button>
    );
};

const ChildComponentA: React.FC = () => {
    const { a, setA, b, setB, syncEnabled } = useSync();

    const handleChange = () => {
        setA(a + 1);
        if (syncEnabled) {
            setB(b + 1);
        }
    };

    return (
        <div>
            <h3>Child A</h3>
            <p>{a}</p>
            <button onClick={handleChange}>Update</button>
        </div>
    );
};

const ChildComponentB: React.FC = () => {
    const { b, setB, a, setA, syncEnabled } = useSync();

    const handleChange = () => {
        setB(b + 1);
        if (syncEnabled) {
            setA(a + 1);
        }
    };

    return (
        <div>
            <h3>Child B</h3>
            <p>{b}</p>
            <button onClick={handleChange}>Update</button>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <SyncProvider>
            <div className="App">
                <SyncToggleButton />
                <header>
                    <h1>RiboCode Tool leveraging Mol*</h1>
                </header>
                <main className="grid-container">
                    <ChildComponentA />
                    <ChildComponentB />
                </main>
            </div>
        </SyncProvider>
    );
};
*/

/**
import React, { useState, useRef } from 'react';
import React from 'react';
import MolstarContainer from './MolstarContainer';
import './App.css';
import { SyncProvider, useSync } from './SyncContext';

const SyncToggleButton = () => {
    const { syncEnabled, setSyncEnabled } = useSync();

    const handleSyncToggle = () => {
        console.log('Toggling syncEnabled:', !syncEnabled); // Debugging log
        if (syncEnabled !== undefined) {
            setSyncEnabled(!syncEnabled);
        }
    };

    return (
        <button onClick={handleSyncToggle}>
            {syncEnabled ? 'Disable Synchronization' : 'Enable Synchronization'}
        </button>
    );
};

const App: React.FC = () => {
    return (
        <SyncProvider>
            <div className="App">
                <SyncToggleButton />
                <header>
                    <h1>RiboCode Tool leveraging Mol*</h1>
                </header>
                <main className="grid-container">
                    <MolstarContainer
                        moleculeId='4UG0'
                    />
                    <MolstarContainer
                        moleculeId='6XU8'
                    />
                </main>
            </div>
        </SyncProvider>
    );
};

/*
const styles = {
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Two columns
        //gridTemplateRows: '1fr 1fr', // Two rows
        gap: '10px', // Space between containers
        width: '100vw',
        height: '100vh',
    },
};
*/

function computeKabschMatrix(positionsA: Vec3[], positionsB: Vec3[]): Mat4 {
    const n = positionsA.length;

    // Step 1: Compute centroids
    const centroidA = Vec3.zero();
    const centroidB = Vec3.zero();
    for (let i = 0; i < n; i++) {
        Vec3.add(centroidA, centroidA, positionsA[i]);
        Vec3.add(centroidB, centroidB, positionsB[i]);
    }
    Vec3.scale(centroidA, centroidA, 1 / n);
    Vec3.scale(centroidB, centroidB, 1 / n);

    // Step 2: Center the points
    const centeredA = positionsA.map(pos => Vec3.sub(Vec3.zero(), pos, centroidA));
    const centeredB = positionsB.map(pos => Vec3.sub(Vec3.zero(), pos, centroidB));

    // Step 3: Compute covariance matrix
    const covariance = Mat4.zero();
    for (let i = 0; i < n; i++) {
        const a = centeredA[i];
        const b = centeredB[i];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                covariance[row * 4 + col] += a[row] * b[col];
            }
        }
    }

    // Step 4: Perform SVD (use an external library or implement manually)
    const { U, S, V } = performSVD(covariance); // Replace with actual SVD implementation

    // Step 5: Compute rotation matrix
    const rotation = Mat4.zero();
    Mat4.mul(rotation, V, Mat4.transpose(Mat4.zero(), U));

    // Ensure positive determinant
    if (Mat4.determinant(rotation) < 0) {
        for (let i = 0; i < 3; i++) {
            V[i * 4 + 2] *= -1;
        }
        Mat4.mul(rotation, V, Mat4.transpose(Mat4.zero(), U));
    }

    // Step 6: Construct transformation matrix
    const transformation = Mat4.identity();
    Mat4.setTranslation(transformation, Vec3.sub(Vec3.zero(), centroidB, Vec3.transformMat4(Vec3.zero(), centroidA, rotation)));
    Mat4.mul(transformation, transformation, rotation);

    return transformation;
}

// Placeholder for SVD function
function performSVD(matrix: Mat4): { U: Mat4; S: number[]; V: Mat4 } {
    // Implement or use an external library for SVD
    throw new Error('SVD implementation required');
}

