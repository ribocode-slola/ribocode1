import React, { useRef, useState, useEffect } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { useSync, SyncProvider } from './SyncContext';
import MolstarViewer from './MolstarViewer';
import { Subscription } from 'rxjs';
import './App.css';

const App: React.FC = () => {
    const [viewerA, setViewerA] = useState<PluginContext | null>(null);
    const [viewerB, setViewerB] = useState<PluginContext | null>(null);

    const SyncButton: React.FC = () => {
        const { syncEnabled, setSyncEnabled } = useSync();
        const previousCameraState = useRef<any>(null); // Store the previous camera state

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
                    const currentCameraState = cameraA.getSnapshot();
                    console.log('Camera A state changed:', currentCameraState);

                    //if (currentCameraState) {
                    //    console.log('Updating viewerB camera state:', currentCameraState);
                    //    cameraB.setState(currentCameraState); // Update viewerB's camera state
                    //}
                    if (previousCameraState.current) {
                        const differences: Partial<typeof currentCameraState> = {};
                        
                        // Explicitly compare known properties of the Snapshot type
                        if (currentCameraState.position !== previousCameraState.current.position) {
                            differences.position = currentCameraState.position;
                        }
                        if (currentCameraState.target !== previousCameraState.current.target) {
                            differences.target = currentCameraState.target;
                        }
                        if (currentCameraState.fov !== previousCameraState.current.zoom) {
                            differences.fov = currentCameraState.fov;
                        }
        
                        console.log('Differences in camera state:', differences);
        
                        // Apply only the differences to viewerB's camera
                        if (Object.keys(differences).length > 0) {
                            cameraB.setState({
                                ...cameraB.state,
                                ...differences,
                            });
                        }
                    }
        
                    // Update the previous state
                    previousCameraState.current = currentCameraState;
                });
            } else {
                console.log('Synchronization not enabled or viewers not initialized.');
            }

            return () => {
                if (subscription) {
                    console.log('Disabling synchronization between viewers');
                    subscription.unsubscribe(); // Remove the event listener
                }
            };
        }, [syncEnabled]);

        const handleSyncToggle = () => {
            setSyncEnabled(!syncEnabled);
        };

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
                        moleculeId="4UG0"
                        setViewer={setViewerA} // Pass the setter for viewerA
                    />
                    <MolstarViewer
                        moleculeId="6XU8"
                        setViewer={setViewerB} // Pass the setter for viewerB
                    />
                </div>
            </SyncProvider>
        </div>
    );
};

export default App;
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

