import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
//import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import './MolstarContainer.css';

interface MolstarViewerProps {
    moleculeId: string;
    setViewer: (viewer: any) => void; // Adjust type as needed
}

//const MolstarViewer: React.FC<MolstarViewerProps> = ({ moleculeId, isViewerA, setViewer, reportCameraState }) => {
const MolstarViewer: React.FC<MolstarViewerProps> = ({ moleculeId, setViewer }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rootRef = useRef<ReactDOM.Root | null>(null);
    const pluginRef = useRef<any>(null);

    useEffect(() => {
        const initializePlugin = async () => {
            if (pluginRef.current) {
                console.warn('Plugin is already initialized.');
                return; // Prevent multiple initializations
            }

            try {
                const container = containerRef.current;
                if (!container) {
                    console.error('Container is not available.');
                    return;
                }

                // Initialize the Mol* plugin
                const plugin = await createPluginUI({
                    target: container,
                    render: (component, container) => {
                        if (!rootRef.current) {
                            rootRef.current = ReactDOM.createRoot(container);
                        }
                        rootRef.current.render(component);
                    },
                });

                pluginRef.current = plugin; // Store the plugin instance in the ref

                // Set the plugin instance in the parent component
                setViewer(plugin);

                // Handle WebGL context loss
                const gl = plugin.canvas3d?.webgl?.gl;
                if (gl) {
                    gl.canvas.addEventListener('webglcontextlost', (event) => {
                        event.preventDefault();
                        console.error('WebGL context lost.');
                    });

                    gl.canvas.addEventListener('webglcontextrestored', () => {
                        console.log('WebGL context restored. Cleaning up and reinitializing plugin...');
                        (async () => {
                            if (pluginRef.current) {
                                pluginRef.current.dispose();
                                pluginRef.current = null;
                            }
                            await initializePlugin(); // Reinitialize the plugin on context restore
                        })();
                    });
                }

                // Load and visualize the molecule
                const data = await plugin.builders.data.download(
                    { url: `https://files.rcsb.org/download/${moleculeId}.cif` },
                    { state: { isGhost: true } }
                );
                if (!data) {
                    console.error('Failed to load data for molecule:', moleculeId);
                    return;
                }
                const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
                await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');

                // Access the camera manager
                const camera = pluginRef.current.canvas3d?.camera;

                if (camera) {
                    // Function to log camera position
                    const reportCameraPosition = () => {
                        const { position, target, up, fov } = camera.state;
                        console.log('Camera Position:', position);
                        console.log('Camera Target:', target);
                        console.log('Camera Orientation (Up Vector):', up);
                        console.log('Camera Field Of View:', fov);
                    };

                    // Listen for camera state changes
                    const unsubscribe = camera.stateChanged.subscribe(() => {
                        reportCameraPosition();
                    });

                    // Report initial camera position
                    reportCameraPosition();

                    // Cleanup on unmount
                    return () => {
                        unsubscribe(); // Remove the event listener
                        if (pluginRef.current) {
                            pluginRef.current.dispose();
                            pluginRef.current = null;
                        }
                    };
                }

            } catch (error) {
                console.error('An error occurred while initializing the plugin:', error);
            }
        };

        initializePlugin();

        return () => {
            // Cleanup resources on unmount
            if (pluginRef.current) {
                console.log('Disposing plugin...');
                try {
                    // Ensure proper cleanup
                    pluginRef.current.dispose();
                } catch (error) {
                    console.error('Error during plugin disposal:', error);
                }
                pluginRef.current = null;
            }
            if (rootRef.current) {
                console.log('Unmounting React root...');
                setTimeout(() => {
                    rootRef.current?.unmount();
                    rootRef.current = null;
                }, 0);
            }
        };
    }, [moleculeId, setViewer]); // Re-run only if `moleculeId` changes

    return <div ref={containerRef} className="molstar-container" />;
};

export default MolstarViewer;