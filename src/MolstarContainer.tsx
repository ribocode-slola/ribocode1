import React, { memo, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
//import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
//import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
//import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import './MolstarContainer.css'; // Import the CSS file
import { useSync } from './SyncContext';
//import { CustomPropertyDescriptor } from 'molstar/lib/mol-model/custom-property';
//import { CifCategory } from 'molstar/lib/mol-io/reader/cif';
//import { CifWriter } from 'molstar/lib/mol-io/writer/cif';
import { throttle } from 'lodash';

type MolstarContainerProps = {
    moleculeId: string;
};

const MolstarContainer = memo(
     ({ moleculeId }: MolstarContainerProps) => {
         // A React component MolstarContainer that integrates the Mol* library for molecular visualization.
         // Wraps the Mol* plugin in a React component for easy integration using memo.
         // viewerRef: A reference to the <div> element where the Mol* plugin will render the visualization.
         const viewerRef = useRef<HTMLDivElement | null>(null); // Unique ref for each container
         // pluginRef: A reference to the Mol* plugin instance.
         const pluginRef = useRef<any>(null);
         // rootRef: A reference to the ReactDOM root instance for rendering React components inside the Mol* plugin.
         const rootRef = useRef<ReactDOM.Root | null>(null); // Store the ReactDOM root instance

//         // Destructure other values from useSync, excluding syncData
//         //const { onCameraChange, applyCameraState, updateSyncState, syncData } = useSync();
//         const { cameraState, syncEnabled, onCameraChange } = useSync();

//         // State variables to track initialization.
//         const [isPluginInitialized, setIsPluginInitialized] = useState(false);

//         // Initialize the Mol* plugin and load the molecule
//         useEffect(() => {
//             console.log('Initializing Mol* plugin useEffect triggered.');
//             try {
//                 let isCancelled = false;
//                 const initializePlugin = async () => {
//                     console.log('pluginRef.current before initialization:', pluginRef.current);
//                     if (pluginRef.current) {
//                         console.log(`Mol* plugin already initialized for '${moleculeId}'`);
//                         return;
//                     }

//                     if (!viewerRef.current) {
//                         console.error('Viewer container is not available.');
//                         return;
//                     }

//                     console.log(`Initializing Mol* plugin for '${moleculeId}'...`);
//                     try {
//                         console.log('Calling createPluginUI...');
//                         const plugin = await createPluginUI({
//                             target: viewerRef.current,
//                             render: (component, container) => {
//                                 if (!rootRef.current) {
//                                     rootRef.current = ReactDOM.createRoot(container);
//                                 }
//                                 rootRef.current.render(component);
//                             },
//                         });
//                         console.log('createPluginUI completed:', plugin);

//                         if (isCancelled) {
//                             console.log('Initialization cancelled.');
//                             //plugin.dispose();
//                             return;
//                         }

//                         // Update pluginRef.current
//                         pluginRef.current = plugin;
//                         console.log('pluginRef.current updated:', pluginRef.current);
//                     } catch (error) {
//                         console.error(`Error initializing Mol* plugin for '${moleculeId}'...`, error);
//                     } finally {
//                         if (isCancelled && pluginRef.current) {
//                             console.log(`Disposing of Mol* plugin for '${moleculeId}'...`);
//                             pluginRef.current.dispose();
//                             console.log('Mol* plugin disposed. Setting pluginRef.current to null.');
//                             pluginRef.current = null;
//                         }
//                     }
//                     // Check if canvas3d is available
//                     if (pluginRef.current.canvas3d) {
//                         console.log('Canvas3D initialized:', pluginRef.current.canvas3d);
//                         console.log('Camera:', pluginRef.current.canvas3d.camera);
//                     } else {
//                         console.warn('Canvas3D is not available. Listening for updates...');
//                         pluginRef.current.events.canvas3d.settingsUpdated.subscribe(() => {
//                             if (pluginRef.current.canvas3d) {
//                                 console.log('Canvas3D initialized via event:', pluginRef.current.canvas3d);
//                                 console.log('Camera:', pluginRef.current.canvas3d.camera);
//                             }
//                         });
//                     }

//                     // Load and visualize the molecule
//                     await pluginRef.current.dataTransaction(async () => {
//                         // Load the molecule data from the URL
//                         let moleculeUrl = `https://files.rcsb.org/download/${moleculeId}.cif`;
//                         console.log('Downloading molecule data from:', moleculeUrl);
//                         const data = await pluginRef.current.builders.data.download(
//                             { url: moleculeUrl },
//                             { state: { isGhost: true } }
//                         );
//                         console.log('Molecule data downloaded:', data);

//                         if (isCancelled) return;
//                         // Visualize the molecule
//                         try {
//                             const format = moleculeUrl.endsWith('.cif') ? 'mmcif' : 'pdb';
//                             // Parse the trajectory and apply the default preset
//                             const trajectory = await pluginRef.current.builders.structure.parseTrajectory(data, format);
//                             console.log('Trajectory parsed.');

//                             // Apply the default visualization preset
//                             await pluginRef.current.builders.structure.hierarchy.applyPreset(trajectory, 'default');
//                             console.log('Visualization preset applied.');
//                         } catch (error) {
//                             console.error(`Error visualizing molecule for '${moleculeId}':`, error);
//                         }
//                     });
//                 };

//                 initializePlugin();

//                 return () => {
//                     console.log('Cleaning up Mol* plugin...');
//                     isCancelled = true;
//                     if (pluginRef.current) {
//                         console.log(`Disposing of Mol* plugin for '${moleculeId}'...`);
//                         pluginRef.current.dispose();
//                         console.log('Mol* plugin disposed. Setting pluginRef.current to null.');
//                         pluginRef.current = null;
//                     }
//                 };
//             } catch (error) {
//                 console.error('Error in useEffect:', error);
//             }
//         }, [moleculeId]);

//         useEffect(() => {
//             console.log('Checking plugin initialization useEffect triggered.');
//             if (pluginRef.current && pluginRef.current._isInitialized) {
//                 console.log('Mol* plugin initialized:', pluginRef.current);
//                 setIsPluginInitialized(true);
//             }
//         }, [pluginRef]);

//         useEffect(() => {
//             console.log('Sync-enabled useEffect triggered.');
//             try {
//                 if (!isPluginInitialized) {
//                     console.log('Waiting for plugin initialization...');
//                     return;
//                 }
//                 if (!pluginRef.current) {
//                     console.log('Plugin is not initialized yet.');
//                     return;
//                 }
//                 if (!syncEnabled) {
//                     console.log('Synchronization is disabled.');
//                     return;
//                 }
//                 const canvas3d = pluginRef.current.canvas3d;
//                 if (!canvas3d) {
//                     console.log('Canvas3D is not available yet.');
//                     return;
//                 }
//                 const camera = pluginRef.current.canvas3d.camera;
//                 if (!camera) {
//                     console.log('Camera is not available.');
//                     return;
//                 } else {
//                     console.log('Camera is available:', camera);
//                 }
//                 const controls = pluginRef.current.canvas3d?.controls;
//                 if (!controls) {
//                     console.log('Controls are not available.');
//                     return;
//                 } else {
//                     console.log('Controls are available:', controls);
//                 }
//                 console.log('Enabling synchronization for camera state changes...');
//                 // Throttled function for camera state changes
//                 const throttledOnCameraChange = throttle((cameraState) => {
//                     console.log('Throttled camera state change:', cameraState);
//                     onCameraChange?.(cameraState);
//                 }, 100);
//                 // Subscription for camera state changes
//                 console.log('Subscribing to camera state changes...');
//                 const subscription = camera.stateChanged.subscribe(() => {
//                     console.log('Camera state changed!');
//                     const cameraState = camera.getSnapshot();
//                     console.log('Camera snapshot:', cameraState);
//                     throttledOnCameraChange(cameraState);
//                 });
//                 // Event listener for control changes
//                 const handleCameraChange = () => {
//                     console.log('Camera controls changed!');
//                     const cameraState = {
//                         position: {
//                             x: camera.position.x,
//                             y: camera.position.y,
//                             z: camera.position.z,
//                         },
//                         target: {
//                             x: controls.target.x,
//                             y: controls.target.y,
//                             z: controls.target.z,
//                         },
//                         up: {
//                             x: camera.up.x,
//                             y: camera.up.y,
//                             z: camera.up.z,
//                         },
//                         fov: camera.fov,
//                     };
//                     console.log('New camera state:', cameraState);
//                     onCameraChange?.(cameraState);
//                 };
//                 if (controls) {
//                     console.log('Adding event listener for camera controls...');
//                     controls.addEventListener('change', handleCameraChange);
//                 } else {
//                     console.warn('Controls are not available.');
//                 }
//                 return () => {
//                     console.log('Disabling synchronization for camera state changes...');
//                     subscription.unsubscribe();
//                     if (controls) {
//                         controls.removeEventListener('change', handleCameraChange);
//                     }
//                 };
//             } catch (error) {
//                 console.error('Error in useEffect:', error);
//             }
//         }, [syncEnabled, isPluginInitialized, onCameraChange]);

//         // React to cameraState changes
//         useEffect(() => {
//             console.log('Reacting to cameraState changes useEffect triggered.');
//             try {
//                 console.log('pluginRef.current:', pluginRef.current);
//                 console.log('pluginRef.current.canvas3d:', pluginRef.current?.canvas3d);
//                 console.log('pluginRef.current.canvas3d.camera:', pluginRef.current?.canvas3d?.camera);
//                 console.log('pluginRef.current.canvas3d.controls:', pluginRef.current?.canvas3d?.controls);
//                 if (cameraState && pluginRef.current?.canvas3d?.camera) {
//                     try {
//                         console.log('Applying cameraState:', cameraState);
//                         pluginRef.current.canvas3d.camera.setState(cameraState);
//                     } catch (error) {
//                         console.error('Error applying external syncData:', error);
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error in useEffect:', error);
//             }
//         }, [cameraState]);

        return (
            <div ref={viewerRef} className="msp-container">
                {/* Mol* plugin renders here */}
            </div>
        );
    },
    // Add conditions to prevent re-rendering
    (prevProps, nextProps) => {
        return prevProps.moleculeId === nextProps.moleculeId;
    }
);

export default MolstarContainer;