import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import './MolstarContainer.css'; // Import the CSS file

// Defines a React component MolstarContainer that integrates the Mol* library for molecular visualization.
const MolstarContainer = ({ moleculeUrl }: { moleculeUrl: string }) => {
    // viewerRef: A reference to the <div> element where the Mol* plugin will render the visualization.
    const viewerRef = useRef<HTMLDivElement | null>(null); // Unique ref for each container
    // pluginRef: A reference to the Mol* plugin instance.
    const pluginRef = useRef<any>(null);
    // rootRef: A reference to the ReactDOM root instance for rendering React components inside the Mol* plugin.
    const rootRef = useRef<ReactDOM.Root | null>(null); // Store the ReactDOM root instance

    useEffect(() => {
        const initializePlugin = async () => {
            if (!viewerRef.current) {
                console.error('viewerRef is not attached to a DOM element!');
                return;
            }
            // Prevent duplicate initialization
            if (pluginRef.current) {
                console.warn('Plugin already initialized for this container:', viewerRef.current);
                return;
            }
            console.log('Initializing plugin for container:', viewerRef.current); // Debug log
            let plugin: PluginUIContext | undefined;
            // Check if the plugin is already initialized
            try {
                // Dispose of any existing plugin instance
                if (pluginRef.current) {
                    console.log('Disposing existing plugin instance:', pluginRef.current); // Debug log
                    pluginRef.current.dispose();
                }

                // Create a new Mol* plugin instance for this container
                plugin = await createPluginUI({
                    target: viewerRef.current, // Attach to this container's unique DOM element
                    render: (component, container) => {
                        console.log('Rendering React component into container:', container); // Debug log
                        if (!rootRef.current) {
                            rootRef.current = ReactDOM.createRoot(container); // Initialize React root
                        }
                        rootRef.current.render(component); // Render the component
                        console.log('Initializing plugin for viewerRef:', viewerRef.current); // Debug log
                    },
                });
                console.log('WebGL context for plugin:', plugin.canvas3d?.webgl?.gl); // Debug log
                pluginRef.current = plugin;
            } catch (error) {
                console.error('Error initializing plugin:', error);
            }
            try {
                // Ensure plugin is initialized before using it
                if (!plugin) {
                    throw new Error('Plugin is not initialized.');
                }
                // Load and visualize the molecule
                await plugin.dataTransaction(async () => {
                    if (plugin) {
                        const data = await plugin.builders.data.download(
                            { url: moleculeUrl },
                            { state: { isGhost: true } }
                        );
                        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
                        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
                    }
                });
            } catch (error) {
                console.error('Error loading molecule:', error);
            }
        };

        initializePlugin();



        // Cleanup on unmount
        return () => {
            // Dispose of the plugin
            if (pluginRef.current) {
                console.log('Cleaning up plugin for container:', viewerRef.current);
                console.log('Disposing of existing plugin instance:', pluginRef.current);
                pluginRef.current.dispose();
                pluginRef.current = null;
            }

            // Safely unmount the React root
            if (rootRef.current) {
                Promise.resolve().then(() => {
                    rootRef.current?.unmount();
                    rootRef.current = null; // Reset the root reference
                });
            }
        };
    }, [moleculeUrl]);

    return (
        <div
            ref={viewerRef}
            id={`msp-container-${moleculeUrl}`} // Ensure unique ID based on moleculeUrl
            className="msp-container" // Apply CSS class for styling
        >
            {/* Canvas for Molstar */}
            <canvas
                id={`msp-canvas-${moleculeUrl}`}
                className="msp-canvas"
            />
            {/* Log for Molstar */}
            <div
                id={`molstar-log-${moleculeUrl}`}
                className="msp-log"
            />
        </div>
    );
};

export default MolstarContainer;